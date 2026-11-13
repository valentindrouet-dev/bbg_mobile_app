import { useRef, useState, type ReactNode } from 'react'
import { Trash } from '../icons'

const REVEAL = 96 // width of each action, px

export type Side = 'dup' | 'del' | null
type Props = {
  children: ReactNode
  open: Side
  onOpen: (s: Exclude<Side, null>) => void
  onClose: () => void
  onDelete: () => void
  onDuplicate: () => void
}

const Copy = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
  </svg>
)

/** Row that slides left to reveal "delete" and right to reveal "duplicate". */
export default function SwipeRow({ children, open, onOpen, onClose, onDelete, onDuplicate }: Props) {
  const [dx, setDx] = useState<number | null>(null)
  const start = useRef<{ x: number; y: number; base: number; dir: 'h' | 'v' | null } | null>(null)
  const moved = useRef(false)
  const rest = open === 'del' ? -REVEAL : open === 'dup' ? REVEAL : 0
  const offset = dx ?? rest

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, base: rest, dir: null }
    moved.current = false
  }
  const move = (e: React.PointerEvent) => {
    const s = start.current
    if (!s) return
    const mx = e.clientX - s.x, my = e.clientY - s.y
    if (!s.dir) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return
      s.dir = Math.abs(mx) > Math.abs(my) ? 'h' : 'v'
      if (s.dir === 'h') (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    if (s.dir !== 'h') return
    moved.current = true
    const max = REVEAL * 1.6
    setDx(Math.max(-max, Math.min(max, s.base + mx)))
  }
  const up = () => {
    const s = start.current
    start.current = null
    if (!s || s.dir !== 'h' || dx == null) { setDx(null); return }
    if (dx < -REVEAL / 2) onOpen('del')
    else if (dx > REVEAL / 2) onOpen('dup')
    else onClose()
    setDx(null)
  }
  const side = offset < 0 ? 'del' : offset > 0 ? 'dup' : null

  return (
    <div className="swipe">
      {side === 'dup' && (
        <button className="swipe-act swipe-dup" aria-label="Dupliquer" onClick={onDuplicate}>
          <Copy /><span>Dupliquer</span>
        </button>
      )}
      {side === 'del' && (
        <button className="swipe-act swipe-del" aria-label="Supprimer" onClick={onDelete}>
          <Trash /><span>Supprimer</span>
        </button>
      )}
      <div
        className={`swipe-front${dx == null ? ' snap' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onClickCapture={(e) => {
          if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false; return }
          if (open) { e.stopPropagation(); e.preventDefault(); onClose() }
        }}
      >
        {children}
      </div>
    </div>
  )
}
