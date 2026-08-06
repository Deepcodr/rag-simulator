import { useRagStore } from '../lib/store'
import VectorGraph from '../components/VectorGraph'
import Hint from '../components/Hint'
import { Boxes } from 'lucide-react'

export default function IndexingStep() {
  const step = useRagStore((s) => s.steps.index)
  const chunkStatus = useRagStore((s) => s.steps.chunk.status)
  const runStep = useRagStore((s) => s.runStep)

  const output = step.output
  const blocked = chunkStatus !== 'complete'

  return (
    <div className="space-y-6">
      {blocked && <Hint>Run the Chunking step first — indexing needs chunks to embed.</Hint>}

      <div className="bg-ink-900 border border-ink-500 rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-vector/10 flex items-center justify-center shrink-0">
          <Boxes size={16} className="text-vector" />
        </div>
        <div>
          <p className="text-sm text-mist-100 font-medium">
            {output?.embedding_model || 'bge-small-en-v1.5'}
          </p>
          <p className="text-[11px] text-mist-500">
            Fixed embedding model, hosted on Modal &middot; {output ? `${output.vector_dim} dims` : 'dims shown after indexing'}
          </p>
        </div>
      </div>
      <Hint>Every chunk is embedded into a high-dimensional vector, then projected to 2D (PCA) purely for visualization.</Hint>
      <Hint>
        The first indexing request may take a few minutes to complete, as model containers require a warm up.
      </Hint>

      <button
        onClick={() => runStep('index')}
        disabled={step.status === 'running' || blocked}
        className="w-full py-2.5 rounded-xl bg-signal text-ink-950 text-sm font-semibold hover:bg-signal-dim transition-colors disabled:opacity-50"
      >
        {step.status === 'running' ? 'Embedding & indexing…' : 'Run this step'}
      </button>

      {step.error && <p className="text-xs text-red-400">{step.error}</p>}

      {output && (
        <div className="space-y-3 pt-4 border-t border-ink-600">
          <p className="text-xs uppercase tracking-wider text-mist-500 font-mono">
            {output.points.length} vectors stored
          </p>
          <VectorGraph points={output.points} />
          <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
            {output.points.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-ink-900 border border-ink-500 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-mono text-mist-300 truncate">{p.label}</span>
                <span className="text-[10px] font-mono text-mist-500 shrink-0 ml-2">
                  ({p.x.toFixed(2)}, {p.y.toFixed(2)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
