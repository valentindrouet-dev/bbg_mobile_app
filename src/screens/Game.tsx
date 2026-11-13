import type { Game } from '../data/games'
import { store, useParties, type Partie } from '../data/store'
import { go } from '../App'
import { Back, Camera, Clock, Grid, People, Pin, Plus, Share } from '../icons'
import { fmtDuration, toDateInput } from '../lib/format'
import { exportParties } from '../lib/export'
import GameHeader from './GameHeader'
import SwipeRow, { type Side } from './SwipeRow'
import { useMemo, useState } from 'react'

const dayLabel = (t: number) => {
  const s = new Date(t).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const collapsedKey = (gameId: string) => `bbg-collapsed-${gameId}`
const readCollapsed = (gameId: string): string[] => {
  try { return JSON.parse(localStorage.getItem(collapsedKey(gameId)) || '[]') } catch { return [] }
}

const avg = (l: (number | null)[]) => {
  const v = l.filter((x): x is number => x != null)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

export default function GameScreen({ game }: { game: Game }) {
  const list = useParties(game.id)
  const [opened, setOpened] = useState<{ id: string; side: Exclude<Side, null> } | null>(null)
  const duplicate = (p: Partie) => {
    const { id: _id, createdAt: _c, ...copy } = p
    setOpened(null)
    store.add(copy)
  }
  const parties = list ?? []
  const groups = useMemo(() => {
    const out: { day: string; date: number; items: Partie[] }[] = []
    for (const p of parties) {
      const day = toDateInput(p.date)
      const g = out[out.length - 1]
      if (g && g.day === day) g.items.push(p)
      else out.push({ day, date: p.date, items: [p] })
    }
    return out
  }, [parties])
  const [collapsed, setCollapsed] = useState<string[]>(() => readCollapsed(game.id))
  const toggleDay = (day: string) => {
    const next = collapsed.includes(day) ? collapsed.filter((d) => d !== day) : [...collapsed, day]
    setCollapsed(next)
    try { localStorage.setItem(collapsedKey(game.id), JSON.stringify(next)) } catch { /* ignore */ }
  }
  const avgDur = avg(parties.map((p) => p.duration))
  const totalPl = parties.reduce((a, p) => a + (p.players ?? 0), 0)

  return (
    <main className="screen">
      <GameHeader
        game={game}
        parent=""
        right={parties.length > 0 && (
          <button className="icon-btn" aria-label="Exporter" onClick={() => exportParties(game, parties)}><Share /></button>
        )}
      />

      <section className="stats">
        <div className="stat"><b>{parties.length}</b><span>Parties</span></div>
        <div className="stat"><b>{avgDur == null ? '–' : fmtDuration(avgDur)}</b><span>Durée moy.</span></div>
        <div className="stat"><b>{totalPl}</b><span>Joueurs totaux</span></div>
      </section>

      <div className="actions">
        <button className="btn btn-primary" onClick={() => go(`jeu/${game.id}/nouvelle`)}>
          <Plus /> Ajouter une partie
        </button>
        {game.scoring && (
          <div className={game.scoring === 'orosi' ? 'actions-row' : undefined}>
            <button className="btn btn-secondary" onClick={() => go(`jeu/${game.id}/score`)}>
              <Grid /> Feuille de score
            </button>
            {game.scoring === 'orosi' && (
              <button className="btn btn-secondary" onClick={() => go(`jeu/${game.id}/scan`)}>
                <Camera /> Scan
              </button>
            )}
          </div>
        )}
      </div>

      {list === null ? <div className="loader" /> : (
        <div className="days">
          {groups.map((g) => {
            const closed = collapsed.includes(g.day)
            return (
              <section key={g.day} className={`day${closed ? ' closed' : ''}`}>
                <div className="day-head">
                  <button className="day-toggle" aria-expanded={!closed} onClick={() => toggleDay(g.day)}>
                    <Back className="day-chevron" />
                    <span className="day-label">{dayLabel(g.date)}</span>
                    <span className="day-count">{g.items.length}</span>
                  </button>
                  <button className="icon-btn" aria-label={`Exporter le ${dayLabel(g.date)}`}
                    onClick={() => exportParties(game, g.items, g.day)}><Share /></button>
                </div>
                {!closed && (
                  <ul className="parties">
                    {g.items.map((p) => (
                <li key={p.id}>
                  <SwipeRow open={opened?.id === p.id ? opened.side : null}
                    onOpen={(side) => setOpened({ id: p.id, side })} onClose={() => setOpened(null)}
                    onDelete={() => { setOpened(null); store.remove(p.id) }} onDuplicate={() => duplicate(p)}>
                  <button className="partie" onClick={() => go(`jeu/${game.id}/partie/${p.id}`)}>
                    <div className="partie-line">
                      <span><Clock />{fmtDuration(p.duration)}</span>
                      <span><People />{p.players ?? '–'}</span>
                      {p.location && <span className="loc"><Pin /><em>{p.location}</em></span>}
                      <span className="partie-stars" aria-label={`${p.rating ?? 1} étoiles`}><i>★</i>{p.rating ?? 1}</span>
                    </div>
                    {p.winner && (() => {
                      const t = game.teams?.find((x) => x.id === p.winner)
                      return t && <div className="partie-scores"><span className="team-chip" style={{ background: t.color }}>{t.label}</span></div>
                    })()}
                    {p.scores && p.scores.length > 0 && (
                      <div className="partie-scores">
                        {p.scores.map((s, i) => (
                          <span key={i} className={`pc pc-${i + 1}`}>{p.names?.[i] ? `${p.names[i]} ${s}` : s}</span>
                        ))}
                      </div>
                    )}
                    {p.notes && <p className="partie-notes">{p.notes}</p>}
                  </button>
                  </SwipeRow>
                </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
