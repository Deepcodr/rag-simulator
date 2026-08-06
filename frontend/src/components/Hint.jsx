import { Info } from 'lucide-react'

export default function Hint({ children }) {
  return (
    <p className="flex items-start gap-1.5 text-[11px] text-mist-500 mt-2 leading-relaxed">
      <Info size={12} className="mt-0.5 shrink-0 text-vector" />
      <span>{children}</span>
    </p>
  )
}
