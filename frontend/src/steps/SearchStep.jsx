import { useRagStore } from '../lib/store'
import VectorGraph from '../components/VectorGraph'
import Hint from '../components/Hint'

export default function SearchStep() {
  const config = useRagStore((s) => s.configs.search)
  const step = useRagStore((s) => s.steps.search)
  const indexStatus = useRagStore((s) => s.steps.index.status)
  const updateConfig = useRagStore((s) => s.updateConfig)
  const runStep = useRagStore((s) => s.runStep)

  const output = step.output
  const blocked = indexStatus !== 'complete'

  return (
    <div className="space-y-6">
      {blocked && <Hint>Run the Indexing step first — search needs vectors to compare against.</Hint>}

      <div>
        <label className="text-sm text-mist-300 mb-1.5 block">Your query</label>
        <textarea
          value={config.query}
          onChange={(e) => updateConfig('search', { query: e.target.value })}
          rows={3}
          className="w-full bg-ink-900 border border-ink-500 rounded-xl p-3 text-sm text-mist-100 placeholder:text-mist-500 focus:border-signal outline-none resize-none"
          placeholder="Ask something about the document…"
        />
        <Hint>The query is embedded with the same model, then compared against every chunk vector using cosine similarity.</Hint>
        <Hint>
          The first search request may take a few minutes to complete, as model containers require a warm up.
        </Hint>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm text-mist-300">Chunks to retrieve</label>
          <span className="text-xs font-mono text-signal">top {config.topK}</span>
        </div>
        <input
          type="range"
          min={1}
          max={8}
          value={config.topK}
          onChange={(e) => updateConfig('search', { topK: Number(e.target.value) })}
          className="w-full accent-signal"
        />
      </div>

      <button
        onClick={() => runStep('search')}
        disabled={step.status === 'running' || blocked || !config.query.trim()}
        className="w-full py-2.5 rounded-xl bg-signal text-ink-950 text-sm font-semibold hover:bg-signal-dim transition-colors disabled:opacity-50"
      >
        {step.status === 'running' ? 'Searching…' : 'Run this step'}
      </button>

      {step.error && <p className="text-xs text-red-400">{step.error}</p>}

      {output && (
        <div className="space-y-3 pt-4 border-t border-ink-600">
          <p className="text-xs uppercase tracking-wider text-mist-500 font-mono">
            Nearest {output.results.length} chunks
          </p>
          <VectorGraph
            points={output.all_points}
            queryPoint={output.query_point}
            highlightIds={output.results.map((r) => r.chunk_id)}
          />
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
            {output.results.map((r, i) => (
              <div key={r.chunk_id} className="bg-ink-900 border border-ink-500 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-vector">#{i + 1} &middot; {r.doc_name}</span>
                  <span className="text-[10px] font-mono text-signal">{(r.score * 100).toFixed(1)}% match</span>
                </div>
                <p className="text-xs text-mist-400 font-mono line-clamp-3">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
