import type { Game } from '../data/games'
import { store, useParties } from '../data/store'
import { go } from '../App'
import { Clock, Grid, People, Pin, Plus, Share } from '../icons'
import { fmtDate, fmtDuration } from '../lib/format'
import { exportParties } from '../lib/export'
import GameHeader from './GameHeader'
import SwipeRow from './SwipeRow'
import { useState } from 'react'

const avg = (l: (number | null)[]) => {
  const v = l.filter((x): x is number => x != null)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

export default function GameScreen({ game }: { game: Game }) {
  const list = useParties(game.id)
  const [openId, setOpenId] = useState<string | null>(null)
  const parties = list ?? []
  const avgDur = avg(parties.map((p) => p.duration))
  const avgPl = avg(parties.map((p) => p.players))

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
        <div className="stat"><b>{avgPl == null ? '–' : avgPl.toFixed(1).replace('.0', '').replace('.', ',')}</b><span>Joueurs moy.</span></div>
      </section>

      <div className="actions">
        <button className="btn btn-primary" onClick={() => go(`jeu/${game.id}/nouvelle`)}>
          <Plus /> Ajouter une partie
        </button>
        {game.scoring && (
          <button className="btn btn-secondary" onClick={() => go(`jeu/${game.id}/score`)}>
            <Grid /> Feuille de score
          </button>
        )}
      </div>

      {list === null ? <div className="loader" /> : (
        <ul className="parties">
          {parties.map((p) => (
            <li key={p.id}>
              <SwipeRow open={openId === p.id} onOpen={() => setOpenId(p.id)} onClose={() => setOpenId(null)}
                onDelete={() => { setOpenId(null); store.remove(p.id) }}>
              <button className="partie" onClick={() => go(`jeu/${game.id}/partie/${p.id}`)}>
                <div className="partie-date">
                  <b>{fmtDate(p.date)}</b>
                  <span className="partie-stars" aria-label={`${p.rating ?? 1} étoiles`}>{'★'.repeat(p.rating ?? 1)}</span>
                </div>
                <div className="partie-meta">
                  <span><Clock />{fmtDuration(p.duration)}</span>
                  <span><People />{p.players ?? '–'}</span>
                  {p.location && <span className="loc"><Pin />{p.location}</span>}
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
    </main>
  )
}
