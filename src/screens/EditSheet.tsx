import { useEffect, useState } from 'react'
import type { Game } from '../data/games'
import { back } from '../App'
import { Back, Reset, Save } from '../icons'
import Keypad, { eraseDigit, negate, show, sum, typeDigit, type Val } from './Keypad'
import type { Draft } from '../App'

const PLAYERS = 4
const ROWS = 3
const COLS = 7
const HIGHLIGHT_COL = 3
type Sheet = Val[][][] // [player][row][col]
type Sel = { p: number; r: number; c: number } | null
const KEY = 'bbg-edit-sheet-v3'
const empty = (): Sheet =>
  Array.from({ length: PLAYERS }, () => Array.from({ length: ROWS }, () => Array(COLS).fill(null)))

const load = (): Sheet => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (Array.isArray(s) && s.length === PLAYERS && s[0]?.length === ROWS && s[0][0]?.length === COLS) return s
  } catch { /* ignore */ }
  return empty()
}
const clearSheet = () => localStorage.removeItem(KEY)


export default function EditSheet({ game, onSave, onBack }: { game: Game; onSave: (d: Draft) => void; onBack?: () => void }) {
  const [sheet, setSheet] = useState<Sheet>(load)
  const [sel, setSel] = useState<Sel>(null)
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(sheet)) }, [sheet])

  const setVal = (f: (v: Val) => Val) => {
    if (!sel) return
    const { p, r, c } = sel
    setSheet((s) => s.map((pl, i) => i !== p ? pl : pl.map((row, j) => j !== r ? row : row.map((v, k) => (k === c ? f(v) : v)))))
  }
  const next = () => setSel((s) => {
    if (!s) return s
    let { p, r, c } = s
    if (++c >= COLS) { c = 0; if (++r >= ROWS) return null }
    return { p, r, c }
  })

  const reset = () => { if (confirm('Effacer la feuille ?')) { setSheet(empty()); setSel(null) } }
  const totals = sheet.map((pl) => sum(pl.flat()) ?? 0)
  const cols = Array.from({ length: COLS }, (_, c) => c)

  return (
    <div className="sheet-wrap">
      <div className="sheet">
        <div className="sheet-bg" aria-hidden>
          <div className="halftone ht-tl" /><div className="halftone ht-tr" />
          <div className="halftone ht-bl" /><div className="halftone ht-br" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="0,10.5 0,8.5 30,4.5" fill="#191425" />
            <polygon points="0,11.5 0,10 22,7" fill="#7D4BA3" />
            <polygon points="100,3.5 100,5.5 70,9" fill="#191425" />
            <polygon points="100,6.5 100,8 54,15" fill="#7D4BA3" />
            <polygon points="0,98 0,100 36,100 40,94.5" fill="#7D4BA3" />
            <polygon points="12,100 18,100 52,95" fill="#191425" />
            <polygon points="100,93 100,100 76,100" fill="#7D4BA3" />
            <polygon points="100,90.5 100,92 66,99" fill="#191425" />
          </svg>
        </div>

        <header className="sheet-top">
          <button className="sheet-btn" aria-label="Retour" onClick={() => (onBack ? onBack() : back(`jeu/${game.id}`))}><Back /></button>
          <img className="sheet-logo" src="./img/edit-logo.png" alt="EDIT" />
          <div className="sheet-tools">
            <button className="sheet-btn" aria-label="Effacer" onClick={reset}><Reset /></button>
            <button className="sheet-btn" aria-label="Enregistrer la partie" onClick={() => onSave({ scores: totals, clear: clearSheet })}><Save /></button>
          </div>
        </header>

        <div className="players" onClick={(e) => { if (e.target === e.currentTarget) setSel(null) }}>
          {sheet.map((pl, p) => (
            <section key={p} className={`player pc-${p + 1}`}>
              <div className="block">
                <div className="band"><span>{p + 1}</span></div>
                {pl.map((row, r) => cols.map((c) => {
                  const on = sel?.p === p && sel.r === r && sel.c === c
                  return (
                    <button key={`${r}-${c}`} className={`cell${c === HIGHLIGHT_COL ? ' hl' : ''}${on ? ' sel' : ''}`}
                      aria-label={`Joueur ${p + 1}, ligne ${r + 1}, colonne ${c + 1}`}
                      onClick={() => setSel(on ? null : { p, r, c })}>
                      {show(row[c])}
                    </button>
                  )
                }))}
                {cols.map((c) => (
                  <div key={`t${c}`} className={`cell grey${c === HIGHLIGHT_COL ? ' hl' : ''}`}>{show(sum(pl.map((row) => row[c])))}</div>
                ))}
              </div>
              <div className="tag"><span>TOTAL</span></div>
              <div className="side">
                {pl.map((row, r) => <div key={r}>{show(sum(row))}</div>)}
                <div className="grey" />
                <div className="grand">{totals[p]}</div>
              </div>
            </section>
          ))}
        </div>

        {sel && (
          <Keypad className={sel.p < 2 ? 'at-bottom' : 'at-top'}
            onDigit={(d) => setVal((v) => typeDigit(v, d))} onErase={() => setVal(eraseDigit)}
            onNegate={() => setVal(negate)} onNext={next} onClose={() => setSel(null)} />
        )}
      </div>
    </div>
  )
}
