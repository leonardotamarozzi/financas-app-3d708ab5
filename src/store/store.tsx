import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState } from './types'
import { createInitialState, migrateState, nextPixDelay, processDuePix, UserError } from './logic'
import { pixNotice, systemNotify, type Notice } from '../lib/notify'
import { applyAppIdentity } from '../lib/appIcon'

export const STORAGE_KEY = 'app-financas:v1'
const SESSION_KEY = 'app-financas:unlocked'

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw) as AppState
      if (s && s.version === 1 && Array.isArray(s.transactions)) return migrateState(s)
    }
  } catch {
    /* fall through to a fresh state */
  }
  return createInitialState()
}

interface Toast {
  id: number
  text: string
  kind: 'ok' | 'error'
}

interface Ctx {
  state: AppState
  /** Runs a pure mutation. Returns true on success; shows the error as a toast otherwise. */
  run: (fn: (s: AppState) => AppState, okMessage?: string) => boolean
  replace: (s: AppState) => void
  unlocked: boolean
  setUnlocked: (v: boolean) => void
  toast: (text: string, kind?: 'ok' | 'error') => void
  toasts: Toast[]
  now: Date
  /** Notification banners waiting to be shown (first one is visible). */
  notices: Notice[]
  notify: (n: Omit<Notice, 'id'>) => void
  dismissNotice: (id: number) => void
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  const [unlocked, setUnlockedState] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      return false
    }
  })
  const [toasts, setToasts] = useState<Toast[]>([])
  const [now, setNow] = useState(() => new Date())
  const lastSaved = useRef<string>('')
  const [notices, setNotices] = useState<Notice[]>([])
  const stateRef = useRef(state)
  stateRef.current = state

  const notify = useCallback((n: Omit<Notice, 'id'>) => {
    setNotices((q) => [...q, { ...n, id: Date.now() + Math.random() }])
  }, [])
  const dismissNotice = useCallback((id: number) => setNotices((q) => q.filter((n) => n.id !== id)), [])

  // Credit scheduled Pix that are due; one banner (and system notification) per Pix.
  const processPix = useCallback(() => {
    const r = processDuePix(stateRef.current, new Date())
    if (r.received.length === 0) return
    stateRef.current = r.state
    setState(r.state)
    setNow(new Date())
    for (const pix of r.received) {
      const n = pixNotice(r.state.profile, pix)
      notify(n)
      systemNotify(n)
    }
  }, [notify])

  // On load and whenever the tab becomes visible again (catches Pix that came due while the app was closed).
  useEffect(() => {
    processPix()
    const onVis = () => document.visibilityState === 'visible' && processPix()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [processPix])

  // Timer aimed at the next due Pix; recalculated whenever the list changes.
  useEffect(() => {
    const delay = nextPixDelay(state)
    if (delay === null) return
    const t = setTimeout(processPix, Math.min(delay + 50, 2 ** 31 - 1))
    return () => clearTimeout(t)
  }, [state.scheduledPix, processPix]) // eslint-disable-line react-hooks/exhaustive-deps

  const toast = useCallback((text: string, kind: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  // Persist on every change.
  useEffect(() => {
    const json = JSON.stringify(state)
    if (json === lastSaved.current) return
    try {
      localStorage.setItem(STORAGE_KEY, json)
      lastSaved.current = json
    } catch {
      toast('O armazenamento do navegador está cheio. Use imagens menores ou remova a logo/foto.', 'error')
    }
  }, [state, toast])

  // App name + icon follow the profile.
  useEffect(() => {
    void applyAppIdentity(state.profile.icon, state.profile.appName)
  }, [state.profile.icon, state.profile.appName])

  // Refresh "now" each minute so yields tick forward.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const run = useCallback(
    (fn: (s: AppState) => AppState, okMessage?: string) => {
      try {
        const next = fn(state)
        // Fail fast if the result would not fit in storage.
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          throw new UserError('O armazenamento do navegador está cheio. Use imagens menores.')
        }
        stateRef.current = next
        setState(next)
        setNow(new Date())
        if (okMessage) toast(okMessage)
        return true
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Algo deu errado.', 'error')
        return false
      }
    },
    [state, toast],
  )

  const setUnlocked = useCallback((v: boolean) => {
    setUnlockedState(v)
    try {
      if (v) sessionStorage.setItem(SESSION_KEY, '1')
      else sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ state, run, replace: setState, unlocked, setUnlocked, toast, toasts, now, notices, notify, dismissNotice }),
    [state, run, unlocked, setUnlocked, toast, toasts, now, notices, notify, dismissNotice],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore fora do StoreProvider')
  return ctx
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode('app-financas:' + pin)
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  // Fallback for insecure contexts (no SubtleCrypto): simple FNV-1a.
  let h = 0x811c9dc5
  for (const b of data) h = Math.imul(h ^ b, 0x01000193) >>> 0
  return 'fnv' + h.toString(16)
}
