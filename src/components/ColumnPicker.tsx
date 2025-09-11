import { useDatasetStore } from '../state/store'

export function ColumnPicker() {
  const table = useDatasetStore((s) => s.table)
  const plot = useDatasetStore((s) => s.plot)
  const setXY = useDatasetStore((s) => s.setXY)
  const setAxisLabels = useDatasetStore((s) => s.setAxisLabels)
  const setPlotStyle = useDatasetStore((s) => s.setPlotStyle)
  const numericCols = table.columns.filter((c) => c.type === 'number')
  const setMode = useDatasetStore((s) => s.setMode)
  return (
    <div className="panel p-4">
      <div className="font-medium mb-3">Pick Axes</div>
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <label className="text-sm" style={{ color: 'var(--muted)' }}>X</label>
        <select className="input" value={plot.xKey}
          onChange={(e) => setXY(e.target.value, plot.yKey)} aria-label="X column">
          {numericCols.map((c) => (
            <option value={c.key} key={c.key}>{c.name}</option>
          ))}
        </select>
        <label className="text-sm" style={{ color: 'var(--muted)' }}>Y</label>
        <select className="input" value={plot.yKey}
          onChange={(e) => setXY(plot.xKey, e.target.value)} aria-label="Y column">
          {numericCols.map((c) => (
            <option value={c.key} key={c.key}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="input" value={plot.axisLabelX} onChange={(e) => setAxisLabels(e.target.value, plot.axisLabelY)} aria-label="X label" />
        <input className="input" value={plot.axisLabelY} onChange={(e) => setAxisLabels(plot.axisLabelX, e.target.value)} aria-label="Y label" />
      </div>
      <div className="mt-3 text-sm flex items-center gap-3">
        <span style={{ color: 'var(--muted)' }}>Mode:</span>
        <label className="flex items-center gap-2"><input type="radio" name="mode" checked={plot.mode==='scatter'} onChange={() => setMode('scatter')} aria-label="Scatter"/> Scatter</label>
        <label className="flex items-center gap-2"><input type="radio" name="mode" checked={plot.mode==='line'} onChange={() => setMode('line')} aria-label="Line"/> Line</label>
      </div>

      <div className="mt-4">
        <div className="font-medium mb-2">Style</div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Line color</label>
          <select className="input" value={plot.lineColor ?? plot.color}
            onChange={(e) => setPlotStyle({ lineColor: e.target.value })} aria-label="Line color">
            {PRESET_COLORS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Point color</label>
          <select className="input" value={plot.pointColor ?? plot.color}
            onChange={(e) => setPlotStyle({ pointColor: e.target.value })} aria-label="Point color">
            {PRESET_COLORS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Line width</label>
          <input className="input" type="number" min={1} max={8} step={0.5}
            value={plot.lineWidth ?? 3}
            onChange={(e) => setPlotStyle({ lineWidth: Number(e.target.value) })}
            aria-label="Line width" />
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Point radius</label>
          <input className="input" type="number" min={2} max={12} step={0.5}
            value={plot.pointRadius ?? 5.5}
            onChange={(e) => setPlotStyle({ pointRadius: Number(e.target.value) })}
            aria-label="Point radius" />
        </div>
      </div>
    </div>
  )
}

const PRESET_COLORS = [
  { label: 'Sky (blue)', value: '#60a5fa' },
  { label: 'Mint (teal)', value: '#2bd9d9' },
  { label: 'Lime', value: '#a5ff3d' },
  { label: 'Fuchsia', value: '#ff4d8d' },
  { label: 'Orange', value: '#ffb84d' },
  { label: 'Purple', value: '#a78bfa' },
]
