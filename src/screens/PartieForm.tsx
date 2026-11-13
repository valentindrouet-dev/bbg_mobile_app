import { useEffect, useMemo, useState } from 'react'
import type { Game } from '../data/games'
import { store, useParties } from '../data/store'
import { back } from '../App'
import { Minus, Plus, Trash } from '../icons'
import { toLocalInput } from '../lib/format'
import { clearSheet } from './EditSheet'
import GameHeader from './GameHeader'

type Props = { game: Game; partieId?: string; scores?: number[]; onDone?: () => void }

export default function PartieForm({ game, partieId, scores: draft, onDone }: Props) {
  const list = useParties(game.id)
  const existing = partieId ? list?.find((p) => p.id === partieId) : undefined
  const parent = `jeu/${game.id}`

  const [date, setDate] = useState(() => toLocalInput(Date.now()))
  const [duration, setDuration] = useState('')
  const [players, setPlayers] = useState<number>(draft ? Math.max(1, draft.filter((s) => s > 0).length) : 4)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [scores, setScores] = useState<number[] | undefined>(draft)
  const [loaded, setLoaded] = useState(!partieId)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!existing || loaded) return
    setDate(toLocalInput(existing.date))
    setDuration(existing.duration == null ? '' : String(existing.duration))
    setPlayers(existing.players ?? 4)
    setLocation(existing.location)
    setNotes(existing.notes)
    setScores(existing.scores)
    setLoaded(true)
  }, [existing, loaded])

  const places = useMemo(
    () => [...new Set((list ?? []).map((p) => p.location).filter(Boolean))],
    [list],
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const data = {
      gameId: game.id,
      date: new Date(date).getTime() || Date.now(),
      duration: duration === '' ? null : Math.max(0, Number(duration)),
      players,
      location: location.trim(),
      notes: notes.trim(),
      ...(scores ? { scores } : {}),
    }
    // Firestore writes resolve once synced; offline they are queued locally, so don't block the UI.
    const op = existing ? store.update(existing.id, data) : store.add(data)
    op.catch((err) => alert('Erreur : ' + err.message))
    if (!existing && draft) clearSheet()
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
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
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
              <button type="button" aria-label="Moins" onClick={() => setPlayers((n) => Math.max(1, n - 1))}><Minus /></button>
              <b>{players}</b>
              <button type="button" aria-label="Plus" onClick={() => setPlayers((n) => Math.min(20, n + 1))}><Plus /></button>
            </div>
          </div>
        </div>

        <label className="field">
          <span>Lieu</span>
          <input type="text" value={location} list="places" autoComplete="off" onChange={(e) => setLocation(e.target.value)} />
          <datalist id="places">{places.map((p) => <option key={p} value={p} />)}</datalist>
        </label>

        {scores && (
          <div className="field">
            <span>Scores</span>
            <div className="scores-edit">
              {scores.map((s, i) => (
                <input key={i} className={`pc pc-${i + 1}`} type="number" inputMode="numeric" value={s}
                  onChange={(e) => setScores(scores.map((x, j) => (j === i ? Number(e.target.value) || 0 : x)))} />
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
