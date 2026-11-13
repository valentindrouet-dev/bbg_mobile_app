import { lazy, Suspense, useEffect, useState } from 'react'
import type { Game } from '../data/games'
import type { Draft } from '../App'
import { back } from '../App'
import { Back, Reset, Save } from '../icons'
import Keypad, { eraseDigit, negate, show, sum, typeDigit, type Val } from './Keypad'

const CaminoScan = lazy(() => import('../camino/CaminoScan'))

const PLAYERS = 6
const ROWS: { label: string; note?: string; italic?: boolean }[] = [
  { label: 'Jaune' }, { label: 'Orange' }, { label: 'Rouge' }, { label: 'Vert' },
  { label: 'Bleu' }, { label: 'Violet' }, { label: 'Noir', note: '-2' }, { label: 'Missions', italic: true },
]
const LEGEND = [['3', 3], ['4', 5], ['5', 8], ['6', 12], ['7', 17], ['8', 23], ['9+', 30]] as const

type Sheet = { names: string[]; vals: Val[][] } // vals[player][row]
type Sel = { p: number; r: number } | null
const KEY = 'bbg-orosi-sheet'
const empty = (): Sheet => ({
  names: Array(PLAYERS).fill(''),
  vals: Array.from({ length: PLAYERS }, () => Array(ROWS.length).fill(null)),
})
const load = (): Sheet => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s?.names?.length === PLAYERS && s?.vals?.[0]?.length === ROWS.length) return s
  } catch { /* ignore */ }
  return empty()
}
const clearSheet = () => localStorage.removeItem(KEY)

export default function OrosiSheet({ game, onSave, onBack }: { game: Game; onSave: (d: Draft) => void; onBack?: () => void }) {
  const [sheet, setSheet] = useState<Sheet>(load)
  const [sel, setSel] = useState<Sel>(null)
  const [scanning, setScanning] = useState(false)
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(sheet)) }, [sheet])

  const setVal = (f: (v: Val) => Val) => {
    if (!sel) return
    setSheet((s) => ({ ...s, vals: s.vals.map((col, p) => p !== sel.p ? col : col.map((v, r) => (r === sel.r ? f(v) : v))) }))
  }
  const rename = (p: number) => {
    const n = prompt(`Joueur ${p + 1}`, sheet.names[p])
    if (n == null) return
    setSheet((s) => ({ ...s, names: s.names.map((x, i) => (i === p ? n.trim() : x)) }))
  }
  const next = () => setSel((s) => {
    if (!s) return s
    if (s.r + 1 < ROWS.length) return { p: s.p, r: s.r + 1 }
    return s.p + 1 < PLAYERS ? { p: s.p + 1, r: 0 } : null
  })
  const reset = () => { if (confirm('Effacer la feuille ?')) { setSheet(empty()); setSel(null) } }
  const totals = sheet.vals.map(sum)

  const save = () => {
    const used = sheet.vals.map((_, p) => p).filter((p) => totals[p] != null || sheet.names[p])
    const idx = used.length ? used : [0]
    onSave({
      scores: idx.map((p) => totals[p] ?? 0),
      names: idx.map((p) => sheet.names[p] || `J${p + 1}`),
      clear: clearSheet,
    })
  }

  if (scanning) return (
    <Suspense fallback={<div className="loader" />}>
      <CaminoScan players={sheet.names} onCancel={() => setScanning(false)}
        onApply={(p, lines) => {
          setSheet((s) => ({ ...s, vals: s.vals.map((col, i) => (i === p ? [...lines] : col)) }))
          setScanning(false)
        }} />
    </Suspense>
  )

  return (
    <div className="sheet-wrap orosi-wrap">
      <div className="osheet">
        <header className="osheet-top">
          <button className="sheet-btn" aria-label="Retour" onClick={() => (onBack ? onBack() : back(`jeu/${game.id}`))}><Back /></button>
          <div className="sheet-tools">
            <button className="sheet-btn" aria-label="Scanner un plateau" onClick={() => { setSel(null); setScanning(true) }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            </button>
            <button className="sheet-btn" aria-label="Effacer" onClick={reset}><Reset /></button>
            <button className="sheet-btn" aria-label="Enregistrer la partie" onClick={save}><Save /></button>
          </div>
        </header>

        <div className="obody">
          <div className="olegend">
            <div className="olegend-head">Points des tuiles connectées</div>
            {LEGEND.map(([n, pts]) => <div key={n}><b>{n}</b><span>{pts} pts</span></div>)}
          </div>

          <div className="otable" style={{ gridTemplateColumns: `1.55fr repeat(${PLAYERS}, 1fr)` }}>
            <div className="ohead-logo"><img src="./img/camino-logo.png" alt="Camino" /></div>
            {sheet.names.map((n, p) => (
              <button key={p} className="oname" onClick={() => rename(p)}>{n}</button>
            ))}
            {ROWS.map((row, r) => (
              <div key={r} className="orow">
                <div className={`olabel${row.italic ? ' it' : ''}`}>
                  <span>{row.label}{row.note && <> (<span className="neg">{row.note}</span>)</>}</span>
                </div>
                {sheet.vals.map((col, p) => {
                  const on = sel?.p === p && sel.r === r
                  return (
                    <button key={p} className={`ocell${on ? ' sel' : ''}`}
                      aria-label={`${row.label}, joueur ${p + 1}`}
                      onClick={() => setSel(on ? null : { p, r })}>{show(col[r])}</button>
                  )
                })}
              </div>
            ))}
            <div className="orow total">
              <div className="olabel">TOTAL</div>
              {totals.map((t, p) => <div key={p} className="ocell">{show(t)}</div>)}
            </div>
          </div>
        </div>

        {sel && (
          <Keypad className={sel.r < 4 ? 'at-bottom' : 'at-top'}
            onDigit={(d) => setVal((v) => typeDigit(v, d))} onErase={() => setVal(eraseDigit)}
            onNegate={() => setVal(negate)} onNext={next} onClose={() => setSel(null)} />
        )}
      </div>
    </div>
  )
}
