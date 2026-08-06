import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SIZE = 320
const PAD = 28

function toSvg(x, y) {
  const sx = PAD + ((x + 1) / 2) * (SIZE - PAD * 2)
  const sy = PAD + ((1 - y) / 2) * (SIZE - PAD * 2)
  return [sx, sy]
}

export default function VectorGraph({ points = [], queryPoint = null, highlightIds = [] }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div className="relative w-full flex justify-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-sm">
        <defs>
          <radialGradient id="glowChunk" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glowQuery" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FB923C" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FB923C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {Array.from({ length: 4 }).map((_, i) => (
          <circle
            key={i}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={((i + 1) / 4) * (SIZE / 2 - PAD)}
            fill="none"
            stroke="#26314A"
            strokeWidth="1"
          />
        ))}
        <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="#1B2438" />
        <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="#1B2438" />

        {queryPoint &&
          highlightIds.map((id) => {
            const p = points.find((pt) => pt.id === id)
            if (!p) return null
            const [qx, qy] = toSvg(queryPoint.x, queryPoint.y)
            const [cx, cy] = toSvg(p.x, p.y)
            return (
              <motion.line
                key={`line-${id}`}
                x1={qx}
                y1={qy}
                x2={cx}
                y2={cy}
                stroke="#FB923C"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 0.5 }}
              />
            )
          })}

        <AnimatePresence>
          {points.map((p, i) => {
            const [cx, cy] = toSvg(p.x, p.y)
            const isHighlighted = highlightIds.includes(p.id)
            return (
              <motion.g
                key={p.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02, type: 'spring', stiffness: 260, damping: 18 }}
                onMouseEnter={() => setHovered(p)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                {isHighlighted && <circle cx={cx} cy={cy} r={14} fill="url(#glowChunk)" />}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHighlighted ? 5.5 : 4}
                  fill={isHighlighted ? '#5EEAD4' : '#7C8AA8'}
                  stroke={isHighlighted ? '#5EEAD4' : 'transparent'}
                  strokeWidth="1"
                />
              </motion.g>
            )
          })}
        </AnimatePresence>

        {queryPoint && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            onMouseEnter={() => setHovered({ ...queryPoint, chunk_preview: queryPoint.chunk_preview || queryPoint.label })}
            onMouseLeave={() => setHovered(null)}
          >
            <circle cx={toSvg(queryPoint.x, queryPoint.y)[0]} cy={toSvg(queryPoint.x, queryPoint.y)[1]} r={18} fill="url(#glowQuery)" />
            <circle
              cx={toSvg(queryPoint.x, queryPoint.y)[0]}
              cy={toSvg(queryPoint.x, queryPoint.y)[1]}
              r={6.5}
              fill="#FB923C"
              stroke="#0B0F19"
              strokeWidth="1.5"
            />
          </motion.g>
        )}
      </svg>

      {hovered && (
        <div className="absolute top-2 left-2 right-2 bg-ink-950/95 border border-ink-500 rounded-lg p-2.5 text-[11px] font-mono text-mist-300 max-w-[85%] shadow-xl">
          <p className="text-signal mb-1">{hovered.label}</p>
          <p className="line-clamp-3 text-mist-500">{hovered.chunk_preview}</p>
        </div>
      )}
    </div>
  )
}
