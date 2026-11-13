import type { Partie } from '../data/store'
import type { Game } from '../data/games'
import { fmtDate } from './format'

const esc = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(game: Game, list: Partie[]) {
  const teams = Boolean(game.teams)
  const head = ['Jeu', 'Date', 'Durée (min)', 'Joueurs', 'Lieu', ...(teams ? ['Équipe gagnante'] : []), 'Notes', 'Scores']
  const rows = list.map((p) => [
    game.name, fmtDate(p.date), p.duration ?? '', p.players ?? '',
    p.location, ...(teams ? [game.teams?.find((t) => t.id === p.winner)?.label ?? ''] : []), p.notes,
    p.scores?.map((sc, i) => (p.names?.[i] ? `${p.names[i]} ${sc}` : sc)).join(' / ') ?? '',
  ])
  return '﻿' + [head, ...rows].map((r) => r.map(esc).join(';')).join('\n')
}

export async function exportParties(game: Game, list: Partie[]) {
  const name = `${game.name}-parties-${new Date().toISOString().slice(0, 10)}.csv`
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
