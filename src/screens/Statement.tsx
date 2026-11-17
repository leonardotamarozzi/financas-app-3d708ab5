import { useMemo, useState } from 'react'
import { useStore } from '../store/store'
import { toCSV } from '../store/logic'
import { Money, Pill, Screen, TxRow, cx } from '../components/UI'
import * as I from '../components/Icons'

const PERIODS = [
  { id: '7', label: '7 dias' },
  { id: '30', label: '30 dias' },
  { id: '90', label: '90 dias' },
  { id: 'all', label: 'Tudo' },
]
const KINDS = [
  { id: 'all', label: 'Todas' },
  { id: 'in', label: 'Entradas' },
  { id: 'out', label: 'Saídas' },
]

function Chips({ items, value, onChange, label }: { items: { id: string; label: string }[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2 overflow-x-auto no-scrollbar">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          role="radio"
          aria-checked={value === i.id}
          onClick={() => onChange(i.id)}
          className={cx('px-4 h-9 rounded-full text-sm font-semibold shrink-0', value === i.id ? 'bg-pill text-pillText' : 'bg-card text-muted')}
        >
          {i.label}
        </button>
      ))}
    </div>
  )
}

export default function Statement() {
  const { state, now, toast } = useStore()
  const [period, setPeriod] = useState('30')
  const [kind, setKind] = useState('all')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const from = period === 'all' ? 0 : now.getTime() - Number(period) * 86_400_000
    return [...state.transactions]
      .filter((t) => new Date(t.date).getTime() >= from)
      .filter((t) => (kind === 'in' ? t.amount > 0 : kind === 'out' ? t.amount < 0 : true))
      .filter((t) => !term || `${t.title} ${t.description}`.toLowerCase().includes(term))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [state.transactions, period, kind, q, now])

  const total = list.reduce((a, t) => a + t.amount, 0)

  function exportCSV() {
    if (list.length === 0) return toast('Não há transações neste filtro para exportar.', 'error')
    const blob = new Blob(['﻿' + toCSV(list)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `extrato-${now.toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast('Extrato exportado em CSV.')
  }

  return (
    <Screen title="Extrato">
      <div className="space-y-3">
        <Chips items={PERIODS} value={period} onChange={setPeriod} label="Período" />
        <Chips items={KINDS} value={kind} onChange={setKind} label="Tipo" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar no extrato" aria-label="Buscar no extrato" className="w-full h-12 rounded-full bg-card px-5 outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <div className="flex items-center justify-between mt-6 text-muted">
        <span>
          {list.length} {list.length === 1 ? 'transação' : 'transações'}
        </span>
        <span>
          Resultado: <Money cents={total} signed className={cx('font-semibold', total >= 0 ? 'text-pos' : 'text-white')} />
        </span>
      </div>
      {list.length === 0 ? (
        <p className="text-muted py-10 text-center">Nenhuma transação neste período. Tente "Tudo".</p>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((t) => (
            <TxRow key={t.id} tx={t} />
          ))}
        </ul>
      )}
      <Pill className="w-full mt-6" onClick={exportCSV}>
        <I.Download size={20} /> Exportar CSV
      </Pill>
    </Screen>
  )
}
