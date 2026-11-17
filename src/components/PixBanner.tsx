import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'

/** iOS-style notification banner. Shows the first queued notice; the rest wait their turn. */
export default function PixBanner() {
  const { notices, dismissNotice } = useStore()
  const nav = useNavigate()
  const n = notices[0]
  const [dy, setDy] = useState(0)
  const startY = useRef<number | null>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (!n) return
    setDy(0)
    const t = setTimeout(() => dismissNotice(n.id), 6000)
    return () => clearTimeout(t)
  }, [n, dismissNotice])

  if (!n) return null

  const open = () => {
    dismissNotice(n.id)
    nav('/extrato')
  }

  return (
    <div className="fixed top-safe-notif left-1/2 -translate-x-1/2 z-[70] w-full max-w-[430px] px-2 pointer-events-none">
      <div
        key={n.id}
        role="status"
        aria-live="polite"
        data-testid="pix-banner"
        className="notif-in pointer-events-auto relative flex items-start gap-3 rounded-[22px] px-[14px] py-3 shadow-[0_10px_30px_rgba(0,0,0,0.45)] cursor-pointer select-none touch-none"
        style={{
          background: 'rgba(28,28,30,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transform: dy < 0 ? `translateY(${dy}px)` : undefined,
          opacity: dy < 0 ? Math.max(0, 1 + dy / 80) : undefined,
        }}
        onPointerDown={(e) => {
          startY.current = e.clientY
          moved.current = false
        }}
        onPointerMove={(e) => {
          if (startY.current === null) return
          const d = e.clientY - startY.current
          if (Math.abs(d) > 4) moved.current = true
          setDy(Math.min(0, d))
        }}
        onPointerUp={() => {
          startY.current = null
          if (dy < -30) dismissNotice(n.id)
          else {
            setDy(0)
            if (!moved.current) open()
          }
        }}
        onPointerCancel={() => {
          startY.current = null
          setDy(0)
        }}
        onKeyDown={(e) => (e.key === 'Enter' ? open() : e.key === 'Escape' && dismissNotice(n.id))}
        tabIndex={0}
      >
        <img src={n.icon} alt="" data-testid="pix-banner-icon" className="w-[38px] h-[38px] rounded-[9px] object-cover shrink-0 mt-0.5 bg-[#121212]" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="flex-1 min-w-0 truncate text-[15px] font-semibold text-white" data-testid="pix-banner-title">
              {n.title}
            </p>
            <span className="text-[14px] text-[#9A9A9A] shrink-0 pr-5">agora</span>
          </div>
          <p className="text-[15px] leading-snug text-white line-clamp-4" data-testid="pix-banner-body">
            {n.body}
          </p>
        </div>
        <button
          type="button"
          aria-label="Fechar notificação"
          className="absolute top-0 right-0 w-10 h-10 rounded-tr-[22px] opacity-0 focus-visible:opacity-100 text-[#9A9A9A]"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            dismissNotice(n.id)
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
