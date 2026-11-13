import type { Partie } from '../data/store'
import type { Game } from '../data/games'

const esc = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const csvDate = (t: number) => new Date(t).toLocaleDateString('fr-FR')

export function toCsv(game: Game, list: Partie[]) {
  const teams = Boolean(game.teams)
  const nPlayers = Math.max(0, ...list.map((p) => p.scores?.length ?? 0))
  const withNames = list.some((p) => p.names?.some(Boolean))
  const playerHead = Array.from({ length: nPlayers }, (_, i) =>
    withNames ? [`Joueur ${i + 1}`, `Score ${i + 1}`] : [`Score ${i + 1}`]).flat()
  const head = [
    'Jeu', 'Version', 'Date', 'Durée (min)', 'Joueurs', 'Lieu',
    ...(teams ? ['Équipe gagnante'] : []), 'Note (étoiles)', 'Retours', ...playerHead,
  ]
  const rows = list.map((p) => [
    game.name, p.version ?? '', csvDate(p.date), p.duration ?? '', p.players ?? '', p.location,
    ...(teams ? [game.teams?.find((t) => t.id === p.winner)?.label ?? ''] : []),
    p.rating ?? 1, p.notes,
    ...Array.from({ length: nPlayers }, (_, i) =>
      withNames ? [p.names?.[i] ?? '', p.scores?.[i] ?? ''] : [p.scores?.[i] ?? '']).flat(),
  ])
  return '\uFEFF' + [head, ...rows].map((r) => r.map(esc).join(';')).join('\n')
}

export async function exportParties(game: Game, list: Partie[], label?: string) {
  const name = `${game.name}-parties-${label ?? new Date().toISOString().slice(0, 10)}.csv`
  const file = new File([toCsv(game, list)], name, { type: 'text/csv' })
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
