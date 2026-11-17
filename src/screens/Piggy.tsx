import { useState } from 'react'
import { useStore } from '../store/store'
import { accountBalance, piggyBalance, piggyDeposit, piggyWithdraw } from '../store/logic'
import { AmountInput, BigBalance, Pill, PercentShortcuts, Screen, Sheet } from '../components/UI'
import { formatBRL } from '../lib/money'

export function PigArt({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <defs>
        <radialGradient id="pig-grad" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FFB45C" />
          <stop offset="1" stopColor="#D9620A" />
        </radialGradient>
      </defs>
      <path d="M26 30 L34 14 L46 28 Z M94 30 L86 14 L74 28 Z" fill="#E07A1F" />
      <circle cx="60" cy="64" r="44" fill="url(#pig-grad)" />
      <ellipse cx="60" cy="74" rx="20" ry="14" fill="#FFF3E6" />
      <ellipse cx="53" cy="74" rx="3.5" ry="5" fill="#C5590A" />
      <ellipse cx="67" cy="74" rx="3.5" ry="5" fill="#C5590A" />
      <ellipse cx="42" cy="52" rx="4" ry="6" fill="#FFF3E6" />
      <ellipse cx="78" cy="52" rx="4" ry="6" fill="#FFF3E6" />
      <rect x="50" y="22" width="20" height="5" rx="2.5" fill="#8a3a05" />
    </svg>
  )
}

export default function Piggy() {
  const { state, run } = useStore()
  const [mode, setMode] = useState<'in' | 'out' | null>(null)
  const [amount, setAmount] = useState(0)
  const bal = piggyBalance(state)
  const max = mode === 'in' ? accountBalance(state) : bal

  function confirm() {
    const ok =
      mode === 'in'
        ? run((s) => piggyDeposit(s, amount), `${formatBRL(amount)} guardados no porquinho.`)
        : run((s) => piggyWithdraw(s, amount), `${formatBRL(amount)} devolvidos para a conta.`)
    if (ok) {
      setMode(null)
      setAmount(0)
    }
  }

  return (
    <Screen title="Meu Porquinho">
      <div className="bg-card rounded-card p-6 flex items-center justify-between">
        <div>
          <p className="text-muted mb-3">Guardado</p>
          <BigBalance cents={bal} />
        </div>
        <PigArt size={104} />
      </div>
      <p className="text-muted mt-4">Separe dinheiro da conta para não gastar sem querer. O porquinho não rende: para render, use a Poupança ou os investimentos.</p>
      <div className="flex gap-3 mt-6">
        <Pill onClick={() => setMode('in')}>Guardar dinheiro</Pill>
        <Pill onClick={() => setMode('out')} disabled={bal === 0}>
          Retirar
        </Pill>
      </div>
      <Sheet open={mode !== null} onClose={() => setMode(null)} title={mode === 'in' ? 'Guardar no porquinho' : 'Retirar do porquinho'}>
        <AmountInput value={amount} onChange={setAmount} max={max} autoFocus />
        <PercentShortcuts max={max} onPick={setAmount} />
        <Pill variant="solid" className="w-full mt-6" disabled={amount <= 0} onClick={confirm}>
          {mode === 'in' ? 'Guardar' : 'Retirar'}
        </Pill>
      </Sheet>
    </Screen>
  )
}
