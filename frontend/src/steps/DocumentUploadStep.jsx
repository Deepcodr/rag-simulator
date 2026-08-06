import { useRef } from 'react'
import { FileText, Type, X, UploadCloud } from 'lucide-react'
import { useRagStore } from '../lib/store'
import Hint from '../components/Hint'

export default function DocumentUploadStep() {
  const config = useRagStore((s) => s.configs.upload)
  const step = useRagStore((s) => s.steps.upload)
  const updateConfig = useRagStore((s) => s.updateConfig)
  const runStep = useRagStore((s) => s.runStep)
  const fileInputRef = useRef(null)

  const handleFiles = (fileList) => {
    const files = Array.from(fileList).slice(0, 5)
    updateConfig('upload', { files })
  }

  const output = step.output

  return (
    <div className="space-y-6">
      <div>
        <div className="flex gap-2 mb-3">
          {[
            { id: 'text', label: 'Paste text', icon: Type },
            { id: 'pdf', label: 'Upload PDF', icon: FileText },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => updateConfig('upload', { mode: opt.id })}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                config.mode === opt.id
                  ? 'bg-signal/10 border-signal text-signal'
                  : 'border-ink-500 text-mist-400 hover:border-mist-500'
              }`}
            >
              <opt.icon size={15} />
              {opt.label}
            </button>
          ))}
        </div>

        {config.mode === 'text' ? (
          <div>
            <textarea
              value={config.textInput}
              onChange={(e) => updateConfig('upload', { textInput: e.target.value })}
              placeholder="Paste any passage, article, or notes you'd like the pipeline to ingest…"
              rows={8}
              className="w-full bg-ink-900 border border-ink-500 rounded-xl p-3 text-sm font-mono text-mist-100 placeholder:text-mist-500 focus:border-signal outline-none resize-none"
            />
            <Hint>Raw text is cleaned server-side: whitespace, line breaks, and hyphenation are normalized before chunking.</Hint>
          </div>
        ) : (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-ink-500 rounded-xl p-6 text-center cursor-pointer hover:border-signal/60 transition-colors"
            >
              <UploadCloud size={22} className="mx-auto text-mist-500 mb-2" />
              <p className="text-sm text-mist-300">Click to choose PDF files</p>
              <p className="text-xs text-mist-500 mt-1">Up to 5 files, 10MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
            {config.files.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {config.files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between bg-ink-900 border border-ink-500 rounded-lg px-3 py-2 text-xs text-mist-300">
                    <span className="truncate font-mono">{f.name}</span>
                    <button
                      onClick={() =>
                        updateConfig('upload', { files: config.files.filter((_, idx) => idx !== i) })
                      }
                      className="text-mist-500 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Hint>PDFs are parsed for text, then cleaned the same way as pasted text.</Hint>
          </div>
        )}
      </div>

      <button
        onClick={() => runStep('upload')}
        disabled={step.status === 'running'}
        className="w-full py-2.5 rounded-xl bg-signal text-ink-950 text-sm font-semibold hover:bg-signal-dim transition-colors disabled:opacity-50"
      >
        {step.status === 'running' ? 'Processing…' : 'Run this step'}
      </button>

      {step.error && <p className="text-xs text-red-400">{step.error}</p>}

      {output && (
        <div className="space-y-3 pt-4 border-t border-ink-600">
          <p className="text-xs uppercase tracking-wider text-mist-500 font-mono">Output</p>
          {output.documents.map((doc) => (
            <div key={doc.id} className="bg-ink-900 border border-ink-500 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-mist-100 truncate">{doc.name}</span>
                <span className="text-[10px] font-mono text-signal bg-signal/10 px-2 py-0.5 rounded-full uppercase">{doc.source_type}</span>
              </div>
              <p className="text-[11px] text-mist-500 font-mono mb-2">
                {doc.raw_char_count} → {doc.clean_char_count} chars after cleanup
              </p>
              <p className="text-xs text-mist-400 font-mono line-clamp-4">{doc.preview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
