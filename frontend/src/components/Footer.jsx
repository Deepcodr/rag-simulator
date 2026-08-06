import { Github, Heart } from 'lucide-react'

const CONTRIBUTORS = [
  { name: 'Deepcodr', role: 'Author & maintainer' },
]

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-ink-600/60 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="text-sm font-display text-mist-100">RAG Simulator</p>
          <p className="text-xs text-mist-500 mt-1 font-mono">
            &copy; {year} RAG Simulator &middot; MIT License
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2 text-xs text-mist-500">
            <Heart size={13} className="text-pulse" />
            <span>Built by</span>
            {CONTRIBUTORS.map((c) => (
              <span key={c.name} className="text-mist-300">{c.name}</span>
            ))}
          </div>
          <a
            href="https://github.com/deepcodr/rag-simulator"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-mist-500 hover:text-signal transition-colors"
          >
            <Github size={14} />
            Repository
          </a>
        </div>
      </div>
    </footer>
  )
}
