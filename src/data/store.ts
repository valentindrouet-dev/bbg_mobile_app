import { useEffect, useState } from 'react'

export type Partie = {
  id: string
  gameId: string
  date: number
  duration: number | null
  players: number | null
  location: string
  notes: string
  scores?: number[]
  names?: string[]
  winner?: string
  createdAt: number
}
export type PartieInput = Omit<Partie, 'id' | 'createdAt'>

const KEY = 'bbg-parties'
const LEGACY_KEY = 'bbg-dev-parties'
const listeners = new Set<() => void>()

const read = (): Partie[] => {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy && !localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, legacy)
      localStorage.removeItem(LEGACY_KEY)
    }
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch { return [] }
}
const write = (l: Partie[]) => {
  localStorage.setItem(KEY, JSON.stringify(l))
  listeners.forEach((f) => f())
}

window.addEventListener('storage', (e) => { if (e.key === KEY) listeners.forEach((f) => f()) })
navigator.storage?.persist?.().catch(() => undefined)

export const store = {
  subscribe(gameId: string, cb: (list: Partie[]) => void) {
    const f = () => cb(read().filter((p) => p.gameId === gameId).sort((a, b) => b.date - a.date))
    listeners.add(f); f()
    return () => { listeners.delete(f) }
  },
  async add(p: PartieInput) { write([...read(), { ...p, id: crypto.randomUUID(), createdAt: Date.now() }]) },
  async update(id: string, p: Partial<PartieInput>) { write(read().map((x) => (x.id === id ? { ...x, ...p } : x))) },
  async remove(id: string) { write(read().filter((x) => x.id !== id)) },
}

export function useParties(gameId: string) {
  const [list, setList] = useState<Partie[] | null>(null)
  useEffect(() => store.subscribe(gameId, setList), [gameId])
  return list
}
