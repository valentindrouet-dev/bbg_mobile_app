export const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtDuration = (m: number | null | undefined) => {
  if (m == null) return '–'
  const h = Math.floor(m / 60), r = Math.round(m % 60)
  return h ? `${h}h${r ? String(r).padStart(2, '0') : ''}` : `${r} min`
}
export const toDateInput = (t: number) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const fromDateInput = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return y ? new Date(y, m - 1, d, 12).getTime() : NaN
}
