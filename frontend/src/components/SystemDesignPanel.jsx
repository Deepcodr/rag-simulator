import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Network, Trash2 } from 'lucide-react'

const TYPE_COLORS = {
  DOC_INGEST: '#5EEAD4',
  CHUNK_SPLIT: '#FB923C',
  EMBEDDING_CALL: '#C084FC',
  VECTOR_INDEX: '#60A5FA',
  VECTOR_SEARCH: '#60A5FA',
  PROMPT_BUILD: '#7C8AA8',
  LLM_INFERENCE: '#F472B6',
  RESPONSE: '#34D399',
  ERROR: '#F87171',
}

const TYPE_ICONS = {
  DOC_INGEST: '📄',
  CHUNK_SPLIT: '✂️',
  EMBEDDING_CALL: '🧮',
  VECTOR_INDEX: '🗺️',
  VECTOR_SEARCH: '🔍',
  PROMPT_BUILD: '📝',
  LLM_INFERENCE: '🤖',
  RESPONSE: '✅',
  ERROR: '❌',
}

const LEGEND = [
  ['Ingest', TYPE_COLORS.DOC_INGEST],
  ['Chunk', TYPE_COLORS.CHUNK_SPLIT],
  ['Embedding', TYPE_COLORS.EMBEDDING_CALL],
  ['Vector', TYPE_COLORS.VECTOR_SEARCH],
  ['Prompt', TYPE_COLORS.PROMPT_BUILD],
  ['LLM', TYPE_COLORS.LLM_INFERENCE],
  ['Response', TYPE_COLORS.RESPONSE],
]

function groupByTrace(events) {
  const groups = []
  let current = null
  for (const e of events) {
    if (e.eventType === 'TRACE_START') {
      current = { traceId: e.traceId, label: e.label, timestamp: e.timestamp, steps: [] }
      groups.push(current)
    } else if (e.eventType === 'WORKFLOW_STEP') {
      if (!current || current.traceId !== e.traceId) {
        current = { traceId: e.traceId, label: e.traceLabel || '?', timestamp: e.timestamp, steps: [] }
        groups.push(current)
      }
      current.steps.push(e)
    }
  }
  return groups
}

export default function SystemDesignPanel({ events, connected, onClear }) {
  const [expanded, setExpanded] = useState(false)
  const traces = groupByTrace(events).slice(-8)

  return (
    <div className="rounded-3xl border border-ink-600/60 bg-ink-800/40 overflow-hidden mt-6">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-ink-700/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Network size={16} className="text-vector" />
          <span className="font-display font-semibold text-sm text-mist-100">System Design Panel</span>
          <span className="text-xs text-mist-500 font-mono hidden sm:inline">live request tracing</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full border ${connected ? 'border-signal/40 text-signal' : 'border-pulse/40 text-pulse'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-signal' : 'bg-pulse'}`} />
            {connected ? 'Connected' : 'Reconnecting…'}
          </span>
          <ChevronDown size={16} className={`text-mist-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-ink-600/60 pt-5 space-y-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {LEGEND.map(([label, color]) => (
                  <span key={label} className="flex items-center gap-1.5 text-[10px] font-mono text-mist-500">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    {label}
                  </span>
                ))}
                {onClear && events.length > 0 && (
                  <button
                    onClick={onClear}
                    className="ml-auto flex items-center gap-1 text-[10px] font-mono text-mist-500 hover:text-pulse transition-colors"
                  >
                    <Trash2 size={11} /> Clear
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-3 bg-ink-900/60 border border-ink-600/60 rounded-2xl p-3">
                {traces.length === 0 ? (
                  <p className="text-xs text-mist-500 font-mono text-center py-6">
                    Run a step to see live backend traces here.
                  </p>
                ) : (
                  traces.map((trace) => (
                    <div key={trace.traceId} className="border-l-2 border-vector/40 pl-3">
                      <p className="text-[11px] font-mono text-vector mb-1">{trace.label} <span className="text-mist-500">#{trace.traceId.slice(-6)}</span></p>
                      {trace.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 py-0.5">
                          <span className="text-xs shrink-0">{TYPE_ICONS[step.type] || '●'}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-medium" style={{ color: TYPE_COLORS[step.type] || '#8892b0' }}>
                                {step.name}
                              </span>
                              <span className="text-[10px] font-mono text-mist-500">{step.durationMs}ms</span>
                            </div>
                            {step.detail && <p className="text-[10px] text-mist-500 font-mono truncate">{step.detail}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
