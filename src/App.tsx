import { useEffect, useState } from 'react'
import Home from './screens/Home'
import GameScreen from './screens/Game'
import PartieForm from './screens/PartieForm'
import EditSheet from './screens/EditSheet'
import { gameById } from './data/games'

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
  const [draftScores, setDraftScores] = useState<number[] | undefined>()

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

  if (!game) return <Home />
  if (action === 'score' && game.scoring)
    return <EditSheet game={game} onSave={(s) => { setDraftScores(s); go(`jeu/${game.id}/nouvelle`, true) }} />
  if (action === 'nouvelle')
    return <PartieForm key="new" game={game} scores={draftScores} onDone={() => setDraftScores(undefined)} />
  if (action === 'partie' && pid) return <PartieForm key={pid} game={game} partieId={pid} />
  return <GameScreen game={game} />
}
