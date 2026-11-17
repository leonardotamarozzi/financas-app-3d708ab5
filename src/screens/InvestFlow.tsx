import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/store'
import { accountBalance, invest, savingsBalance, type Origin } from '../store/logic'
import { AmountInput, Card, Money, Pill, PercentShortcuts, ProductBadge, cx } from '../components/UI'
import { CATEGORY_LABEL, PRODUCTS, getProduct, type Category } from '../lib/invest'
import { formatBRL } from '../lib/money'
import * as I from '../components/Icons'
import { ProductFacts } from './Products'

type Step = 'produto' | 'origem' | 'valor' | 'revisao' | 'feito'
const STEP_TITLE: Record<Step, string> = {
  produto: 'Escolha o investimento',
  origem: 'De onde sai o dinheiro',
  valor: 'Quanto investir',
  revisao: 'Revise antes de confirmar',
  feito: 'Investimento feito',
}

export default function InvestFlow() {
  const [params] = useSearchParams()
  const { state, run, now } = useStore()
  const nav = useNavigate()
  const preProduct = params.get('produto')
  const preOrigin = params.get('origem') as Origin | null
  const [productId, setProductId] = useState<string | null>(preProduct && PRODUCTS.some((p) => p.id === preProduct) ? preProduct : null)
  const [origin, setOrigin] = useState<Origin | null>(preOrigin === 'conta' || preOrigin === 'poupanca' ? preOrigin : null)
  const [step, setStep] = useState<Step>(!productId ? 'produto' : origin ? 'valor' : 'origem')
  const [amount, setAmount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const product = productId ? getProduct(productId) : null
  const account = accountBalance(state)
  const savings = savingsBalance(state, now)
  const available = origin === 'poupanca' ? savings : account

  function back() {
    setError(null)
    if (step === 'revisao') setStep('valor')
    else if (step === 'valor') setStep('origem')
    else if (step === 'origem') setStep('produto')
    else nav(-1)
  }

  function toReview() {
    if (!product) return
    if (amount <= 0) return setError('Informe um valor maior que zero.')
    if (amount < product.minApplication) return setError(`A aplicação mínima é ${formatBRL(product.minApplication)}.`)
    if (amount > available) return setError(`Saldo insuficiente. Disponível: ${formatBRL(available)}.`)
    setError(null)
    setStep('revisao')
  }

  function confirm() {
    if (!product || !origin) return
    if (run((s) => invest(s, product.id, amount, origin))) setStep('feito')
  }

  const grouped = (Object.keys(CATEGORY_LABEL) as Category[]).map((c) => ({ c, items: PRODUCTS.filter((p) => p.category === c) }))
  const annual = product?.model === 'fixed' && product.annualRate ? product.annualRate(state.rates) : null

  return (
    <div className="pb-nav">
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur flex items-center gap-4 px-5 pt-safe pb-4">
        {step !== 'feito' && (
          <button type="button" aria-label="Voltar" className="p-2 -m-2 rounded-full hover:bg-card" onClick={back}>
            <I.ArrowLeft size={28} />
          </button>
        )}
        <h1 className="flex-1 text-[24px] font-semibold">{STEP_TITLE[step]}</h1>
      </header>
      <main className="px-5">
        {step !== 'produto' && step !== 'feito' && product && (
          <div className="flex items-center gap-3 mb-6">
            <ProductBadge product={product} size={40} />
            <div>
              <p className="font-semibold">{product.name}</p>
              <p className="text-pos text-sm font-semibold">{product.rateLabel(state.rates)}</p>
            </div>
          </div>
        )}

        {step === 'produto' && (
          <div className="space-y-6">
            {grouped.map(({ c, items }) => (
              <section key={c}>
                <h2 className="text-muted mb-2">{CATEGORY_LABEL[c]}</h2>
                <ul className="space-y-2">
                  {items.map((p) => (
                    <li key={p.id}>
                      <Card
                        onClick={() => {
                          setProductId(p.id)
                          setStep(origin ? 'valor' : 'origem')
                        }}
                        className="w-full p-4 flex items-center gap-3"
                      >
                        <ProductBadge product={p} size={40} />
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold truncate">{p.name}</span>
                          <span className="block text-muted text-sm">{p.rateLabel(state.rates)}</span>
                          <span className="block text-muted text-sm">Mínimo {formatBRL(p.minApplication)}</span>
                        </span>
                        <I.ChevronRight className="text-muted" />
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {step === 'origem' && product && (
          <div className="space-y-3">
            {(
              [
                { id: 'conta', label: 'Saldo da conta', value: account, disabled: account <= 0 },
                { id: 'poupanca', label: 'Poupança', value: savings, disabled: savings <= 0 || product.id === 'poupanca' },
              ] as const
            ).map((o) => (
              <Card
                key={o.id}
                onClick={
                  o.disabled
                    ? undefined
                    : () => {
                        setOrigin(o.id)
                        setStep('valor')
                      }
                }
                className={cx('w-full p-5 flex items-center justify-between', o.disabled && 'opacity-50')}
              >
                <span>
                  <span className="block font-semibold text-[17px]">{o.label}</span>
                  <Money cents={o.value} className="block text-muted" />
                </span>
                {o.disabled ? <span className="text-sm text-muted">{product.id === 'poupanca' && o.id === 'poupanca' ? 'Indisponível' : 'Sem saldo'}</span> : <I.ChevronRight />}
              </Card>
            ))}
            {account <= 0 && savings <= 0 && <p className="text-muted">Você não tem saldo. Ajuste seu saldo em Poupança → Ajustar dados ou registre um recebimento.</p>}
          </div>
        )}

        {step === 'valor' && product && (
          <div>
            <AmountInput value={amount} onChange={(v) => { setAmount(v); setError(null) }} max={available} autoFocus label={origin === 'poupanca' ? 'Valor (sai da poupança)' : 'Valor (sai da conta)'} />
            <PercentShortcuts max={available} onPick={(v) => { setAmount(v); setError(null) }} />
            <p className="text-muted text-sm mt-4">Aplicação mínima: {formatBRL(product.minApplication)}</p>
            {error && <p role="alert" className="text-red-300 text-sm mt-2">{error}</p>}
            <Pill variant="solid" className="w-full mt-8 h-14" onClick={toReview}>
              Continuar
            </Pill>
          </div>
        )}

        {step === 'revisao' && product && (
          <div className="space-y-4">
            <Card className="p-5">
              <p className="text-muted">Você vai investir</p>
              <p className="text-[32px] font-bold tabular-nums">{formatBRL(amount)}</p>
              <p className="text-muted mt-1">Saindo de: {origin === 'poupanca' ? 'Poupança' : 'Saldo da conta'}</p>
              {annual !== null && (
                <p className="mt-3">
                  Estimativa em 12 meses: <span className="text-pos font-semibold">{formatBRL(Math.round(amount * (1 + annual)))}</span>
                  <span className="text-muted text-sm"> (bruto)</span>
                </p>
              )}
            </Card>
            <Card className="p-5">
              <ProductFacts p={product} />
            </Card>
            <p className="text-muted text-sm">Simulação educativa: nenhum dinheiro real é movimentado.</p>
            <Pill variant="solid" className="w-full h-14" onClick={confirm}>
              Confirmar investimento
            </Pill>
          </div>
        )}

        {step === 'feito' && product && (
          <div className="flex flex-col items-center text-center mt-10 gap-3">
            <div className="w-20 h-20 rounded-full bg-[#16382a] text-pos grid place-items-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </div>
            <p className="text-[22px] font-semibold">
              {formatBRL(amount)} em {product.name}
            </p>
            <p className="text-muted">O valor já aparece na sua carteira e começa a render hoje.</p>
            <div className="flex gap-3 mt-6">
              <Pill onClick={() => nav('/invest')}>Ver carteira</Pill>
              <Pill
                variant="ghost"
                onClick={() => {
                  setAmount(0)
                  setStep('produto')
                }}
              >
                Investir de novo
              </Pill>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
