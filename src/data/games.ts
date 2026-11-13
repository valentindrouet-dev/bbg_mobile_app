export type Game = {
  id: string
  name: string
  subtitle?: string
  logo?: string
  color: string
  scoring?: 'edit' | 'orosi'
  teams?: { id: string; label: string; color: string }[]
}

export const GAMES: Game[] = [
  {
    id: 'tornadice', name: 'TornaDice', logo: './img/tornadice-logo.png', color: '#C54927',
    teams: [
      { id: 'bleu', label: 'Bleu', color: '#4BA3E3' },
      { id: 'jaune', label: 'Jaune', color: '#FBB938' },
      { id: 'vert', label: 'Vert', color: '#6DB33F' },
    ],
  },
  { id: 'edit', name: 'EDIT', logo: './img/edit-logo.png', color: '#191425', scoring: 'edit' },
  { id: 'orosi', name: 'Orosi', subtitle: 'Camino', color: '#EE6426', scoring: 'orosi' },
]

export const gameById = (id: string) => GAMES.find((g) => g.id === id)
