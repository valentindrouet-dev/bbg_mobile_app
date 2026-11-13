import { Save } from '../icons'

export type Val = number | null
const MAX_DIGITS = 3

export const typeDigit = (v: Val, d: number): Val => {
  const str = v == null ? '' : String(v)
  if (str.replace('-', '').length >= MAX_DIGITS) return v
  if (str === '0') return d
  if (str === '-0') return -d
  return Number(str + d)
}
export const eraseDigit = (v: Val): Val => {
  if (v == null) return null
  const str = String(v).slice(0, -1)
  return str === '' || str === '-' ? null : Number(str)
}
export const negate = (v: Val): Val => (v == null || v === 0 ? v : -v)
export const sum = (l: Val[]) => (l.some((v) => v != null) ? l.reduce<number>((a, v) => a + (v ?? 0), 0) : null)
export const show = (n: Val) => (n == null ? '' : n)

type Props = {
  className?: string
  onDigit: (d: number) => void
  onErase: () => void
  onNegate: () => void
  onNext: () => void
  onClose: () => void
}

export default function Keypad({ className = '', onDigit, onErase, onNegate, onNext, onClose }: Props) {
  const d = (n: number) => <button key={n} onClick={() => { navigator.vibrate?.(6); onDigit(n) }}>{n}</button>
  return (
    <div className={`keypad ${className}`}>
      {[7, 8, 9].map(d)}
      <button className="k-icon" aria-label="Effacer le chiffre" onClick={onErase}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"><path d="M9 5h11v14H9l-6-7z" /><path d="M12.5 9.5l5 5M17.5 9.5l-5 5" /></svg>
      </button>
      {[4, 5, 6].map(d)}
      <button onClick={onNegate}>±</button>
      {[1, 2, 3].map(d)}
      <button className="k-icon" aria-label="Case suivante" onClick={onNext}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
      <button className="k-zero" onClick={() => onDigit(0)}>0</button>
      <button className="k-ok" aria-label="Valider" onClick={onClose}><Save /></button>
    </div>
  )
}
