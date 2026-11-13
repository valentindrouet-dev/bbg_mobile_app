import { GAMES } from '../data/games'
import { go } from '../App'
import { foldAllDays } from './Game'

export default function Home() {
  return (
    <main className="screen home">
      <header className="home-head">
        <img className="home-logo" src="./img/bbg-logo.webp" alt="Big Budi Games" />
      </header>
      <ul className="game-list">
        {GAMES.map((g, i) => (
          <li key={g.id}>
            <button className={`game-tile tilt-${i % 3}${g.subtitle ? ' has-sub' : ''}`} onClick={() => { foldAllDays(); go(`jeu/${g.id}`) }}>
              {g.logo
                ? <img src={g.logo} alt={g.name} />
                : <span className="game-name" style={{ color: g.color }}>{g.name}</span>}
              {g.subtitle && <small className="game-sub">({g.subtitle})</small>}
            </button>
          </li>
        ))}
      </ul>
      <footer className="home-foot">
        <a className="btn btn-primary site-btn" href="https://bigbudigames.fr" target="_blank" rel="noopener">Site Web</a>
        <small className="version">v{__APP_VERSION__}</small>
      </footer>
    </main>
  )
}
