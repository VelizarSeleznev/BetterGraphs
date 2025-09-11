export type ColumnType = 'number' | 'text'

export interface Column {
  key: string
  name: string
  unit?: string
  values: Array<number | null>
  type: ColumnType
}

export interface TableData {
  columns: Column[]
  // Invariant: all columns share same row count
}

export type PlotMode = 'scatter' | 'line'

export interface PlotSpec {
  xKey: string
  yKey: string
  mode: PlotMode
  axisLabelX: string
  axisLabelY: string
  color?: string // legacy common color
  lineColor?: string
  pointColor?: string
  lineWidth?: number
  pointRadius?: number
}

export interface RegressionResult {
  a: number
  b: number
  r2: number
  n: number
}

export interface RegressionSpec {
  enabled: boolean
  throughZero: boolean
  result?: RegressionResult
  error?: string
}

export interface ViewSpec {
  aspect: number // width/height
  normalize: boolean
  logX: boolean
  logY: boolean
  domainX?: [number, number]
  domainY?: [number, number]
  margins: { top: number; right: number; bottom: number; left: number }
}

export interface DatasetState {
  table: TableData
  plot: PlotSpec
  regression: RegressionSpec
  view: ViewSpec
}

export interface XYPair { x: number; y: number }
