import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-ink-600/60 bg-ink-900/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-signal to-vector flex items-center justify-center shadow-glow"
          >
            <Radio size={18} className="text-ink-950" strokeWidth={2.5} />
          </motion.div>
          <div>
            <h1 className="font-display font-semibold text-lg sm:text-xl tracking-tight text-mist-100">
              RAG Simulator
            </h1>
            <p className="text-xs text-mist-500 font-mono hidden sm:block">
              Experiment RAG step by step and visualize the flow of data through the pipeline.
            </p>
          </div>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono text-mist-500 hover:text-signal transition-colors hidden sm:block"
        >
          v1.0.0
        </a>
      </div>
    </header>
  )
}
