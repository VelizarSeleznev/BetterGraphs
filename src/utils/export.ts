export function downloadSVG(svgId: string) {
  const el = document.getElementById(svgId) as SVGSVGElement | null
  if (!el) return
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(el)
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'chart.svg'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadPNG(svgId: string, scale = 2) {
  const el = document.getElementById(svgId) as SVGSVGElement | null
  if (!el) return
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(el)
  const img = new Image()
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  await new Promise<void>((resolve) => {
    img.onload = () => resolve()
    img.src = url
  })
  const w = el.viewBox.baseVal?.width || el.width.baseVal.value
  const h = el.viewBox.baseVal?.height || el.height.baseVal.value
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')!
  // Use app panel background to match dark theme
  const panelBg = getComputedStyle(document.documentElement).getPropertyValue('--panel')?.trim() || '#0b0f14'
  ctx.fillStyle = panelBg
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  canvas.toBlob((blob) => {
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'chart.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }, 'image/png')
  URL.revokeObjectURL(url)
}
