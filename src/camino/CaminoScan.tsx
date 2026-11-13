import { useMemo, useRef, useState } from 'react'
import {
  BOARD_COLOR_NAMES, cardById, COLOR_NAMES, DEFAULT_RULESET, missionDemandeBord, missionDemandeCouleur,
  missionsScannables, PATH_COLORS, scoreLibre,
} from '@bbg/camino-scoring/decompte'
import type { Board, BoardColor, Color, DecompteLibre, MissionChoisie, Rotation } from '@bbg/camino-scoring/decompte'
import {
  calerCoins, detecterPlateau, douteuse, geometrie, homographie, lire, projeter, QUALITE_MINIMALE,
} from '@bbg/camino-scoring/vision'
import type { CaseLue, Point } from '@bbg/camino-scoring/vision'
import { Back } from '../icons'
import { TileGlyph } from './TileGlyph'

/** Order of the Orosi score-sheet rows: Jaune … Violet, then Noir, then Missions. */
const ORDRE: Color[] = ['Y', 'O', 'R', 'G', 'B', 'P']
export function lignesFeuille(d: DecompteLibre): number[] {
  const b = d.bilan
  const lignes = ORDRE.map((c) => b.byColor[c]?.points ?? 0)
  const secrete = d.missions.find((m) => m.card.id === 'secret-color')?.color
  if (secrete) lignes[ORDRE.indexOf(secrete)] += b.secretPoints
  return [...lignes, b.blackPoints, b.cardPoints]
}

const COTE_MAX = 1000
type Photo = { url: string; largeur: number; hauteur: number; pixels: Uint8ClampedArray }

const coinsParDefaut = (w: number, h: number): Point[] => {
  const c = Math.min(w, h) * 0.8, x = (w - c) / 2, y = (h - c) / 2
  return [{ x, y }, { x: x + c, y }, { x: x + c, y: y + c }, { x, y: y + c }]
}

const ROW_LABELS = ['Jaune', 'Orange', 'Rouge', 'Vert', 'Bleu', 'Violet', 'Noir', 'Missions']

type Props = {
  players: string[]
  onCancel: () => void
  onApply: (player: number, lines: number[]) => void
}

export default function CaminoScan({ players, onCancel, onApply }: Props) {
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [coins, setCoins] = useState<Point[]>([])
  const [taille, setTaille] = useState(DEFAULT_RULESET.boardSize)
  const [cases, setCases] = useState<CaseLue[] | null>(null)
  const [selection, setSelection] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [missions, setMissions] = useState<(MissionChoisie | null)[]>([])
  const [couleurPlateau, setCouleurPlateau] = useState<BoardColor>('O')
  const [tire, setTire] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const fichierRef = useRef<HTMLInputElement>(null)

  const lireAvec = (p: Photo, repere: Point[], n = taille) => {
    const l = lire(p.pixels, p.largeur, p.hauteur, repere, n)
    if (!l) { setMessage('Coins impossibles à redresser.'); return }
    setCases(l.cases)
    setSelection(null)
    setMessage(null)
  }

  const ouvrirFichier = (f: File | undefined) => {
    if (!f) return
    setOccupe(true)
    setMessage('…')
    const lecteur = new FileReader()
    lecteur.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const k = Math.min(1, COTE_MAX / Math.max(img.width, img.height))
        const w = Math.round(img.width * k), h = Math.round(img.height * k)
        const c = document.createElement('canvas')
        c.width = w; c.height = h
        const ctx = c.getContext('2d', { willReadFrequently: true })
        if (!ctx) { setMessage('Image illisible.'); setOccupe(false); return }
        ctx.drawImage(img, 0, 0, w, h)
        const p: Photo = { url: String(lecteur.result), largeur: w, hauteur: h, pixels: ctx.getImageData(0, 0, w, h).data }
        setPhoto(p); setCases(null); setSelection(null)
        window.setTimeout(() => {
          const det = detecterPlateau(p.pixels, p.largeur, p.hauteur, taille)
          if (det && det.qualite <= QUALITE_MINIMALE) {
            setCoins(det.coins)
            lireAvec(p, det.coins)
          } else {
            setCoins(det ? det.coins : coinsParDefaut(w, h))
            setMessage('Placez les 4 pastilles sur les coins de la grille noire.')
          }
          setOccupe(false)
        }, 30)
      }
      img.onerror = () => { setMessage('Image illisible.'); setOccupe(false) }
      img.src = String(lecteur.result)
    }
    lecteur.readAsDataURL(f)
  }

  const caler = () => {
    if (!photo) return
    setOccupe(true)
    window.setTimeout(() => {
      const r = calerCoins(photo.pixels, photo.largeur, photo.hauteur, coins, taille)
      setCoins(r.coins)
      lireAvec(photo, r.coins)
      setOccupe(false)
    }, 30)
  }

  const versPhoto = (x: number, y: number): Point | null => {
    const svg = svgRef.current
    if (!svg || !photo) return null
    const r = svg.getBoundingClientRect()
    return { x: ((x - r.left) / r.width) * photo.largeur, y: ((y - r.top) / r.height) * photo.hauteur }
  }

  const grille = useMemo(() => {
    if (!photo || coins.length !== 4) return []
    const h = homographie(coins)
    if (!h) return []
    const lignes: string[] = []
    for (const b of geometrie(taille).barres) {
      for (const horizontal of [true, false]) {
        const pts: string[] = []
        for (let k = 0; k <= 12; k++) {
          const p = horizontal ? projeter(h, k / 12, b) : projeter(h, b, k / 12)
          pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        }
        lignes.push(pts.join(' '))
      }
    }
    return lignes
  }, [photo, coins, taille])

  const plateau: Board | null = useMemo(() => cases && ({
    size: taille,
    cells: cases.map((c, i) => (c.vide ? null : { tileId: c.tileId, rot: c.rot, round: i })),
  }), [cases, taille])

  const choisies = missions.filter((m): m is MissionChoisie => m !== null)
  const besoinDuBord = choisies.some((m) => missionDemandeBord(m.cardId))
  const decompte = useMemo(
    () => (plateau ? scoreLibre(plateau, choisies, couleurPlateau) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plateau, missions, couleurPlateau],
  )
  const lignes = decompte ? lignesFeuille(decompte) : null

  const changerMission = (i: number, cardId: string) => setMissions((prev) => {
    const out = [...prev]
    const card = cardId ? cardById(cardId) : null
    out[i] = card ? {
      cardId,
      color: missionDemandeCouleur(card) ? 'P' : undefined,
      axis: card.randomAxis ? 'col' : undefined,
      seuil: card.seuils?.[0],
    } : null
    return out
  })
  const reglerMission = (i: number, champ: Partial<MissionChoisie>) =>
    setMissions((prev) => prev.map((m, k) => (k === i && m ? { ...m, ...champ } : m)))

  const corriger = (i: number, choix: { tileId: number; rot: Rotation } | null) => {
    if (!cases) return
    const out = cases.map((c) => ({ ...c }))
    if (choix) { out[i].vide = false; out[i].tileId = choix.tileId; out[i].rot = choix.rot } else out[i].vide = true
    out[i].cout = 0
    setCases(out)
  }

  return (
    <div className="scan">
      <header className="scan-top">
        <button className="icon-btn" aria-label="Retour" onClick={onCancel}><Back /></button>
        <img className="scan-logo" src="./img/camino-logo.png" alt="Camino" />
        <select className="scan-size" value={taille} disabled={occupe} aria-label="Taille du plateau"
          onChange={(e) => { setTaille(Number(e.target.value)); setCases(null) }}>
          {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}×{n}</option>)}
        </select>
      </header>

      <input ref={fichierRef} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => { ouvrirFichier(e.target.files?.[0]); e.target.value = '' }} />

      {!photo && (
        <button className="btn btn-primary scan-shoot" disabled={occupe} onClick={() => fichierRef.current?.click()}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
          Photo du plateau
        </button>
      )}

      {photo && (
        <>
          <div className="scan-photo">
            <img src={photo.url} alt="" />
            <svg ref={svgRef} viewBox={`0 0 ${photo.largeur} ${photo.hauteur}`}
              onPointerMove={(e) => {
                if (tire === null) return
                const p = versPhoto(e.clientX, e.clientY)
                if (p) setCoins((c) => c.map((v, i) => (i === tire ? p : v)))
              }}
              onPointerUp={() => setTire(null)} onPointerCancel={() => setTire(null)}>
              {grille.map((pts, i) => <polyline key={i} className="scan-grille" points={pts} />)}
              <polygon className="scan-cadre" points={coins.map((p) => `${p.x},${p.y}`).join(' ')} />
              {coins.map((p, i) => (
                <circle key={i} className={`scan-poignee${tire === i ? ' active' : ''}`} cx={p.x} cy={p.y}
                  r={Math.max(photo.largeur, photo.hauteur) / 30}
                  onPointerDown={(e) => { svgRef.current?.setPointerCapture(e.pointerId); setTire(i) }} />
              ))}
            </svg>
          </div>
          <div className="scan-actions">
            <button className="btn btn-primary" onClick={caler} disabled={occupe}>Caler les coins</button>
            <button className="btn btn-secondary" disabled={occupe} onClick={() => fichierRef.current?.click()}>Nouvelle photo</button>
          </div>
        </>
      )}

      {message && <p className="scan-msg">{message}</p>}

      {cases && lignes && decompte && (
        <>
          <section className="scan-block">
            <div className="scan-missions">
              {[0, 1].map((i) => {
                const m = missions[i] ?? null
                const card = m ? cardById(m.cardId) : null
                const prises = missions.filter((x, k): x is MissionChoisie => !!x && k !== i).map((x) => x.cardId)
                if (i === 1 && !missions[0]) return null
                return (
                  <div key={i} className="field">
                    <span>Mission {i + 1}</span>
                    <select value={m?.cardId ?? ''} onChange={(e) => changerMission(i, e.target.value)}>
                      <option value="">–</option>
                      {missionsScannables().filter((c) => !prises.includes(c.id)).map((c) => (
                        <option key={c.id} value={c.id}>{c.badge} {c.name}</option>
                      ))}
                    </select>
                    {card && m && (missionDemandeCouleur(card) || card.randomAxis || card.seuils) && (
                      <div className="scan-opts">
                        {missionDemandeCouleur(card) && (
                          <select value={m.color ?? 'P'} onChange={(e) => reglerMission(i, { color: e.target.value as Color })}>
                            {PATH_COLORS.map((c) => <option key={c} value={c}>{COLOR_NAMES[c]}</option>)}
                          </select>
                        )}
                        {card.randomAxis && (
                          <select value={m.axis ?? 'col'} onChange={(e) => reglerMission(i, { axis: e.target.value as 'col' | 'row' })}>
                            <option value="col">Colonne</option><option value="row">Ligne</option>
                          </select>
                        )}
                        {card.seuils && (
                          <select value={m.seuil ?? card.seuils[0]} onChange={(e) => reglerMission(i, { seuil: Number(e.target.value) })}>
                            {[...card.seuils].sort((a, b) => a - b).map((n) => <option key={n} value={n}>{n} tuiles</option>)}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {besoinDuBord && (
                <div className="field">
                  <span>Couleur du plateau</span>
                  <select value={couleurPlateau} onChange={(e) => setCouleurPlateau(e.target.value as BoardColor)}>
                    {(Object.keys(BOARD_COLOR_NAMES) as BoardColor[]).map((c) => <option key={c} value={c}>{BOARD_COLOR_NAMES[c]}</option>)}
                  </select>
                </div>
              )}
            </div>
          </section>

          <section className="scan-block">
            <div className="scan-lines">
              {ROW_LABELS.map((l, i) => (
                <div key={l} className="scan-line"><span>{l}</span><b>{lignes[i]}</b></div>
              ))}
              <div className="scan-line total"><span>TOTAL</span><b>{decompte.bilan.total}</b></div>
            </div>
          </section>

          <section className="scan-block">
            <div className="scan-controle" style={{ gridTemplateColumns: `repeat(${taille}, minmax(0, 1fr))` }}>
              {cases.map((c, i) => (
                <button key={i} className={`scan-case${douteuse(c) ? ' doute' : ''}${selection === i ? ' choisie' : ''}`}
                  onClick={() => setSelection(selection === i ? null : i)}>
                  {c.vide ? <span className="scan-vide" /> : <TileGlyph tileId={c.tileId} rot={c.rot} size={56} />}
                </button>
              ))}
            </div>
            {selection !== null && cases[selection] && (
              <div className="scan-choix">
                <div className="scan-choix-tools">
                  <button className="btn btn-secondary" onClick={() => corriger(selection, { tileId: cases[selection].tileId, rot: ((cases[selection].rot + 1) % 4) as Rotation })}>↻</button>
                  <button className="btn btn-secondary" onClick={() => corriger(selection, null)}>Vider</button>
                </div>
                <div className="scan-candidats">
                  {cases[selection].candidats.map((cand) => (
                    <button key={`${cand.tileId}-${cand.rot}`}
                      className={`scan-candidat${cand.tileId === cases[selection].tileId && cand.rot === cases[selection].rot && !cases[selection].vide ? ' actif' : ''}`}
                      onClick={() => corriger(selection, { tileId: cand.tileId, rot: cand.rot })}>
                      <TileGlyph tileId={cand.tileId} rot={cand.rot} size={44} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="scan-block">
            <div className="scan-players">
              {players.map((n, p) => (
                <button key={p} className="btn btn-primary" onClick={() => onApply(p, lignes)}>{n || `J${p + 1}`}</button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
