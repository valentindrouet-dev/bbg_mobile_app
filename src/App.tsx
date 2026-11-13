import { useEffect, useState } from 'react'
import Home from './screens/Home'
import GameScreen from './screens/Game'
import PartieForm from './screens/PartieForm'
import EditSheet from './screens/EditSheet'
import OrosiSheet from './screens/OrosiSheet'
import { gameById } from './data/games'

export type Draft = { scores: number[]; names?: string[]; clear: () => void }
export type FormState = {
  date: string; duration: string; players: number; place: string; location: string
  winner?: string; rating: number | null; notes: string; scores?: number[]
}

const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)

const notify = () => window.dispatchEvent(new Event('bbg-nav'))
const depth = () => (history.state?.d as number | undefined) ?? 0
export const go = (path: string, replace = false) => {
  if (replace) history.replaceState({ d: depth() }, '', '#/' + path)
  else history.pushState({ d: depth() + 1 }, '', '#/' + path)
  notify()
}
export const back = (parent: string) => {
  if (depth() > 0) history.back()
  else go(parent, true)
}

export default function App() {
  const [parts, setParts] = useState(parse)
  const [draft, setDraft] = useState<Draft | undefined>()
  const [form, setForm] = useState<FormState | undefined>()

  useEffect(() => {
    const on = () => {
      setParts(parse())
      window.scrollTo(0, 0)
    }
    const evs = ['hashchange', 'popstate', 'bbg-nav']
    evs.forEach((e) => window.addEventListener(e, on))
    return () => evs.forEach((e) => window.removeEventListener(e, on))
  }, [])

  const [section, id, action, pid] = parts
  const game = section === 'jeu' && id ? gameById(id) : undefined
  const inFlow = action === 'score' || action === 'resultat'

  // Leaving the form/sheet flow drops what was kept in memory.
  useEffect(() => {
    if (!inFlow) { setDraft(undefined); setForm(undefined) }
  }, [inFlow, id])

  if (!game) return <Home />
  const onSave = (d: Draft) => { setDraft(d); go(`jeu/${game.id}/resultat`, true) }
  // Back from a sheet opened from the form returns to the form, as it was.
  const onSheetBack = form ? () => { setDraft(undefined); go(`jeu/${game.id}/resultat`, true) } : undefined
  const openSheet = (f: FormState) => { setForm(f); go(`jeu/${game.id}/score`, true) }
  if (action === 'score' && game.scoring === 'edit') return <EditSheet game={game} onSave={onSave} onBack={onSheetBack} />
  if (action === 'score' && game.scoring === 'orosi') return <OrosiSheet game={game} onSave={onSave} onBack={onSheetBack} />
  if (action === 'resultat')
    return <PartieForm key={`draft-${game.id}`} game={game} draft={draft} initial={form} onOpenSheet={openSheet} />
  if (action === 'nouvelle') return <PartieForm key={`new-${game.id}`} game={game} onOpenSheet={openSheet} />
  if (action === 'partie' && pid) return <PartieForm key={pid} game={game} partieId={pid} />
  return <GameScreen game={game} />
}
