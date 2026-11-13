import { useEffect, useState } from 'react'
import type { Game } from '../data/games'
import { back } from '../App'
import { Back, Reset, Save } from '../icons'

const PLAYERS = 4
const ROWS = 7
const BOXES = 3
const HIGHLIGHT_ROW = 3
// Points earned by each checked box (per row). Adjust if a row is worth more.
const ROW_VALUES = [1, 1, 1, 1, 1, 1, 1]

type Sheet = boolean[][][] // [player][row][box]
const KEY = 'bbg-edit-sheet'
const empty = (): Sheet =>
  Array.from({ length: PLAYERS }, () => Array.from({ length: ROWS }, () => Array(BOXES).fill(false)))

const load = (): Sheet => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (Array.isArray(s) && s.length === PLAYERS) return s
  } catch { /* ignore */ }
  return empty()
}
export const clearSheet = () => localStorage.removeItem(KEY)

const rowTotal = (row: boolean[], r: number) => row.filter(Boolean).length * ROW_VALUES[r]
const colTotal = (p: boolean[][], b: number) => p.reduce((s, row, r) => s + (row[b] ? ROW_VALUES[r] : 0), 0)
const total = (p: boolean[][]) => p.reduce((s, row, r) => s + rowTotal(row, r), 0)
const show = (n: number) => (n ? n : '')

export default function EditSheet({ game, onSave }: { game: Game; onSave: (scores: number[]) => void }) {
  const [sheet, setSheet] = useState<Sheet>(load)
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(sheet)) }, [sheet])

  const toggle = (p: number, r: number, b: number) => {
    navigator.vibrate?.(8)
    setSheet((s) => s.map((pl, i) => i !== p ? pl : pl.map((row, j) => j !== r ? row : row.map((v, k) => (k === b ? !v : v)))))
  }
  const reset = () => { if (confirm('Effacer la feuille ?')) setSheet(empty()) }
  const totals = sheet.map(total)

  return (
    <div className="sheet-wrap">
      <div className="sheet">
        <div className="sheet-bg" aria-hidden>
          <div className="halftone ht-tl" /><div className="halftone ht-bl" />
          <div className="halftone ht-tr" /><div className="halftone ht-br" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="0,0 6,0 13,46 9,44" fill="#7D4BA3" />
            <polygon points="10,0 12.5,0 15.5,36" fill="#191425" />
            <polygon points="0,58 1.2,100 9,100" fill="#7D4BA3" />
            <polygon points="2,70 12,100 14,100" fill="#191425" />
            <polygon points="100,0 92,0 99,38" fill="#7D4BA3" />
            <polygon points="88,0 90,0 97,22" fill="#7D4BA3" opacity=".7" />
            <polygon points="100,48 95,52 100,100" fill="#191425" />
            <polygon points="100,60 92,72 100,96" fill="#7D4BA3" />
          </svg>
        </div>

        <div className="sheet-side">
          <button className="sheet-btn" aria-label="Retour" onClick={() => back(`jeu/${game.id}`)}><Back /></button>
          <img className="sheet-logo" src="./img/edit-logo.png" alt="EDIT" />
          <div className="sheet-tools">
            <button className="sheet-btn" aria-label="Effacer" onClick={reset}><Reset /></button>
            <button className="sheet-btn" aria-label="Enregistrer la partie" onClick={() => onSave(totals)}><Save /></button>
          </div>
        </div>

        {sheet.map((pl, p) => (
          <section key={p} className={`player pc-${p + 1}`}>
            <div className="sum-box">
              {[0, 1, 2].map((b) => <div key={b}>{show(colTotal(pl, b))}</div>)}
              <div className="grey grand">{totals[p]}</div>
              <div />
            </div>
            <div className="grid-col">
              <div className="grid">
                {pl.map((row, r) => (
                  <div key={r} className={`grow${r === HIGHLIGHT_ROW ? ' hl' : ''}`}>
                    {row.map((v, b) => (
                      <button key={b} className={`cell${v ? ' on' : ''}`} aria-pressed={v}
                        aria-label={`Joueur ${p + 1}, ligne ${r + 1}, case ${b + 1}`}
                        onClick={() => toggle(p, r, b)} />
                    ))}
                    <div className="cell grey">{show(rowTotal(row, r))}</div>
                  </div>
                ))}
                <div className="foot"><span>{p + 1}</span></div>
              </div>
              <div className="tag"><span><i>TOTAL</i></span></div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
