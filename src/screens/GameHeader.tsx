import type { ReactNode } from 'react'
import type { Game } from '../data/games'
import { Back } from '../icons'
import { back } from '../App'

export default function GameHeader({ game, parent, right }: { game: Game; parent: string; right?: ReactNode }) {
  return (
    <header className="bar">
      <button className="icon-btn" aria-label="Retour" onClick={() => back(parent)}><Back /></button>
      <div className="bar-title">
        {game.logo ? <img src={game.logo} alt={game.name} /> : <span style={{ color: game.color }}>{game.name}</span>}
      </div>
      <div className="bar-right">{right}</div>
    </header>
  )
}
