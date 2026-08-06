import { AnimatePresence, motion } from 'framer-motion'
import { X, RefreshCw } from 'lucide-react'
import { useRagStore, STEP_META } from '../lib/store'
import DocumentUploadStep from '../steps/DocumentUploadStep'
import ChunkingStep from '../steps/ChunkingStep'
import IndexingStep from '../steps/IndexingStep'
import SearchStep from '../steps/SearchStep'
import GenerationStep from '../steps/GenerationStep'

const STEP_COMPONENTS = {
  upload: DocumentUploadStep,
  chunk: ChunkingStep,
  index: IndexingStep,
  search: SearchStep,
  generate: GenerationStep,
}

export default function StepPanel() {
  const activeStepId = useRagStore((s) => s.activeStepId)
  const closeStep = useRagStore((s) => s.closeStep)
  const runFromStep = useRagStore((s) => s.runFromStep)
  const isSimulating = useRagStore((s) => s.isSimulating)

  const Content = activeStepId ? STEP_COMPONENTS[activeStepId] : null
  const meta = activeStepId ? STEP_META[activeStepId] : null

  return (
    <AnimatePresence>
      {activeStepId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeStep}
            className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-ink-800 border-l border-ink-500 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-600 shrink-0">
              <div>
                <p className="font-display font-semibold text-mist-100">{meta.title}</p>
                <p className="text-xs text-mist-500">{meta.subtitle}</p>
              </div>
              <button onClick={closeStep} className="text-mist-500 hover:text-mist-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5">
              {Content && <Content />}
            </div>

            <div className="px-5 py-4 border-t border-ink-600 shrink-0">
              <button
                onClick={() => runFromStep(activeStepId)}
                disabled={isSimulating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-vector/50 text-vector text-sm font-medium hover:bg-vector/10 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={14} />
                Run simulation from this step
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
