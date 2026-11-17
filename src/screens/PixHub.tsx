import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { accountBalance, cancelScheduledPix, schedulePix } from '../store/logic'
import type { ScheduledPix } from '../store/types'
import { AmountInput, Card, Field, Money, Pill, Screen, SectionTitle, Sheet, cx } from '../components/UI'
import * as I from '../components/Icons'

/** Local date-time string for <input type="datetime-local">. */
function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const STATUS: Record<ScheduledPix['status'], { label: string; cls: string }> = {
  agendado: { label: 'Agendado', cls: 'bg-pill text-pillText' },
  recebido: { label: 'Recebido', cls: 'bg-[#16382a] text-pos' },
  cancelado: { label: 'Cancelado', cls: 'bg-card2 text-muted' },
}

export default function PixHub() {
  const { state, run } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [payer, setPayer] = useState('')
  const [amount, setAmount] = useState(0)
  const [when, setWhen] = useState('')
  const [exactDue, setExactDue] = useState<Date | null>(null)
  const [desc, setDesc] = useState('')

  const count = state.transactions.filter((t) => t.type === 'pix_in' || t.type === 'pix_out').length
  const list = [...state.scheduledPix].sort((a, b) => {
    if (a.status === 'agendado' && b.status !== 'agendado') return -1
    if (b.status === 'agendado' && a.status !== 'agendado') return 1
    return a.status === 'agendado' ? a.dueAt.localeCompare(b.dueAt) : b.dueAt.localeCompare(a.dueAt)
  })

  function shortcut(kind: '1m' | '1h' | 'tomorrow') {
    const d = new Date()
    if (kind === '1m') d.setTime(d.getTime() + 60_000)
    else if (kind === '1h') d.setTime(d.getTime() + 3_600_000)
    else {
      d.setDate(d.getDate() + 1)
      d.setHours(9, 0, 0, 0)
    }
    // Keep the exact instant so "Em 1 min" is really one minute away (the input only shows minutes).
    setExactDue(d)
    setWhen(toLocalInput(d))
  }

  function reset() {
    setPayer('')
    setAmount(0)
    setWhen('')
    setExactDue(null)
    setDesc('')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const due = exactDue && toLocalInput(exactDue) === when ? exactDue : when ? new Date(when) : new Date(NaN)
    const ok = run(
      (s) => schedulePix(s, { payerName: payer, amount, dueAt: Number.isNaN(due.getTime()) ? '' : due.toISOString(), description: desc }),
      'Recebimento agendado.',
    )
    if (ok) {
      setOpen(false)
      reset()
    }
  }

  return (
    <Screen title="Pix">
      <p className="text-muted">
        Saldo disponível: <Money cents={accountBalance(state)} className="text-white font-semibold" />
      </p>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Card onClick={() => nav('/movimento/pix_out')} className="p-5 h-[132px] flex flex-col justify-between">
          <I.ArrowUp size={30} />
          <span className="font-semibold text-[17px]">Enviar Pix</span>
        </Card>
        <Card onClick={() => nav('/movimento/pix_in')} className="p-5 h-[132px] flex flex-col justify-between">
          <I.ArrowDown size={30} />
          <span className="font-semibold text-[17px]">Registrar Pix recebido</span>
        </Card>
      </div>

      <section aria-labelledby="receber-title" className="mt-8">
        <h2 id="receber-title" className="text-[20px] font-semibold">
          Receber
        </h2>
        <p className="text-muted mt-1">Agende um Pix que você vai receber. Na hora marcada, o valor entra na conta e aparece uma notificação.</p>
        <Pill className="mt-4" onClick={() => setOpen(true)}>
          <I.ArrowDown size={20} /> Agendar recebimento
        </Pill>
      </section>

      <SectionTitle>Recebimentos agendados</SectionTitle>
      {list.length === 0 ? (
        <p className="text-muted">Nenhum recebimento agendado ainda.</p>
      ) : (
        <ul className="divide-y divide-line" data-testid="scheduled-list">
          {list.map((p) => (
            <li key={p.id} className="py-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[17px] truncate">{p.payerName}</p>
                <p className="text-muted text-sm truncate">
                  {new Date(p.dueAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {p.description ? ` · ${p.description}` : ''}
                </p>
                <span className={cx('inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', STATUS[p.status].cls)}>{STATUS[p.status].label}</span>
              </div>
              <div className="text-right shrink-0">
                <Money cents={p.amount} className={cx('font-semibold tabular-nums', p.status === 'cancelado' ? 'text-muted line-through' : 'text-pos')} />
                {p.status === 'agendado' && (
                  <button type="button" className="block ml-auto mt-1.5 text-sm text-pillText underline underline-offset-4" onClick={() => run((s) => cancelScheduledPix(s, p.id), 'Agendamento cancelado.')}>
                    Cancelar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted mt-6">
        {count} {count === 1 ? 'Pix registrado' : 'Pix registrados'} no total.
      </p>

      <Sheet open={open} onClose={() => setOpen(false)} title="Agendar recebimento">
        <form onSubmit={submit} className="space-y-6" noValidate>
          <Field label="Nome de quem envia" value={payer} onChange={setPayer} maxLength={60} placeholder="Ex.: Maria Exemplo" />
          <AmountInput value={amount} onChange={setAmount} />
          <div>
            <label htmlFor="pix-when" className="block text-muted text-sm mb-2">
              Data e hora
            </label>
            <input
              id="pix-when"
              type="datetime-local"
              value={when}
              onChange={(e) => {
                setWhen(e.target.value)
                setExactDue(null)
              }}
              className="w-full h-14 rounded-2xl bg-transparent border border-[#555] px-4 text-[17px] outline-none focus:border-accent [color-scheme:dark]"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {(
                [
                  ['1m', 'Em 1 min'],
                  ['1h', 'Em 1 hora'],
                  ['tomorrow', 'Amanhã 9h'],
                ] as const
              ).map(([k, label]) => (
                <button key={k} type="button" className="px-4 h-9 rounded-full bg-card2 text-sm font-semibold hover:bg-[#333]" onClick={() => shortcut(k)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Descrição (opcional)" value={desc} onChange={setDesc} maxLength={80} />
          <Pill type="submit" variant="solid" className="w-full h-14">
            Agendar
          </Pill>
        </form>
      </Sheet>
    </Screen>
  )
}
