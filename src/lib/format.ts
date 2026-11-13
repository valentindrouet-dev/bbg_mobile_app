export const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
export const fmtDuration = (m: number | null | undefined) => {
  if (m == null) return '–'
  const h = Math.floor(m / 60), r = Math.round(m % 60)
  return h ? `${h}h${r ? String(r).padStart(2, '0') : ''}` : `${r} min`
}
export const toLocalInput = (t: number) => {
  const d = new Date(t)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
