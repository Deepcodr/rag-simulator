import { useRagStore } from '../lib/store'
import Hint from '../components/Hint'

const STRATEGIES = [
  { id: 'recursive', label: 'Recursive', desc: 'Splits on paragraphs, then sentences' },
  { id: 'sentence', label: 'Sentence', desc: 'Splits on sentence boundaries' },
  { id: 'fixed', label: 'Fixed', desc: 'Splits on raw character windows' },
]

export default function ChunkingStep() {
  const config = useRagStore((s) => s.configs.chunk)
  const step = useRagStore((s) => s.steps.chunk)
  const uploadStatus = useRagStore((s) => s.steps.upload.status)
  const updateConfig = useRagStore((s) => s.updateConfig)
  const runStep = useRagStore((s) => s.runStep)

  const output = step.output
  const blocked = uploadStatus !== 'complete'

  return (
    <div className="space-y-6">
      {blocked && <Hint>Run the Data Collection step first — chunking needs ingested text to work with.</Hint>}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm text-mist-300">Chunk size</label>
          <span className="text-xs font-mono text-signal">{config.chunkSize} chars</span>
        </div>
        <input
          type="range"
          min={100}
          max={2000}
          step={50}
          value={config.chunkSize}
          onChange={(e) => updateConfig('chunk', { chunkSize: Number(e.target.value) })}
          className="w-full accent-signal"
        />
        <Hint>How many characters each chunk holds before it's split again.</Hint>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm text-mist-300">Chunk overlap</label>
          <span className="text-xs font-mono text-signal">{config.chunkOverlap} chars</span>
        </div>
        <input
          type="range"
          min={0}
          max={400}
          step={10}
          value={config.chunkOverlap}
          onChange={(e) => updateConfig('chunk', { chunkOverlap: Number(e.target.value) })}
          className="w-full accent-signal"
        />
        <Hint>Shared characters between consecutive chunks, helps preserve context across boundaries.</Hint>
      </div>

      <div>
        <label className="text-sm text-mist-300 mb-2 block">Split strategy</label>
        <div className="grid grid-cols-1 gap-2">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => updateConfig('chunk', { strategy: s.id })}
              className={`text-left px-3 py-2.5 rounded-xl border transition-colors ${
                config.strategy === s.id
                  ? 'bg-signal/10 border-signal'
                  : 'border-ink-500 hover:border-mist-500'
              }`}
            >
              <p className={`text-sm font-medium ${config.strategy === s.id ? 'text-signal' : 'text-mist-200'}`}>{s.label}</p>
              <p className="text-[11px] text-mist-500">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => runStep('chunk')}
        disabled={step.status === 'running' || blocked}
        className="w-full py-2.5 rounded-xl bg-signal text-ink-950 text-sm font-semibold hover:bg-signal-dim transition-colors disabled:opacity-50"
      >
        {step.status === 'running' ? 'Chunking…' : 'Run this step'}
      </button>

      {step.error && <p className="text-xs text-red-400">{step.error}</p>}

      {output && (
        <div className="space-y-2 pt-4 border-t border-ink-600">
          <p className="text-xs uppercase tracking-wider text-mist-500 font-mono">
            {output.chunks.length} chunks
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
            {output.chunks.map((c) => (
              <div key={c.id} className="bg-ink-900 border border-ink-500 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-vector">{c.doc_name} #{c.index}</span>
                  <span className="text-[10px] font-mono text-mist-500">{c.char_count} chars</span>
                </div>
                <p className="text-xs text-mist-400 font-mono line-clamp-3">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
