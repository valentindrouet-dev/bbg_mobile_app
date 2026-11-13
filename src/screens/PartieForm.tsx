import { useEffect, useMemo, useState } from 'react'
import type { Draft } from '../App'
import type { Game } from '../data/games'
import { store, useParties } from '../data/store'
import { back } from '../App'
import { Minus, Plus, Trash } from '../icons'
import { fromDateInput, toDateInput } from '../lib/format'
import GameHeader from './GameHeader'

type Props = { game: Game; partieId?: string; draft?: Draft; onDone?: () => void }

const PLACES = ['JAL', 'SAGS', 'Ludîmes']
const MAX_SCORED: Record<string, number> = { edit: 4, orosi: 6 }
const PLAYER_RANGE: Record<string, [number, number]> = { edit: [2, 4], orosi: [2, 6], tornadice: [3, 6] }
const OTHER = 'Autres'

export default function PartieForm({ game, partieId, draft, onDone }: Props) {
  const list = useParties(game.id)
  const existing = partieId ? list?.find((p) => p.id === partieId) : undefined
  const parent = `jeu/${game.id}`

  const [date, setDate] = useState(() => toDateInput(Date.now()))
  const [duration, setDuration] = useState('')
  const [minP, maxP] = PLAYER_RANGE[game.id] ?? [1, 20]
  const clampP = (n: number) => Math.min(maxP, Math.max(minP, n))
  const [players, setPlayers] = useState<number>(() =>
    clampP(draft ? draft.names?.length ?? draft.scores.filter((s) => s !== 0).length : 4))
  const [place, setPlace] = useState(PLACES[0])
  const [location, setLocation] = useState('')
  const [winner, setWinner] = useState<string | undefined>()
  const [notes, setNotes] = useState('')
  const [scores, setScores] = useState<number[] | undefined>(
    draft?.scores ?? (game.scoring && !partieId ? Array(Math.min(4, MAX_SCORED[game.scoring])).fill(0) : undefined),
  )
  const names = existing ? existing.names : draft?.names
  const [loaded, setLoaded] = useState(!partieId)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!existing || loaded) return
    setDate(toDateInput(existing.date))
    setWinner(existing.winner)
    setDuration(existing.duration == null ? '' : String(existing.duration))
    setPlayers(clampP(existing.players ?? 4))
    if (PLACES.includes(existing.location)) setPlace(existing.location)
    else { setPlace(OTHER); setLocation(existing.location) }
    setNotes(existing.notes)
    setScores(existing.scores)
    setLoaded(true)
  }, [existing, loaded])

  const changePlayers = (delta: number) => {
    const n = clampP(players + delta)
    setPlayers(n)
    if (scores && !names && game.scoring) {
      const len = Math.min(n, MAX_SCORED[game.scoring])
      setScores(Array.from({ length: len }, (_, i) => scores[i] ?? 0))
    }
  }

  const places = useMemo(
    () => [...new Set((list ?? []).map((p) => p.location).filter((l) => l && !PLACES.includes(l)))],
    [list],
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const data = {
      gameId: game.id,
      date: existing && date === toDateInput(existing.date) ? existing.date
        : !existing && date === toDateInput(Date.now()) ? Date.now() : fromDateInput(date) || Date.now(),
      duration: duration === '' ? null : Math.max(0, Number(duration)),
      players,
      location: place === OTHER ? location.trim() : place,
      notes: notes.trim(),
      ...(scores && scores.some((x) => x !== 0) ? { scores } : {}),
      ...(names ? { names } : {}),
      ...(game.teams ? { winner } : {}),
    }
    const op = existing ? store.update(existing.id, data) : store.add(data)
    op.catch((err) => alert('Erreur : ' + err.message))
    if (!existing) draft?.clear()
    onDone?.()
    back(parent)
  }

  const remove = () => {
    if (!existing || !confirm('Supprimer cette partie ?')) return
    store.remove(existing.id).catch((err) => alert('Erreur : ' + err.message))
    back(parent)
  }

  if (partieId && !loaded) return (
    <main className="screen"><GameHeader game={game} parent={parent} />{list && !existing ? null : <div className="loader" />}</main>
  )

  return (
    <main className="screen">
      <GameHeader
        game={game}
        parent={parent}
        right={existing && <button className="icon-btn danger" aria-label="Supprimer" onClick={remove}><Trash /></button>}
      />
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <div className="row2">
          <label className="field">
            <span>Durée (min)</span>
            <input type="number" inputMode="numeric" min={0} step={1} value={duration}
              onChange={(e) => setDuration(e.target.value)} />
          </label>
          <div className="field">
            <span>Joueurs</span>
            <div className="stepper">
              <button type="button" aria-label="Moins" disabled={players <= minP} onClick={() => changePlayers(-1)}><Minus /></button>
              <b>{players}</b>
              <button type="button" aria-label="Plus" disabled={players >= maxP} onClick={() => changePlayers(1)}><Plus /></button>
            </div>
          </div>
        </div>

        <div className="field">
          <span>Lieu</span>
          <select value={place} onChange={(e) => setPlace(e.target.value)}>
            {[...PLACES, OTHER].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {place === OTHER && (
            <>
              <input type="text" value={location} list="places" autoComplete="off" autoFocus
                onChange={(e) => setLocation(e.target.value)} />
              <datalist id="places">{places.map((p) => <option key={p} value={p} />)}</datalist>
            </>
          )}
        </div>

        {game.teams && (
          <div className="field">
            <span>Équipe gagnante</span>
            <div className="teams" role="radiogroup">
              {game.teams.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={winner === t.id}
                  className={`team${winner === t.id ? ' on' : ''}`} style={{ ['--team' as string]: t.color }}
                  onClick={() => setWinner(winner === t.id ? undefined : t.id)}>
                  <i /><span>{t.label}</span>
                  {winner === t.id && (
                    <svg className="team-check" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {scores && (
          <div className="field">
            <span>Scores</span>
            <div className="scores-edit">
              {scores.map((s, i) => (
                <label key={i} className="score-in">
                  {names?.[i] && <small>{names[i]}</small>}
                  <input className={`pc pc-${i + 1}`} type="number" inputMode="numeric" value={s}
                    onChange={(e) => setScores(scores.map((x, j) => (j === i ? Number(e.target.value) || 0 : x)))} />
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="field">
          <span>Notes</span>
          <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {existing ? 'Enregistrer' : 'Créer la partie'}
        </button>
      </form>
    </main>
  )
}
