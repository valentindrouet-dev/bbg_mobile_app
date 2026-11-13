import { useEffect, useState } from 'react'

// Game-length stopwatch, kept in storage so it survives the app being closed.
type State = { startedAt: number | null; elapsed: number }
const key = (gameId: string) => `bbg-chrono-${gameId}`
const read = (gameId: string): State => {
  try { return JSON.parse(localStorage.getItem(key(gameId)) || '') } catch { return { startedAt: null, elapsed: 0 } }
}

export const minutesOf = (ms: number) => (ms > 0 ? Math.ceil(ms / 60000) : 0)
export const clearChrono = (gameId: string) => localStorage.removeItem(key(gameId))

export function useChrono(gameId: string) {
  const [s, setS] = useState<State>(() => read(gameId))
  const [now, setNow] = useState(Date.now())
  const running = s.startedAt != null

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [running])

  const save = (n: State) => { setS(n); localStorage.setItem(key(gameId), JSON.stringify(n)) }
  const total = s.elapsed + (running ? now - (s.startedAt as number) : 0)

  /** Starts or resumes; on pause returns the elapsed time in ms. */
  const toggle = (): number | null => {
    const t = Date.now()
    if (running) {
      const elapsed = s.elapsed + t - (s.startedAt as number)
      save({ startedAt: null, elapsed })
      return elapsed
    }
    setNow(t)
    save({ startedAt: t, elapsed: s.elapsed })
    return null
  }

  return { running, total, toggle, hasTime: total > 0 }
}

export const fmtClock = (ms: number) => {
  const sec = Math.floor(ms / 1000)
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), r = sec % 60
  const mm = String(m).padStart(2, '0'), ss = String(r).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
