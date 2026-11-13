import { GAMES } from '../data/games'
import { go } from '../App'

export default function Home() {
  return (
    <main className="screen home">
      <header className="home-head">
        <img className="home-logo" src="./img/bbg-logo.webp" alt="Big Budi Games" />
      </header>
      <ul className="game-list">
        {GAMES.map((g, i) => (
          <li key={g.id}>
            <button className={`game-tile tilt-${i % 3}`} onClick={() => go(`jeu/${g.id}`)}>
              {g.logo
                ? <img src={g.logo} alt={g.name} />
                : <span className="game-name" style={{ color: g.color }}>{g.name}</span>}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
