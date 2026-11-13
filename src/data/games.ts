export type Game = {
  id: string
  name: string
  subtitle?: string
  logo?: string
  color: string
  scoring?: boolean
}

export const GAMES: Game[] = [
  { id: 'tornadice', name: 'TornaDice', color: '#C54927' },
  { id: 'edit', name: 'EDIT', logo: './img/edit-logo.png', color: '#191425', scoring: true },
  { id: 'orosi', name: 'Orosi', subtitle: 'Camino', color: '#EE6426' },
]

export const gameById = (id: string) => GAMES.find((g) => g.id === id)
