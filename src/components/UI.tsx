import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { digitsToCents, formatBRL, formatDayMonth, formatSigned } from '../lib/money'
import type { Tx } from '../store/types'
import { getProduct, type Product } from '../lib/invest'
import * as I from './Icons'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function Pill({ className, variant = 'brown', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'brown' | 'outline' | 'solid' | 'ghost' }) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 h-12 text-[17px] font-semibold transition-colors disabled:cursor-not-allowed',
        variant === 'brown' && 'bg-pill text-pillText hover:bg-[#5a3422] disabled:bg-card2 disabled:text-[#777]',
        variant === 'outline' && 'border border-pillText text-pillText hover:bg-pill/40 h-11',
        variant === 'solid' && 'bg-accent text-[#1a0d03] hover:bg-[#f27d18] disabled:bg-card2 disabled:text-[#777]',
        variant === 'ghost' && 'bg-card2 text-white hover:bg-[#333] disabled:text-[#777]',
        className,
      )}
    />
  )
}

export function Card({ className, children, onClick, as = 'div' }: { className?: string; children: ReactNode; onClick?: () => void; as?: 'div' | 'button' }) {
  const cls = cx('bg-card rounded-card', onClick && 'text-left hover:bg-[#262626] transition-colors', className)
  if (as === 'button' || onClick)
    return (
      <button type="button" onClick={onClick} className={cls}>
        {children}
      </button>
    )
  return <div className={cls}>{children}</div>
}

/** Money that respects the global "hide values" switch. */
export function Money({ cents, signed, className }: { cents: number; signed?: boolean; className?: string }) {
  const { state } = useStore()
  if (state.hideBalance) return <span className={className}>R$ •••••</span>
  return <span className={className}>{signed ? formatSigned(cents) : formatBRL(cents)}</span>
}

export function BigBalance({ cents }: { cents: number }) {
  const { state } = useStore()
  return (
    <div className="text-[40px] leading-none font-bold tracking-tight tabular-nums" data-testid="big-balance">
      {state.hideBalance ? (
        <span>
          R$ <span className="tracking-[0.2em]">•••••</span>
        </span>
      ) : (
        formatBRL(cents)
      )}
    </div>
  )
}

export function EyeToggle() {
  const { state, run } = useStore()
  const hidden = state.hideBalance
  return (
    <button
      type="button"
      aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
      aria-pressed={hidden}
      className="p-2 -m-2 rounded-full hover:bg-card"
      onClick={() => run((s) => ({ ...s, hideBalance: !s.hideBalance }))}
    >
      {hidden ? <I.EyeClosed size={28} /> : <I.EyeOpen size={26} />}
    </button>
  )
}

export function Screen({
  title,
  back = true,
  right,
  children,
  big = false,
}: {
  title: string
  back?: boolean | string
  right?: ReactNode
  children: ReactNode
  big?: boolean
}) {
  const nav = useNavigate()
  return (
    <div className="pb-nav">
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur flex items-center gap-4 px-5 pt-safe pb-4">
        {back && (
          <button
            type="button"
            aria-label="Voltar"
            className="p-2 -m-2 rounded-full hover:bg-card"
            onClick={() => (typeof back === 'string' ? nav(back) : window.history.length > 1 ? nav(-1) : nav('/'))}
          >
            <I.ArrowLeft size={28} />
          </button>
        )}
        <h1 className={cx('flex-1 font-semibold truncate', big ? 'text-[32px] font-bold' : 'text-[26px]')}>{title}</h1>
        <div className="flex items-center gap-6">{right}</div>
      </header>
      <main className="px-5">{children}</main>
    </div>
  )
}

export function AmountInput({
  value,
  onChange,
  label = 'Valor',
  autoFocus,
  max,
}: {
  value: number
  onChange: (cents: number) => void
  label?: string
  autoFocus?: boolean
  max?: number
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-muted text-sm mb-2">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoFocus={autoFocus}
        className="w-full bg-transparent border-b-2 border-line focus:border-accent outline-none text-[34px] font-bold tabular-nums py-2"
        value={formatBRL(value)}
        onChange={(e) => onChange(digitsToCents(e.target.value))}
        aria-describedby={max !== undefined ? id + '-max' : undefined}
      />
      {max !== undefined && (
        <p id={id + '-max'} className="text-muted text-sm mt-2">
          Disponível: <Money cents={max} />
        </p>
      )}
    </div>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  inputMode,
  maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  error?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel'
  maxLength?: number
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-muted text-sm mb-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        aria-invalid={!!error}
        aria-describedby={error ? id + '-err' : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'w-full h-14 rounded-2xl bg-transparent border px-4 text-[17px] outline-none focus:border-accent placeholder:text-[#777]',
          error ? 'border-red-400' : 'border-[#555]',
        )}
      />
      {error && (
        <p id={id + '-err'} className="text-red-300 text-sm mt-1.5">
          {error}
        </p>
      )}
    </div>
  )
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null
  return (
    <p role="alert" className="text-red-300 text-sm">
      {children}
    </p>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  // Focus the sheet only when it opens; re-running on every render would steal focus from inputs while typing.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className="relative w-full max-w-[430px] bg-[#1a1a1a] rounded-t-[28px] p-6 pb-8 sheet-in outline-none max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" aria-label="Fechar" className="p-2 -m-2 rounded-full hover:bg-card" onClick={onClose}>
            <I.Close />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Avatar({ src, size = 48, name }: { src?: string; size?: number; name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return src ? (
    <img src={src} alt={`Foto de ${name}`} width={size} height={size} className="rounded-full object-cover border border-line" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full bg-card2 border border-line grid place-items-center font-semibold text-pillText" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-label={`Sem foto de ${name}`}>
      {initials || '?'}
    </div>
  )
}

export function TxRow({ tx }: { tx: Tx }) {
  const positive = tx.amount > 0
  return (
    <li className="flex items-center gap-4 py-4">
      <div className="w-12 h-12 shrink-0 rounded-full bg-card grid place-items-center">{positive ? <I.ArrowDown /> : <I.ArrowUp />}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[17px] truncate">{tx.title}</p>
        <p className="text-muted truncate">{tx.description}</p>
      </div>
      <div className="text-right shrink-0">
        <Money cents={tx.amount} signed className={cx('font-semibold text-[17px] tabular-nums', positive ? 'text-pos' : 'text-white')} />
        <p className="text-muted tabular-nums">{formatDayMonth(tx.date)}</p>
      </div>
    </li>
  )
}

const BADGE: Record<string, { bg: string; icon: ReactNode }> = {
  renda_fixa: { bg: 'bg-accent text-[#1a0d03]', icon: <I.Coin size={26} /> },
  fundo: { bg: 'bg-accent text-[#1a0d03]', icon: <span className="font-extrabold text-[15px]">RF</span> },
  poupanca: { bg: 'bg-pill text-pillText', icon: <I.Coin size={26} /> },
  variavel: { bg: 'bg-[#2b3a67] text-white', icon: <I.Chart size={24} /> },
  cripto: { bg: 'bg-[#F7931A] text-white', icon: <I.Bitcoin size={28} /> },
  global: { bg: 'bg-white text-[#2b3a9b]', icon: <I.Globe size={28} /> },
}

export function ProductBadge({ product, size = 52 }: { product: Product | string; size?: number }) {
  const p = typeof product === 'string' ? getProduct(product) : product
  const b = p.id === 'usdt' ? { bg: 'bg-[#26A17B] text-white', icon: <span className="font-extrabold text-[20px]">₮</span> } : BADGE[p.category]
  return (
    <div className={cx('rounded-full grid place-items-center shrink-0', b.bg)} style={{ width: size, height: size }}>
      {b.icon}
    </div>
  )
}

export function BottomNav() {
  const tabs = [
    { to: '/', label: 'Início', icon: <I.Home />, end: true },
    { to: '/forum', label: 'Fórum', icon: <I.Forum /> },
    { to: '/shop', label: 'Shop', icon: <I.Bag /> },
    { to: '/invest', label: 'Invest', icon: <I.Chart /> },
  ]
  return (
    <nav aria-label="Navegação principal" className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 bg-bg border-t border-line pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4">
        {tabs.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cx(
                  'relative flex flex-col items-center gap-1 pt-3 pb-3 text-[13px] font-medium',
                  isActive ? 'text-white [&_svg]:text-accent before:absolute before:top-[-1px] before:inset-x-3 before:h-[3px] before:bg-accent before:rounded-full' : 'text-muted',
                )
              }
            >
              {t.icon}
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="fixed top-safe-toast left-1/2 -translate-x-1/2 z-[60] w-full max-w-[400px] px-4 space-y-2 pointer-events-none" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className={cx('rounded-2xl px-4 py-3 text-[15px] font-medium shadow-lg toast-in', t.kind === 'error' ? 'bg-[#4a1d1d] text-red-100' : 'bg-[#16382a] text-[#c8f5df]')}>
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-10 mb-2">
      <h2 className="text-[24px] font-semibold">{children}</h2>
      {right}
    </div>
  )
}

/** Hidden file input + trigger. */
export function FilePick({ onFile, children, className, label }: { onFile: (f: File) => void; children: ReactNode; className?: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()} aria-label={label}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        data-testid={label}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </>
  )
}

export function PercentShortcuts({ max, onPick }: { max: number; onPick: (v: number) => void }) {
  return (
    <div className="flex gap-2 mt-4">
      {[25, 50, 100].map((p) => (
        <button key={p} type="button" className="px-4 h-9 rounded-full bg-card2 text-sm font-semibold hover:bg-[#333]" onClick={() => onPick(Math.floor((max * p) / 100))}>
          {p === 100 ? 'Tudo' : `${p}%`}
        </button>
      ))}
    </div>
  )
}
