import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/store'
import { accountBalance, addMovement, MOVEMENT, type MovementKind } from '../store/logic'
import { AmountInput, Field, Pill, Screen } from '../components/UI'
import { formatBRL } from '../lib/money'

const COPY: Record<MovementKind, { screen: string; field: string; placeholder: string; cta: string; done: string }> = {
  pix_out: { screen: 'Enviar Pix', field: 'Para quem', placeholder: 'Nome ou chave Pix', cta: 'Enviar Pix', done: 'Pix enviado' },
  pix_in: { screen: 'Registrar Pix recebido', field: 'De quem', placeholder: 'Nome de quem enviou', cta: 'Registrar Pix', done: 'Pix registrado' },
  payment: { screen: 'Pagar', field: 'O que você está pagando', placeholder: 'Ex.: Conta de luz', cta: 'Pagar', done: 'Pagamento registrado' },
  receive: { screen: 'Receber', field: 'Origem', placeholder: 'Ex.: Salário, venda, reembolso', cta: 'Registrar recebimento', done: 'Recebimento registrado' },
  recharge: { screen: 'Recarga de celular', field: 'Número do celular', placeholder: '(11) 90000-0000', cta: 'Recarregar', done: 'Recarga registrada' },
  transfer_out: { screen: 'Transferir', field: 'Para quem', placeholder: 'Nome do destinatário', cta: 'Transferir', done: 'Transferência registrada' },
}

export default function Movement() {
  const { kind } = useParams()
  const { state, run } = useStore()
  const nav = useNavigate()
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState(0)
  const [errors, setErrors] = useState<{ desc?: string; amount?: string }>({})

  if (!kind || !(kind in MOVEMENT)) return <Navigate to="/" replace />
  const k = kind as MovementKind
  const c = COPY[k]
  const outflow = MOVEMENT[k].sign < 0
  const balance = accountBalance(state)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!desc.trim()) next.desc = 'Preencha este campo.'
    if (amount <= 0) next.amount = 'Informe um valor maior que zero.'
    else if (outflow && amount > balance) next.amount = `Saldo insuficiente. Disponível: ${formatBRL(balance)}.`
    setErrors(next)
    if (Object.keys(next).length) return
    if (run((s) => addMovement(s, k, desc, amount), `${c.done}: ${formatBRL(amount)}.`)) nav('/conta')
  }

  return (
    <Screen title={c.screen}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <div>
          <AmountInput value={amount} onChange={setAmount} autoFocus max={outflow ? balance : undefined} />
          {errors.amount && <p role="alert" className="text-red-300 text-sm mt-2">{errors.amount}</p>}
        </div>
        <Field label={c.field} value={desc} onChange={setDesc} placeholder={c.placeholder} error={errors.desc} inputMode={k === 'recharge' ? 'tel' : 'text'} maxLength={60} />
        <Pill type="submit" variant="solid" className="w-full h-14">
          {c.cta}
        </Pill>
      </form>
    </Screen>
  )
}
