import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { accountBalance } from '../store/logic'
import { BigBalance, Card, EyeToggle, Pill, Screen, TxRow } from '../components/UI'
import * as I from '../components/Icons'

export default function Account() {
  const { state } = useStore()
  const nav = useNavigate()
  const [searching, setSearching] = useState(false)
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const txs = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((t) => !term || `${t.title} ${t.description}`.toLowerCase().includes(term))
    .slice(0, term ? 20 : 5)

  return (
    <Screen title="Conta" back="/" right={<EyeToggle />}>
      <p className="text-muted text-[17px] mb-3">Saldo</p>
      <BigBalance cents={accountBalance(state)} />

      <div className="flex gap-3 mt-8 overflow-x-auto no-scrollbar">
        <Pill onClick={() => nav('/movimento/payment')}>Pagar</Pill>
        <Pill onClick={() => nav('/movimento/receive')}>Receber</Pill>
        <Pill onClick={() => nav('/investir')}>Investir</Pill>
      </div>

      <div className="flex items-center justify-between mt-10">
        <h2 className="text-[24px] font-semibold">Últimas transações</h2>
        <button type="button" aria-label="Buscar transações" aria-expanded={searching} className="p-2 -m-2 rounded-full hover:bg-card" onClick={() => setSearching((v) => !v)}>
          <I.Search size={28} />
        </button>
      </div>
      {searching && (
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou descrição"
          aria-label="Buscar por nome ou descrição"
          className="mt-3 w-full h-12 rounded-full bg-card px-5 outline-none focus:ring-2 focus:ring-accent"
        />
      )}
      {txs.length === 0 ? (
        <p className="text-muted py-6">{term ? 'Nenhuma transação encontrada.' : 'Nenhuma transação ainda. Use Receber ou Pix para registrar a primeira.'}</p>
      ) : (
        <ul>
          {txs.map((t) => (
            <TxRow key={t.id} tx={t} />
          ))}
        </ul>
      )}

      <Pill className="w-full mt-4 h-[56px]" onClick={() => nav('/extrato')}>
        Mostrar extrato
      </Pill>

      <div className="grid grid-cols-2 gap-3 mt-8">
        <Card onClick={() => nav('/portabilidade')} className="p-4 h-[124px] flex flex-col justify-between">
          <I.Salary size={32} />
          <span className="font-medium text-[17px] leading-tight">Portabilidade de salário</span>
        </Card>
        <Card onClick={() => nav('/cambio')} className="p-4 h-[124px] flex flex-col justify-between">
          <I.Exchange size={32} />
          <span className="font-medium text-[17px]">Câmbio</span>
        </Card>
      </div>
    </Screen>
  )
}
