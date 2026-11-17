import { useState } from 'react'
import { useStore } from '../store/store'
import { AmountInput, Card, Field, Pill, Screen, cx } from '../components/UI'
import { formatBRL, formatNumber, parseBRL } from '../lib/money'

type Cur = 'usd' | 'eur'
const SYMBOL: Record<Cur, string> = { usd: 'US$', eur: '€' }
const NAME: Record<Cur, string> = { usd: 'Dólar', eur: 'Euro' }

export default function ExchangeScreen() {
  const { state, run } = useStore()
  const [cur, setCur] = useState<Cur>('usd')
  const [dir, setDir] = useState<'brl' | 'fx'>('brl')
  const [amount, setAmount] = useState(10000)
  const [usd, setUsd] = useState(formatNumber(state.rates.usd, 2))
  const [eur, setEur] = useState(formatNumber(state.rates.eur, 2))
  const [err, setErr] = useState<string | null>(null)

  const rate = state.rates[cur]
  const result = dir === 'brl' ? amount / 100 / rate : (amount / 100) * rate

  function saveRates() {
    const u = parseBRL(usd)
    const e = parseBRL(eur)
    if (!u || !e) return setErr('Informe cotações maiores que zero, como 5,35.')
    setErr(null)
    run((s) => ({ ...s, rates: { ...s.rates, usd: u / 100, eur: e / 100 } }), 'Cotações salvas.')
  }

  return (
    <Screen title="Câmbio">
      <p className="text-muted">Converta valores com a cotação que você definir. Ela também é usada nos investimentos em dólar.</p>
      <div className="flex gap-2 mt-5">
        {(['usd', 'eur'] as Cur[]).map((c) => (
          <button key={c} type="button" aria-pressed={cur === c} onClick={() => setCur(c)} className={cx('px-5 h-10 rounded-full font-semibold', cur === c ? 'bg-pill text-pillText' : 'bg-card text-muted')}>
            {NAME[c]}
          </button>
        ))}
      </div>

      <Card className="p-5 mt-5">
        <AmountInput value={amount} onChange={setAmount} label={dir === 'brl' ? 'Valor em reais' : `Valor em ${NAME[cur].toLowerCase()}`} />
        <button type="button" className="mt-4 text-pillText font-semibold" onClick={() => setDir((d) => (d === 'brl' ? 'fx' : 'brl'))}>
          Inverter conversão
        </button>
        <p className="mt-5 text-muted">Você recebe</p>
        <p className="text-[30px] font-bold tabular-nums" data-testid="fx-result">
          {dir === 'brl' ? `${SYMBOL[cur]} ${formatNumber(result)}` : formatBRL(Math.round(result * 100))}
        </p>
        <p className="text-muted text-sm mt-1">
          1 {SYMBOL[cur]} = {formatBRL(Math.round(rate * 100))}
        </p>
      </Card>

      <h2 className="text-xl font-semibold mt-8 mb-3">Cotações</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dólar (R$)" value={usd} onChange={setUsd} inputMode="decimal" />
        <Field label="Euro (R$)" value={eur} onChange={setEur} inputMode="decimal" />
      </div>
      {err && <p role="alert" className="text-red-300 text-sm mt-2">{err}</p>}
      <Pill className="w-full mt-5" onClick={saveRates}>
        Salvar cotações
      </Pill>
    </Screen>
  )
}
