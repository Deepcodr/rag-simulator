import { motion } from 'framer-motion'
import StepNode from './StepNode'
import { STEP_IDS } from '../lib/store'

function Connector({ active }) {
  return (
    <>
      <div className="hidden sm:flex flex-1 items-center relative h-16 min-w-[24px]">
        <div className="w-full h-px bg-ink-500" />
        {active && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-pulse shadow-glow-pulse"
            initial={{ left: '0%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        <div className="absolute inset-0 h-px top-1/2 bg-gradient-to-r from-transparent via-signal/40 to-transparent" />
      </div>
      <div className="sm:hidden relative w-px h-8 mx-auto">
        <div className="w-px h-full bg-ink-500 mx-auto" />
        {active && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-pulse shadow-glow-pulse"
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
    </>
  )
}

export default function FlowDiagram({ steps, onStepClick }) {
  return (
    <div className="rounded-3xl border border-ink-600/60 bg-ink-800/40 p-5 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid bg-grid opacity-40 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-start">
        {STEP_IDS.map((stepId, i) => {
          const isLast = i === STEP_IDS.length - 1
          const currentStatus = steps[stepId].status
          const nextRunning =
            currentStatus === 'complete' &&
            !isLast &&
            (steps[STEP_IDS[i + 1]].status === 'running' || steps[STEP_IDS[i + 1]].status === 'complete')
          return (
            <div key={stepId} className="flex flex-col sm:flex-row sm:items-start sm:flex-1">
              <StepNode
                stepId={stepId}
                index={i}
                status={currentStatus}
                onClick={() => onStepClick(stepId)}
              />
              {!isLast && <Connector active={currentStatus === 'running' || nextRunning} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
