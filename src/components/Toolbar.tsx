import { useDatasetStore } from '../state/store'
import { downloadSVG, downloadPNG } from '../utils/export'

export function Toolbar() {
  const addRow = useDatasetStore((s) => s.addRow)
  const fitNicely = useDatasetStore((s) => s.fitNicely)
  return (
    <div className="panel px-3 py-3 flex flex-wrap items-center gap-2">
      <button className="btn" onClick={addRow} aria-label="New row">+ Row</button>
      <ImportCSVButton />
      <ExportCSVButton />
      <button className="btn" onClick={() => downloadSVG('chart-root')} aria-label="Export SVG">Export SVG</button>
      <button className="btn" onClick={() => downloadPNG('chart-root')} aria-label="Export PNG">Export PNG</button>
      <div className="ml-auto" />
      <button className="btn-accent btn" onClick={fitNicely} aria-label="Fit nicely">Fit nicely</button>
    </div>
  )
}

import Papa from 'papaparse'
import { parseNumeric } from '../utils/number'
import type { Column, TableData } from '../types'
import { useRef, useState } from 'react'

function ImportCSVButton() {
  const fileInput = useRef<HTMLInputElement | null>(null)
  const setTable = useDatasetStore((s) => s.setTable)
  const onPick = () => fileInput.current?.click()
  const [preview, setPreview] = useState<string[][] | null>(null)
  return (
    <>
      <button className="btn" onClick={onPick} aria-label="Import CSV">Import CSV</button>
      <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0]
        if (!file) return
        Papa.parse<string[]>(file, {
          delimiter: '', // auto
          skipEmptyLines: true,
          complete: (res) => {
            const rows = res.data as string[][]
            setPreview(rows.slice(0, 10))
            // Map headers to columns
            const headers = rows[0] ?? []
            const dataRows = rows.slice(1)
            const cols: Column[] = headers.map((h, ci) => ({
              key: crypto.randomUUID(),
              name: String(h ?? `C${ci + 1}`),
              type: 'number',
              values: dataRows.map((r) => parseNumeric(String(r[ci] ?? '').trim())),
            }))
            const maxRows = Math.max(0, ...cols.map((c) => c.values.length))
            cols.forEach((c) => {
              if (c.values.length < maxRows) c.values = [...c.values, ...Array(maxRows - c.values.length).fill(null)]
            })
            const table: TableData = { columns: cols }
            setTable(table)
          },
        })
      }} />
      {preview && (
        <div className="text-xs" style={{ color: 'var(--muted)' }}>Loaded {preview.length} preview rows…</div>
      )}
    </>
  )
}

function ExportCSVButton() {
  const table = useDatasetStore((s) => s.table)
  const onExport = () => {
    const headers = table.columns.map((c) => c.name)
    const rows = [] as (string | number)[][]
    const n = table.columns[0]?.values.length ?? 0
    for (let i = 0; i < n; i++) {
      rows.push(table.columns.map((c) => (c.values[i] ?? '')))
    }
    const csv = Papa.unparse({ fields: headers, data: rows }, { quotes: false })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dataset.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  return (
    <button className="btn" onClick={onExport} aria-label="Export CSV">Export CSV</button>
  )
}
