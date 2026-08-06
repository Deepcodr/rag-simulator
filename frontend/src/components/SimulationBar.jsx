import { motion } from 'framer-motion'
import { Play, RotateCcw, Loader2 } from 'lucide-react'
import { STEP_IDS } from '../lib/store'

export default function SimulationBar({ steps, isSimulating, onStart, onReset }) {
  const completed = STEP_IDS.filter((id) => steps[id].status === 'complete').length
  const progress = (completed / STEP_IDS.length) * 100

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-emerald-100 tracking-tight">
          Watch retrieval-augmented generation happen
        </h2>
        <p className="text-sm text-mist-500 mt-1 max-w-xl">
          Click any step below to tweak its inputs and inspect its output, or run the whole pipeline start to finish.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onReset}
          disabled={isSimulating}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-ink-500 text-mist-300 text-sm font-medium hover:border-mist-500 hover:text-mist-100 transition-colors disabled:opacity-40"
        >
          <RotateCcw size={15} />
          Reset
        </button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          disabled={isSimulating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-signal to-vector text-ink-950 text-sm font-semibold shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
          {isSimulating ? 'Simulating…' : 'Start simulation'}
        </motion.button>
      </div>

      <div className="hidden" aria-hidden>{progress}</div>
    </div>
  )
}
