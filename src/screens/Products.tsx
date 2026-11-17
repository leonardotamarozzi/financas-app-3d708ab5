import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/store'
import { Card, Screen, ProductBadge, cx } from '../components/UI'
import { CATEGORY_LABEL, PRODUCTS, RISK_LABEL, type Category, type Product } from '../lib/invest'
import { formatBRL } from '../lib/money'
import * as I from '../components/Icons'

export function ProductFacts({ p }: { p: Product }) {
  const { state } = useStore()
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[15px]">
      <div>
        <dt className="text-muted text-sm">Rentabilidade</dt>
        <dd className="font-semibold">{p.rateLabel(state.rates)}</dd>
      </div>
      <div>
        <dt className="text-muted text-sm">Liquidez</dt>
        <dd className="font-semibold">{p.term}</dd>
      </div>
      <div>
        <dt className="text-muted text-sm">Aplicação mínima</dt>
        <dd className="font-semibold">{formatBRL(p.minApplication)}</dd>
      </div>
      <div>
        <dt className="text-muted text-sm">Risco</dt>
        <dd className={cx('font-semibold', p.risk === 'alto' ? 'text-red-300' : p.risk === 'medio' ? 'text-pillText' : 'text-pos')}>{RISK_LABEL[p.risk]}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-muted text-sm">Emissor</dt>
        <dd className="font-semibold">
          {p.issuer} {p.ir ? '· IR regressivo' : '· Isento de IR'}
        </dd>
      </div>
    </dl>
  )
}

const CATS: (Category | 'all')[] = ['all', 'renda_fixa', 'fundo', 'poupanca', 'variavel', 'cripto', 'global']

export default function Products() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { state } = useStore()
  const [cat, setCat] = useState<Category | 'all'>((params.get('cat') as Category) || 'all')
  const [q, setQ] = useState('')
  const list = PRODUCTS.filter((p) => (cat === 'all' || p.category === cat) && `${p.name} ${p.issuer}`.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <Screen title="Produtos">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" aria-label="Buscar produto" className="w-full h-12 rounded-full bg-card px-5 outline-none focus:ring-2 focus:ring-accent" />
      <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 -mx-5 px-5" role="radiogroup" aria-label="Categoria">
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={cat === c}
            onClick={() => setCat(c)}
            className={cx('px-4 h-9 rounded-full text-sm font-semibold shrink-0', cat === c ? 'bg-pill text-pillText' : 'bg-card text-muted')}
          >
            {c === 'all' ? 'Todos' : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      <ul className="space-y-3 mt-5">
        {list.map((p) => (
          <li key={p.id}>
            <Card onClick={() => nav(`/investir?produto=${p.id}`)} className="w-full p-4">
              <div className="flex items-center gap-3 mb-4">
                <ProductBadge product={p} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[17px] truncate">{p.name}</p>
                  <p className="text-pos text-sm font-semibold">{p.rateLabel(state.rates)}</p>
                </div>
                <I.ChevronRight className="text-muted" />
              </div>
              <ProductFacts p={p} />
            </Card>
          </li>
        ))}
        {list.length === 0 && <p className="text-muted py-8 text-center">Nenhum produto encontrado.</p>}
      </ul>
    </Screen>
  )
}
