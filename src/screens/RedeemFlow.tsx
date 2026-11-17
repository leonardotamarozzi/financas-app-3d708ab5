import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/store'
import { redeem } from '../store/logic'
import { AmountInput, Card, Money, Pill, PercentShortcuts, ProductBadge, Screen, cx } from '../components/UI'
import { canRedeem, getProduct, positionValue, quoteRedeem } from '../lib/invest'
import { formatBRL, formatDate, formatPercent } from '../lib/money'
import * as I from '../components/Icons'

export default function RedeemFlow() {
  const [params] = useSearchParams()
  const { state, run, now } = useStore()
  const nav = useNavigate()
  const [posId, setPosId] = useState<string | null>(params.get('posicao'))
  const [amount, setAmount] = useState(0)
  const [review, setReview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pos = state.positions.find((p) => p.id === posId) ?? null
  const sorted = [...state.positions].sort((a, b) => a.date.localeCompare(b.date))

  if (!pos) {
    return (
      <Screen title="Resgatar">
        {sorted.length === 0 ? (
          <Card className="p-5">
            <p className="text-muted">Você não tem investimentos para resgatar.</p>
            <Pill className="mt-4" onClick={() => nav('/investir')}>
              Investir agora
            </Pill>
          </Card>
        ) : (
          <ul className="space-y-3">
            {sorted.map((p) => {
              const prod = getProduct(p.productId)
              const check = canRedeem(p, now)
              return (
                <li key={p.id}>
                  <Card onClick={() => setPosId(p.id)} className="w-full p-4 flex items-center gap-3">
                    <ProductBadge product={prod} size={42} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{prod.name}</span>
                      <span className={cx('block text-sm', check.ok ? 'text-muted' : 'text-pillText')}>
                        {check.ok ? `Aplicado em ${formatDate(p.date)}` : `Liberado em ${check.availableOn!.toLocaleDateString('pt-BR')}`}
                      </span>
                    </span>
                    <Money cents={positionValue(p, state.rates, now)} className="font-semibold tabular-nums" />
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </Screen>
    )
  }

  const prod = getProduct(pos.productId)
  const check = canRedeem(pos, now)
  const value = positionValue(pos, state.rates, now)
  const q = quoteRedeem(pos, amount, state.rates, now)

  function toReview() {
    if (amount <= 0) return setError('Informe um valor maior que zero.')
    if (amount > value) return setError(`O máximo para resgate é ${formatBRL(value)}.`)
    setError(null)
    setReview(true)
  }

  function confirm() {
    if (run((s) => redeem(s, pos!.id, amount), `Resgate concluído: ${formatBRL(q.net)} na conta.`)) nav('/invest')
  }

  return (
    <Screen title="Resgatar">
      <button type="button" className="flex items-center gap-3 mb-6 text-left" onClick={() => { setPosId(null); setReview(false); setAmount(0) }} aria-label="Escolher outro investimento">
        <ProductBadge product={prod} size={44} />
        <span>
          <span className="block font-semibold text-[17px]">{prod.name}</span>
          <span className="block text-muted text-sm">
            Aplicado <Money cents={pos.principal} /> em {formatDate(pos.date)} · trocar
          </span>
        </span>
      </button>

      {!check.ok ? (
        <Card className="p-5 flex gap-3">
          <I.Lock className="text-pillText shrink-0" />
          <div>
            <p className="font-semibold">Resgate bloqueado</p>
            <p className="text-muted mt-1">{check.reason}</p>
            <p className="text-muted mt-3">
              Valor atual: <Money cents={value} className="text-white font-semibold" />
            </p>
          </div>
        </Card>
      ) : !review ? (
        <div>
          <AmountInput value={amount} onChange={(v) => { setAmount(v); setError(null) }} max={value} autoFocus label="Valor bruto a resgatar" />
          <PercentShortcuts max={value} onPick={(v) => { setAmount(v); setError(null) }} />
          {error && <p role="alert" className="text-red-300 text-sm mt-3">{error}</p>}
          <Pill variant="solid" className="w-full mt-8 h-14" onClick={toReview}>
            Continuar
          </Pill>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="p-5">
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted">Valor bruto</dt>
                <dd className="font-semibold tabular-nums">{formatBRL(q.gross)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Rendimento no valor</dt>
                <dd className="tabular-nums">{formatBRL(q.gain)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{prod.ir ? `IR (${formatPercent(q.taxRate * 100, 1)})` : 'IR'}</dt>
                <dd className="tabular-nums">{prod.ir ? `-${formatBRL(q.tax)}` : 'Isento'}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3">
                <dt className="font-semibold">Cai na conta</dt>
                <dd className="font-bold text-pos text-[20px] tabular-nums" data-testid="redeem-net">{formatBRL(q.net)}</dd>
              </div>
            </dl>
          </Card>
          {prod.model !== 'fixed' && <p className="text-muted text-sm">IR sobre renda variável e cripto não é simulado.</p>}
          <Pill variant="solid" className="w-full h-14" onClick={confirm}>
            Confirmar resgate
          </Pill>
          <Pill variant="ghost" className="w-full" onClick={() => setReview(false)}>
            Alterar valor
          </Pill>
        </div>
      )}
    </Screen>
  )
}
