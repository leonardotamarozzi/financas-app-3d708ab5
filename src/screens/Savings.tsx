import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { accountBalance, savingsBalance, savingsDeposit, savingsWithdraw, savingsYield } from '../store/logic'
import { AmountInput, Avatar, BigBalance, Card, EyeToggle, Money, Pill, PercentShortcuts, Screen, Sheet } from '../components/UI'
import { getProduct } from '../lib/invest'
import { formatBRL } from '../lib/money'

export default function Savings() {
  const { state, run, now } = useStore()
  const nav = useNavigate()
  const [mode, setMode] = useState<'in' | 'out' | null>(null)
  const [amount, setAmount] = useState(0)
  const account = accountBalance(state)
  const savings = savingsBalance(state, now)
  const yieldSoFar = savingsYield(state, now)
  const max = mode === 'in' ? account : savings

  function confirm() {
    const ok =
      mode === 'in'
        ? run((s) => savingsDeposit(s, amount), `${formatBRL(amount)} guardados na poupança.`)
        : run((s) => savingsWithdraw(s, amount), `${formatBRL(amount)} resgatados para a conta.`)
    if (ok) {
      setMode(null)
      setAmount(0)
    }
  }

  return (
    <Screen title="Poupança" back="/" right={<EyeToggle />}>
      <Card className="p-5 flex items-center gap-4">
        <Avatar src={state.profile.photo} name={state.profile.name} size={52} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[18px] truncate">{state.profile.name}</p>
          <p className="text-muted text-sm">Foto, nome, saldo, logo e ícone do app</p>
        </div>
        <Pill variant="outline" onClick={() => nav('/ajustar')} className="px-4">
          Ajustar dados
        </Pill>
      </Card>

      <p className="text-muted text-[17px] mt-8 mb-3">Saldo na poupança</p>
      <BigBalance cents={savings} />
      <p className="text-muted mt-3">
        Rendimento acumulado: <Money cents={yieldSoFar} className="text-pos font-semibold" />
      </p>
      <p className="text-muted text-sm mt-1">Rende {getProduct('poupanca').rateLabel(state.rates)}.</p>

      <div className="flex gap-3 mt-7 overflow-x-auto no-scrollbar">
        <Pill onClick={() => setMode('in')}>Guardar</Pill>
        <Pill onClick={() => setMode('out')} disabled={savings === 0}>
          Resgatar
        </Pill>
        <Pill onClick={() => nav('/investir?origem=conta')}>Investir</Pill>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-8">
        <Card className="p-5">
          <p className="text-muted text-sm">Saldo da conta</p>
          <Money cents={account} className="block mt-2 font-semibold text-[18px] tabular-nums" />
        </Card>
        <Card className="p-5">
          <p className="text-muted text-sm">Depósitos ativos</p>
          <p className="mt-2 font-semibold text-[18px]">{state.positions.filter((p) => p.productId === 'poupanca').length}</p>
        </Card>
      </div>

      <Sheet open={mode !== null} onClose={() => setMode(null)} title={mode === 'in' ? 'Guardar na poupança' : 'Resgatar para a conta'}>
        <AmountInput value={amount} onChange={setAmount} max={max} autoFocus />
        <PercentShortcuts max={max} onPick={setAmount} />
        <Pill variant="solid" className="w-full mt-6" disabled={amount <= 0} onClick={confirm}>
          {mode === 'in' ? 'Guardar' : 'Resgatar'}
        </Pill>
      </Sheet>
    </Screen>
  )
}
