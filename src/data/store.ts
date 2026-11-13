import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

export type Partie = {
  id: string
  gameId: string
  date: number
  duration: number | null
  players: number | null
  location: string
  notes: string
  scores?: number[]
  createdAt: number
}
export type PartieInput = Omit<Partie, 'id' | 'createdAt'>

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const isCloud = Boolean(config.apiKey && config.projectId)

type Listener = (list: Partie[]) => void
type Backend = {
  subscribe(gameId: string, cb: Listener): () => void
  add(p: PartieInput): Promise<void>
  update(id: string, p: Partial<PartieInput>): Promise<void>
  remove(id: string): Promise<void>
}

const sortDesc = (l: Partie[]) => l.sort((a, b) => b.date - a.date)
const clean = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T

function cloudBackend(): Backend {
  const app = initializeApp(config)
  const auth = getAuth(app)
  const ready = signInAnonymously(auth).catch(() => undefined)
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
  const col = collection(db, 'parties')
  return {
    subscribe(gameId, cb) {
      let unsub = () => {}
      let stopped = false
      ready.then(() => {
        if (stopped) return
        unsub = onSnapshot(query(col, where('gameId', '==', gameId)), (snap) =>
          cb(sortDesc(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Partie, 'id'>) })))),
        )
      })
      return () => { stopped = true; unsub() }
    },
    async add(p) { await ready; await addDoc(col, clean({ ...p, createdAt: Date.now() })) },
    async update(id, p) { await ready; await updateDoc(doc(col, id), clean(p)) },
    async remove(id) { await ready; await deleteDoc(doc(col, id)) },
  }
}

// Fallback used only when Firebase is not configured (development).
function memoryBackend(): Backend {
  const KEY = 'bbg-dev-parties'
  const listeners = new Set<() => void>()
  const read = (): Partie[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
  const write = (l: Partie[]) => { localStorage.setItem(KEY, JSON.stringify(l)); listeners.forEach((f) => f()) }
  return {
    subscribe(gameId, cb) {
      const f = () => cb(sortDesc(read().filter((p) => p.gameId === gameId)))
      listeners.add(f); f()
      return () => { listeners.delete(f) }
    },
    async add(p) { write([...read(), { ...p, id: crypto.randomUUID(), createdAt: Date.now() }]) },
    async update(id, p) { write(read().map((x) => (x.id === id ? { ...x, ...p } : x))) },
    async remove(id) { write(read().filter((x) => x.id !== id)) },
  }
}

export const store: Backend = isCloud ? cloudBackend() : memoryBackend()

export function useParties(gameId: string) {
  const [list, setList] = useState<Partie[] | null>(null)
  useEffect(() => store.subscribe(gameId, setList), [gameId])
  return list
}
