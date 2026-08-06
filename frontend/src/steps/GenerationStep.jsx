import { useState } from 'react'
import { useRagStore } from '../lib/store'
import Hint from '../components/Hint'
import { Sparkles, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const MODELS = [
  { id: 'gemma-2-2b-it', label: 'Gemma 2 · 2B Instruct' },
  { id: 'llama-3.2-1b-instruct', label: 'Llama 3.2 · 1B Instruct' },
  { id: 'qwen2', label: 'Qwen 2.5 · 1.5B Instruct' },
]

export default function GenerationStep() {
  const config = useRagStore((s) => s.configs.generate)
  const step = useRagStore((s) => s.steps.generate)
  const indexStatus = useRagStore((s) => s.steps.index.status)
  const updateConfig = useRagStore((s) => s.updateConfig)
  const runStep = useRagStore((s) => s.runStep)
  const [showPrompt, setShowPrompt] = useState(false)

  const output = step.output
  const blocked = indexStatus !== 'complete'

  return (
    <div className="space-y-6">
      {blocked && <Hint>Run the Indexing step first — generation retrieves context before prompting the model.</Hint>}

      <div>
        <label className="text-sm text-mist-300 mb-1.5 block">Your question</label>
        <textarea
          value={config.query}
          onChange={(e) => updateConfig('generate', { query: e.target.value })}
          rows={3}
          className="w-full bg-ink-900 border border-ink-500 rounded-xl p-3 text-sm text-mist-100 placeholder:text-mist-500 focus:border-signal outline-none resize-none"
          placeholder="What do you want to ask about the document?"
        />
      </div>

      <div>
        <label className="text-sm text-mist-300 mb-2 block">Model</label>
        <div className="grid grid-cols-1 gap-2">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => updateConfig('generate', { modelId: m.id })}
              className={`text-left px-3 py-2.5 rounded-xl border transition-colors flex items-center gap-2 ${config.modelId === m.id ? 'bg-signal/10 border-signal text-signal' : 'border-ink-500 text-mist-300 hover:border-mist-500'
                }`}
            >
              <Sparkles size={14} />
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          ))}
        </div>
        <Hint>All three models are open source and hosted on free platform.</Hint>
        <Hint>
          The first generation request may take a few minutes to complete, as model containers require a warm up.
        </Hint>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm text-mist-300">Max tokens</label>
          <span className="text-xs font-mono text-signal">{config.maxTokens}</span>
        </div>
        <input
          type="range"
          min={64}
          max={1024}
          step={32}
          value={config.maxTokens}
          onChange={(e) => updateConfig('generate', { maxTokens: Number(e.target.value) })}
          className="w-full accent-signal"
        />
      </div>

      <button
        onClick={() => runStep('generate')}
        disabled={step.status === 'running' || blocked || !config.query.trim()}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-signal to-vector text-ink-950 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {step.status === 'running' ? 'Generating…' : 'Generate answer'}
      </button>

      {step.error && <p className="text-xs text-red-400">{step.error}</p>}

      {output && (
        <div className="space-y-4 pt-4 border-t border-ink-600">
          <div>
            <button
              onClick={() => setShowPrompt((v) => !v)}
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-mist-500 font-mono hover:text-signal transition-colors"
            >
              Context prompt sent to the model
              {showPrompt ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showPrompt && (
              <pre className="mt-2 bg-ink-900 border border-ink-500 rounded-xl p-3 text-[11px] font-mono text-mist-400 whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin">
                {output.context_prompt}
              </pre>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs uppercase tracking-wider text-mist-500 font-mono">Answer</p>
              <span className="flex items-center gap-1 text-[10px] font-mono text-mist-500">
                <Clock size={11} /> {output.latency_ms}ms
              </span>
            </div>
            <div className="bg-ink-900 border border-signal/40 rounded-xl p-3.5 text-sm text-mist-100 leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-2 prose-strong:text-signal prose-headings:text-mist-100 prose-li:my-0.5">
              +              <ReactMarkdown>{output.answer}</ReactMarkdown>
              +            </div>
          </div>
        </div>
      )}
    </div>
  )
}
