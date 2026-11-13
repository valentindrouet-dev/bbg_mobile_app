export type Game = {
  id: string
  name: string
  logo?: string
  color: string
  scoring?: boolean
}

export const GAMES: Game[] = [
  { id: 'edit', name: 'EDIT', logo: './img/edit-logo.png', color: '#191425', scoring: true },
  { id: 'orosi', name: 'Orosi', color: '#EE6426' },
  { id: 'tornadice', name: 'TornaDice', color: '#C54927' },
]

export const gameById = (id: string) => GAMES.find((g) => g.id === id)
