import { DataEditor, GridCellKind } from '@glideapps/glide-data-grid'
import type { Theme } from '@glideapps/glide-data-grid'
import type { GridCell, GridColumn } from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'
import { useMemo, useState } from 'react'
import { useDatasetStore } from '../state/store'
import { parseNumeric } from '../utils/number'

export function DataGridView() {
  const table = useDatasetStore((s) => s.table)
  const setCell = useDatasetStore((s) => s.setCell)
  const addRow = useDatasetStore((s) => s.addRow)
  const [height, setHeight] = useState(300)

  const cols: GridColumn[] = useMemo(
    () =>
      table.columns.map((c) => ({
        id: c.key,
        title: c.name,
        width: 120,
      })),
    [table.columns]
  )

  const rows = table.columns[0]?.values.length ?? 0

  function getCell([col, row]: readonly [number, number]): GridCell {
    const c = table.columns[col]
    const v = c.values[row]
    return {
      kind: GridCellKind.Text,
      displayData: v == null ? '' : String(v),
      data: v == null ? '' : String(v),
      allowOverlay: true,
    }
  }

  return (
    <div className="panel">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="font-medium">Data</div>
        <button className="btn" onClick={addRow}>+ Row</button>
      </div>
      <DataEditor
        theme={darkGridTheme}
        getCellContent={getCell}
        columns={cols}
        rows={rows}
        onPaste={(target, values) => {
          const startCol = target[0]
          const startRow = target[1]
          for (let r = 0; r < values.length; r++) {
            const rowVals = values[r] as any
            for (let c = 0; c < rowVals.length; c++) {
              const colIdx = startCol + c
              const rowIdx = startRow + r
              const colKey = table.columns[colIdx]?.key
              if (!colKey) continue
              const parsed = parseNumeric(rowVals[c]?.data ?? rowVals[c] ?? '')
              setCell(colKey, rowIdx, parsed)
            }
          }
          return true
        }}
        onCellEdited={(loc, newVal) => {
          const [col, row] = loc
          const colKey = table.columns[col]?.key
          if (!colKey) return
          const parsed = parseNumeric((newVal as any).data ?? '')
          setCell(colKey, row, parsed)
        }}
        height={height}
        onVisibleRegionChanged={(r) => setHeight(Math.max(200, Math.min(600, r.height + 40)))}
      />
    </div>
  )
}

const darkGridTheme: Partial<Theme> = {
  // text
  textDark: '#e5e7eb',
  textMedium: '#cbd5e1',
  textLight: '#94a3b8',
  textHeader: '#e5e7eb',
  textHeaderSelected: '#0b0f14',
  textBubble: '#0b0f14',
  // backgrounds
  bgCell: '#0f172a',
  bgCellMedium: '#0b1220',
  bgHeader: '#0b1220',
  bgHeaderHasFocus: '#0d1526',
  bgHeaderHovered: '#0d1526',
  bgBubble: '#94a3b81a',
  bgBubbleSelected: '#0f172a',
  bgSearchResult: '#fde68a33',
  // borders
  borderColor: 'rgba(255,255,255,0.08)',
  horizontalBorderColor: 'rgba(255,255,255,0.06)',
  headerBottomBorderColor: 'rgba(255,255,255,0.08)',
  // accent
  accentColor: '#60a5fa',
  accentFg: '#0b0f14',
  accentLight: 'rgba(96,165,250,0.15)',
  linkColor: '#60a5fa',
  // typography
  baseFontStyle: '13px',
  headerFontStyle: '600 13px',
  markerFontStyle: '10px',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  editorFontSize: '13px',
  lineHeight: 1.4,
  // spacing
  cellHorizontalPadding: 8,
  cellVerticalPadding: 4,
  roundingRadius: 8,
}
