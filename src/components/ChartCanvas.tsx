import { useEffect, useMemo, useRef, useState } from 'react'
import { useDatasetStore } from '../state/store'
import { applyDisplayTransforms, autoDomain, estimateScreenSlope } from '../utils/transforms'
import { scaleLinear } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { GridRows, GridColumns } from '@visx/grid'
import { LinePath } from '@visx/shape'

export function ChartCanvas() {
  const plot = useDatasetStore((s) => s.plot)
  const view = useDatasetStore((s) => s.view)
  // Avoid subscribing to numericPairs() directly since it returns a new array
  // on any store change, which caused an effect loop when regression updates.
  const table = useDatasetStore((s) => s.table)
  const pairsRaw = useMemo(() => {
    const xCol = table.columns.find((c) => c.key === plot.xKey)
    const yCol = table.columns.find((c) => c.key === plot.yKey)
    if (!xCol || !yCol) return [] as { x: number; y: number }[]
    const out: { x: number; y: number }[] = []
    const n = Math.max(xCol.values.length, yCol.values.length)
    for (let i = 0; i < n; i++) {
      const x = xCol.values[i]
      const y = yCol.values[i]
      if (typeof x === 'number' && Number.isFinite(x) && typeof y === 'number' && Number.isFinite(y)) {
        out.push({ x, y })
      }
    }
    return out
  }, [table, plot.xKey, plot.yKey])
  const regression = useDatasetStore((s) => s.regression)
  const prediction = useDatasetStore((s) => s.prediction)
  const recompute = useDatasetStore((s) => s.recomputeRegression)
  useEffect(() => {
    if (regression.enabled) recompute()
  }, [pairsRaw, regression.enabled, regression.throughZero, regression.model])

  const [pairs, messages] = applyDisplayTransforms(pairsRaw, view)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(800)
  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setWidth(e.contentRect.width)
      }
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])
  const height = Math.max(200, Math.round(width / (view.aspect || 1)))

  // compute predicted point (data coords) if enabled
  const predicted = useMemo(() => {
    if (!prediction.enabled || !regression.enabled || !regression.result) return undefined as undefined | { x: number; y: number }
    const v = prediction.value
    if (!Number.isFinite(v as number)) return undefined
    const { a, b } = regression.result
    const isQuad = (regression.result.model || 'linear') === 'quadratic'
    if (prediction.mode === 'x') {
      const x = v as number
      const y = isQuad ? (a * x * x + b * x + (regression.result.c as number)) : (a * x + b)
      if (!Number.isFinite(y)) return undefined
      return { x, y }
    } else {
      const y = v as number
      if (!isQuad) {
        if (a === 0) return undefined
        const x = (y - b) / a
        if (!Number.isFinite(x)) return undefined
        return { x, y }
      } else {
        const c = regression.result.c as number
        const A = a
        const B = b
        const C = c - y
        if (Math.abs(A) < 1e-12) {
          if (B === 0) return undefined
          const x = -C / B
          if (!Number.isFinite(x)) return undefined
          return { x, y }
        }
        const D = B * B - 4 * A * C
        if (D < 0) return undefined
        const r1 = (-B - Math.sign(B) * Math.sqrt(D)) / (2 * A)
        const r2 = C / (A * r1) * -1
        // pick root nearest to x domain center
        const [xxMin, xxMax] = view.domainX ?? autoDomain(pairs.map((p) => p.x))
        const xc = (xxMin + xxMax) / 2
        const x = Math.abs(r1 - xc) <= Math.abs(r2 - xc) ? r1 : r2
        if (!Number.isFinite(x)) return undefined
        return { x, y }
      }
    }
  }, [prediction.enabled, prediction.mode, prediction.value, regression.enabled, regression.result, view.domainX, pairs])

  const xVals = useMemo(() => [...pairs.map((p) => p.x), ...(predicted ? [predicted.x] : [])], [pairs, predicted])
  const yVals = useMemo(() => [...pairs.map((p) => p.y), ...(predicted ? [predicted.y] : [])], [pairs, predicted])
  const domainX = view.domainX ?? autoDomain(xVals)
  const domainY = view.domainY ?? autoDomain(yVals)

  const xScale = useMemo(() => scaleLinear<number>({ domain: domainX, range: [view.margins.left, width - view.margins.right] }), [domainX, width])
  // Provide extra bottom margin when regression annotation is shown so it doesn't overlap X axis
  // Add generous space below for both equation and axis label
  const bottomMargin = useMemo(() => view.margins.bottom + (regression.enabled ? 56 : 0), [view.margins.bottom, regression.enabled])
  const yScale = useMemo(() => scaleLinear<number>({ domain: domainY, range: [height - bottomMargin, view.margins.top] }), [domainY, height, bottomMargin])

  function fmtTick(n: any): string {
    const v = Number(n)
    if (!Number.isFinite(v)) return ''
    const abs = Math.abs(v)
    if (abs >= 1e6) return `${(v/1e6).toFixed(2)}M`
    if (abs >= 1e3) return `${(v/1e3).toFixed(2)}k`
    return v % 1 === 0 ? String(v) : v.toFixed(2)
  }

  const slopeWarn = useMemo(() => {
    if (!regression.enabled || !regression.result) return ''
    if ((regression.result.model || 'linear') === 'quadratic') return ''
    const scrSlope = estimateScreenSlope(regression.result.a, (xScale(1) - xScale(0)) || 1, (yScale(0) - yScale(1)) || 1)
    return scrSlope > 10 ? 'Line is very steep; consider log/normalize/adjust aspect.' : ''
  }, [regression.result, xScale, yScale])

  function toDataX(px: number) {
    return (xScale as any).invert(px)
  }
  function toDataY(py: number) {
    return (yScale as any).invert(py)
  }

  const [panning, setPanning] = useState<null | { x: number; y: number; dx: [number, number]; dy: [number, number] }>(null)

  const COLORS = {
    panel: '#0b0f14',
    grid: '#1f2937',
    axis: '#e5e7eb',
    muted: '#9aa1b2',
    data: '#e5e7eb',
    reg: '#60a5fa',
  }

  return (
    <div ref={containerRef} className="w-full select-none panel">
      <svg id="chart-root" width={width} height={height} role="img" aria-label="Scatter plot"
        onWheel={(e) => {
          e.preventDefault()
          const pt = e.nativeEvent as WheelEvent
          const rect = (e.target as SVGElement).getBoundingClientRect()
          const mx = pt.clientX - rect.left
          const my = pt.clientY - rect.top
          const zx = Math.exp(-Math.sign(e.deltaY) * 0.1)
          const zy = zx
          const x0 = toDataX(mx)
          const y0 = toDataY(my)
          const [xMin, xMax] = domainX
          const [yMin, yMax] = domainY
          const nxMin = x0 + (xMin - x0) * zx
          const nxMax = x0 + (xMax - x0) * zx
          const nyMin = y0 + (yMin - y0) * zy
          const nyMax = y0 + (yMax - y0) * zy
          useDatasetStore.getState().setDomains([nxMin, nxMax], [nyMin, nyMax])
        }}
        onMouseDown={(e) => {
          const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
          setPanning({ x: e.clientX - rect.left, y: e.clientY - rect.top, dx: domainX, dy: domainY })
        }}
        onMouseMove={(e) => {
          if (!panning) return
          const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
          const mx = e.clientX - rect.left
          const my = e.clientY - rect.top
          const dxPx = mx - panning.x
          const dyPx = my - panning.y
          const dxData = (xScale as any).invert(xScale(0) - dxPx) - (xScale as any).invert(xScale(0))
          const dyData = (yScale as any).invert(yScale(0) - dyPx) - (yScale as any).invert(yScale(0))
          const nx: [number, number] = [panning.dx[0] + dxData, panning.dx[1] + dxData]
          const ny: [number, number] = [panning.dy[0] + dyData, panning.dy[1] + dyData]
          useDatasetStore.getState().setDomains(nx, ny)
        }}
        onMouseUp={() => setPanning(null)}
        onMouseLeave={() => setPanning(null)}
        onDoubleClick={() => useDatasetStore.getState().setDomains(undefined, undefined)}
      >
        {/* clipping region for plot area */}
        <defs>
          <clipPath id="plot-clip">
            <rect
              x={view.margins.left}
              y={view.margins.top}
              width={width - view.margins.left - view.margins.right}
              height={height - view.margins.top - bottomMargin}
            />
          </clipPath>
        </defs>
        {/* background */}
        <rect x={0} y={0} width={width} height={height} fill={COLORS.panel} />
        {/* grid */}
        <GridRows scale={yScale} width={width - view.margins.left - view.margins.right} left={view.margins.left} stroke={COLORS.grid} strokeWidth={1} />
        <GridColumns scale={xScale} height={height - view.margins.top - bottomMargin} top={view.margins.top} stroke={COLORS.grid} strokeWidth={1} />
        {/* axes */}
        <AxisBottom
          top={height - bottomMargin}
          scale={xScale}
          stroke={COLORS.axis}
          tickStroke={COLORS.axis}
          tickFormat={fmtTick as any}
          tickLabelProps={() => ({ fill: COLORS.axis, fontSize: 12, dy: '0.5em' })}
        />
        <AxisLeft
          left={view.margins.left}
          scale={yScale}
          stroke={COLORS.axis}
          tickStroke={COLORS.axis}
          tickFormat={fmtTick as any}
          tickLabelProps={() => ({ fill: COLORS.axis, fontSize: 12, dx: -10, textAnchor: 'end' as any })}
        />
        {/* labels */}
        {/* X axis label placed well below the tick labels */}
        <text x={width / 2} y={height - bottomMargin + 40} textAnchor="middle" fill={COLORS.axis} fontSize={14} fontWeight={500}>{plot.axisLabelX}</text>
        <text x={16} y={height / 2} transform={`rotate(-90 16 ${height / 2})`} textAnchor="middle" fill={COLORS.axis} fontSize={14} fontWeight={500}>{plot.axisLabelY}</text>
        {/* data (clipped to plot area) */}
        <g clipPath="url(#plot-clip)">
          {/* regression under points */}
          {regression.enabled && regression.result && Number.isFinite(regression.result.a) && Number.isFinite(regression.result.b) && (
            (() => {
              const color = plot.lineColor || plot.color || COLORS.reg
              if ((regression.result.model || 'linear') === 'quadratic' && Number.isFinite(regression.result.c as number)) {
                const a = regression.result.a
                const b = regression.result.b
                const c = regression.result.c as number
                const x0 = domainX[0]
                const x1 = domainX[1]
                const steps = 100
                const data = Array.from({ length: steps + 1 }, (_, i) => {
                  const t = i / steps
                  const x = x0 + (x1 - x0) * t
                  const y = a * x * x + b * x + c
                  return { x, y }
                })
                return (
                  <LinePath
                    data={data}
                    x={(d) => xScale(d.x)}
                    y={(d) => yScale(d.y)}
                    stroke={color}
                    strokeWidth={3}
                  />
                )
              } else {
                const x0 = domainX[0]
                const x1 = domainX[1]
                const y0 = regression.result!.a * x0 + regression.result!.b
                const y1 = regression.result!.a * x1 + regression.result!.b
                return (
                  <LinePath
                    data={[{ x: x0, y: y0 }, { x: x1, y: y1 }]}
                    x={(d) => xScale(d.x)}
                    y={(d) => yScale(d.y)}
                    stroke={color}
                    strokeWidth={3}
                  />
                )
              }
            })()
          )}

          {plot.mode === 'line' ? (
            <LinePath
              data={pairs}
              x={(d) => xScale(d.x)}
              y={(d) => yScale(d.y)}
              stroke={plot.lineColor || plot.color || COLORS.data}
              strokeWidth={plot.lineWidth ?? 3}
            />
          ) : null}
          {pairs.map((p, i) => (
            <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={plot.pointRadius ?? 5.5} fill={plot.pointColor || plot.color || COLORS.data} />
          ))}
          {/* predicted point (draw atop series) */}
          {predicted && (
            <circle cx={xScale(predicted.x)} cy={yScale(predicted.y)} r={(plot.pointRadius ?? 5.5) + 1.5} fill={prediction.color || '#ff4d8d'} />
          )}
        </g>
        {/* label for predicted point outside clip so it's visible */}
        {predicted && (
          (() => {
            const px = xScale(predicted.x)
            const py = yScale(predicted.y)
            const left = px > width / 2
            const tx = left ? px - 8 : px + 8
            const anchor = left ? 'end' : 'start'
            const fmt = (n: number) => {
              const abs = Math.abs(n)
              if (abs >= 1e6) return `${(n/1e6).toFixed(2)}M`
              if (abs >= 1e3) return `${(n/1e3).toFixed(2)}k`
              return n % 1 === 0 ? String(n) : Number(n.toPrecision(4)).toString()
            }
            return (
              <g>
                <text x={tx} y={py - 8} textAnchor={anchor as any} fill={prediction.color || '#ff4d8d'} fontSize={12} fontWeight={600}>
                  ({fmt(predicted.x)}, {fmt(predicted.y)})
                </text>
              </g>
            )
          })()
        )}
        {/* regression annotation, large at bottom for export */}
        {regression.enabled && regression.result && (
          <g>
            {(() => {
              const a = regression.result!.a
              const b = regression.result!.b
              const c = regression.result!.c
              const r2 = regression.result!.r2
              const n = regression.result!.n
              function fmt(n: number, sig = 4) {
                if (!Number.isFinite(n)) return '—'
                return String(Number(n.toPrecision(sig)))
              }
              let eq: string
              if ((regression.result!.model || 'linear') === 'quadratic' && Number.isFinite(c as number)) {
                const cTerm = Number(c) >= 0 ? `+ ${fmt(Number(c))}` : `- ${fmt(Math.abs(Number(c)))}`
                const bTerm = Number(b) >= 0 ? `+ ${fmt(Number(b))}·x` : `- ${fmt(Math.abs(Number(b)))}·x`
                eq = `y = ${fmt(a)}·x² ${bTerm} ${cTerm}`
              } else {
                eq = `y = ${fmt(a)}·x + ${fmt(b)}`
              }
              const lines = [eq, `R² = ${fmt(r2, 4)}; N = ${n}`]
              const x = view.margins.left + 12
              const y = height - 8
              return (
                <g>
                  <text x={x} y={y - 18} textAnchor="start" fill={COLORS.axis} fontSize={16} fontWeight={600}>
                    {lines[0]}
                  </text>
                  <text x={x} y={y} textAnchor="start" fill={COLORS.axis} fontSize={14}>
                    {lines[1]}
                  </text>
                </g>
              )
            })()}
          </g>
        )}
      </svg>
      <div className="px-3 py-2 text-xs flex gap-4" style={{ color: 'var(--muted)' }}>
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
        {slopeWarn && <div>{slopeWarn}</div>}
      </div>
    </div>
  )
}
