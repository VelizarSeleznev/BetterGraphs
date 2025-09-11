export function parseNumeric(input: string): number | null {
  if (input == null) return null
  const trimmed = String(input).trim()
  if (trimmed === '') return null
  // Detect comma vs dot per token
  const hasComma = trimmed.includes(',')
  const hasDot = trimmed.includes('.')
  let normalized = trimmed
  if (hasComma && !hasDot) {
    // decimal comma
    normalized = trimmed.replace(',', '.')
  } else if (hasComma && hasDot) {
    // assume comma is thousands separator -> remove commas
    normalized = trimmed.replace(/,/g, '')
  }
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

