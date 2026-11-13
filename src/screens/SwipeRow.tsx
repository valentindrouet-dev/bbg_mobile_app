import { useRef, useState, type ReactNode } from 'react'
import { Trash } from '../icons'

const REVEAL = 96 // width of the delete action, px

type Props = { children: ReactNode; onOpen: () => void; onDelete: () => void; open: boolean; onClose: () => void }

/** Row that slides left to reveal a delete action. */
export default function SwipeRow({ children, onOpen, onDelete, open, onClose }: Props) {
  const [dx, setDx] = useState<number | null>(null)
  const start = useRef<{ x: number; y: number; base: number; dir: 'h' | 'v' | null } | null>(null)
  const moved = useRef(false)
  const offset = dx ?? (open ? -REVEAL : 0)

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, base: open ? -REVEAL : 0, dir: null }
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
    setDx(Math.max(-REVEAL * 1.6, Math.min(0, s.base + mx)))
  }
  const up = () => {
    const s = start.current
    start.current = null
    if (!s || s.dir !== 'h' || dx == null) { setDx(null); return }
    if (dx < -REVEAL / 2) onOpen(); else onClose()
    setDx(null)
  }

  return (
    <div className="swipe">
      <button className="swipe-del" aria-label="Supprimer" tabIndex={open ? 0 : -1} onClick={onDelete}>
        <Trash /><span>Supprimer</span>
      </button>
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
