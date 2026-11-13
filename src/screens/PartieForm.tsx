import { useEffect, useMemo, useRef, useState } from 'react'
import type { Draft, FormState } from '../App'
import type { Game } from '../data/games'
import { store, useParties } from '../data/store'
import { back } from '../App'
import { Grid, Minus, Plus, Trash } from '../icons'
import { fromDateInput, toDateInput } from '../lib/format'
import { clearChrono, fmtClock, minutesOf, useChrono } from '../lib/chrono'
import GameHeader from './GameHeader'

type Props = { game: Game; partieId?: string; draft?: Draft; initial?: FormState; onOpenSheet?: (f: FormState) => void }

const PLACES = ['JAL', 'SAGS', 'Ludîmes']
const MAX_SCORED: Record<string, number> = { edit: 4, orosi: 6 }
const PLAYER_RANGE: Record<string, [number, number]> = { edit: [2, 4], orosi: [2, 6], tornadice: [3, 6] }
const OTHER = 'Autres'

export default function PartieForm({ game, partieId, draft, initial: init, onOpenSheet }: Props) {
  const list = useParties(game.id)
  const existing = partieId ? list?.find((p) => p.id === partieId) : undefined
  const parent = `jeu/${game.id}`

  const [date, setDate] = useState(() => init?.date ?? toDateInput(Date.now()))
  const [duration, setDuration] = useState(init?.duration ?? '')
  const [minP, maxP] = PLAYER_RANGE[game.id] ?? [1, 20]
  const clampP = (n: number) => Math.min(maxP, Math.max(minP, n))
  const [players, setPlayers] = useState<number>(() =>
    clampP(draft ? draft.names?.length ?? draft.scores.filter((s) => s !== 0).length : init?.players ?? 4))
  const [place, setPlace] = useState(init?.place ?? PLACES[0])
  const [location, setLocation] = useState(init?.location ?? '')
  const [winner, setWinner] = useState<string | undefined>(init?.winner)
  const [rating, setRating] = useState<number | null>(init?.rating ?? null)
  const [notes, setNotes] = useState(init?.notes ?? '')
  const [scores, setScores] = useState<number[] | undefined>(
    draft?.scores ?? init?.scores ?? (game.scoring && !partieId ? Array(Math.min(4, MAX_SCORED[game.scoring])).fill(0) : undefined),
  )
  const names = existing ? existing.names : draft?.names
  const chrono = useChrono(game.id)
  const toggleChrono = () => {
    const ms = chrono.toggle()
    if (ms != null) setDuration(String(minutesOf(ms)))
  }
  // Retours grows with its content, starting at a single line.
  const area = useRef<HTMLTextAreaElement | null>(null)
  const grow = (el: HTMLTextAreaElement | null) => { area.current = el; fit() }
  const fit = () => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 4}px`
  }
  useEffect(fit, [notes])
  const [loaded, setLoaded] = useState(!partieId)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!existing || loaded) return
    setDate(toDateInput(existing.date))
    setWinner(existing.winner)
    setRating(existing.rating ?? null)
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
      duration: chrono.running ? minutesOf(chrono.total) : duration === '' ? null : Math.max(0, Number(duration)),
      players,
      location: place === OTHER ? location.trim() : place,
      notes: notes.trim(),
      ...(scores && scores.some((x) => x !== 0) ? { scores } : {}),
      ...(names ? { names } : {}),
      ...(game.teams ? { winner } : {}),
      rating: rating ?? 1,
      ...(existing ? {} : game.version ? { version: game.version } : {}),
    }
    const op = existing ? store.update(existing.id, data) : store.add(data)
    op.catch((err) => alert('Erreur : ' + err.message))
    if (!existing) { draft?.clear(); clearChrono(game.id) }
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
        <div className="row2">
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <div className="field">
            <span>Note</span>
            <div className="stars" role="radiogroup">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={(rating ?? 1) === n} aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                  className={n <= (rating ?? 1) ? 'on' : ''} onClick={() => setRating(rating === n ? null : n)}>
                  <svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <span>Durée (min)</span>
            <div className="duration">
              {chrono.running
                ? <div className="chrono-live" aria-live="off"><i />{fmtClock(chrono.total)}</div>
                : <input type="number" inputMode="numeric" min={0} step={1} value={duration}
                    onChange={(e) => setDuration(e.target.value)} />}
              {!existing && (
                <button type="button" className={`chrono-btn${chrono.running ? ' on' : ''}`}
                  aria-label={chrono.running ? 'Arrêter le chrono' : 'Lancer le chrono'}
                  onClick={(e) => { e.preventDefault(); toggleChrono() }}>
                  {chrono.running
                    ? <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                    : <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13.5" r="7.5" /><path d="M12 13.5V9.5M10 2.5h4M18.5 6.5l1.5-1.5" /></svg>}
                </button>
              )}
            </div>
          </div>
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
            {game.scoring && !existing && onOpenSheet ? (
              <button type="button" className="sheet-link"
                onClick={() => onOpenSheet({ date, duration, players, place, location, winner, rating, notes, scores })}>
                <Grid /> Scores
              </button>
            ) : <span>Scores</span>}
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
          <span>Retours</span>
          <textarea ref={grow} rows={1} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {existing ? 'Enregistrer' : 'Créer la partie'}
        </button>
      </form>
    </main>
  )
}
