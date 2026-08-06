import { motion } from 'framer-motion'
import { FileStack, Scissors, Boxes, SearchCode, Sparkles, Loader2, Check, AlertTriangle } from 'lucide-react'
import { STEP_META } from '../lib/store'

const ICONS = {
  upload: FileStack,
  chunk: Scissors,
  index: Boxes,
  search: SearchCode,
  generate: Sparkles,
}

const STATUS_RING = {
  idle: 'ring-ink-500',
  running: 'ring-pulse shadow-glow-pulse',
  complete: 'ring-signal shadow-glow',
  error: 'ring-red-500 shadow-[0_0_24px_rgba(239,68,68,0.4)]',
}

export default function StepNode({ stepId, index, status, onClick }) {
  const Icon = ICONS[stepId]
  const meta = STEP_META[stepId]

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 180, damping: 16 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex flex-col items-center gap-3 w-full sm:w-40 focus:outline-none"
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-mist-500 group-hover:text-signal transition-colors">
          0{index + 1}
        </span>
      </div>

      <div
        className={`relative w-16 h-16 rounded-2xl bg-ink-700 border border-ink-500 ring-2 ${STATUS_RING[status]} flex items-center justify-center transition-all duration-300`}
      >
        {status === 'running' ? (
          <Loader2 size={22} className="text-pulse animate-spin" />
        ) : (
          <Icon
            size={22}
            className={
              status === 'complete'
                ? 'text-signal'
                : status === 'error'
                ? 'text-red-400'
                : 'text-mist-300 group-hover:text-signal transition-colors'
            }
          />
        )}

        {status === 'complete' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-signal flex items-center justify-center"
          >
            <Check size={12} className="text-ink-950" strokeWidth={3} />
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
          >
            <AlertTriangle size={11} className="text-ink-950" strokeWidth={3} />
          </motion.div>
        )}
      </div>

      <div className="text-center">
        <p className="font-display text-sm font-semibold text-mist-100">{meta.title}</p>
        <p className="text-[11px] text-mist-500 mt-0.5 leading-tight px-1">{meta.subtitle}</p>
      </div>
    </motion.button>
  )
}
