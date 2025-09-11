import './App.css'
import { Toolbar } from './components/Toolbar'
import { ColumnPicker } from './components/ColumnPicker'
import { RegressionPanel } from './components/RegressionPanel'
import { ReadabilityPanel } from './components/ReadabilityPanel'
import { ChartCanvas } from './components/ChartCanvas'
import { DataGridView } from './components/DataGridView'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)]">
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-3">
          <div className="h-7 w-7 rounded-md" style={{ background: 'linear-gradient(135deg,#60a5fa,#34d399)' }} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Graph Lab</h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Craft clean, beautiful infographics</p>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-col gap-5">
          <Toolbar />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 flex flex-col gap-4">
              <ColumnPicker />
              <RegressionPanel />
              <ReadabilityPanel />
            </div>
            <div className="lg:col-span-8">
              <ChartCanvas />
            </div>
          </div>
          <div>
            <DataGridView />
          </div>
        </div>
      </main>
    </div>
  )
}
