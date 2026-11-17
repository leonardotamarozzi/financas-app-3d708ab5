import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { accountBalance, monthSummary, piggyBalance } from '../store/logic'
import { Avatar, BigBalance, Card, EyeToggle, Money, Pill, ProductBadge, TxRow } from '../components/UI'
import * as I from '../components/Icons'
import { PRODUCTS } from '../lib/invest'

export default function Home() {
  const { state, run, now } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const balance = accountBalance(state)
  const summary = monthSummary(state, now)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return null
    const txs = [...state.transactions]
      .reverse()
      .filter((t) => `${t.title} ${t.description}`.toLowerCase().includes(term))
      .slice(0, 8)
    const prods = PRODUCTS.filter((p) => `${p.name} ${p.issuer} ${p.short}`.toLowerCase().includes(term))
    return { txs, prods }
  }, [q, state.transactions])

  const shortcuts = [
    { label: 'Poupança', icon: <I.Coin size={30} />, to: '/poupanca' },
    { label: 'Recargas', icon: <I.Phone size={30} />, to: '/movimento/recharge' },
    { label: 'Transferir', icon: <I.Transfer size={30} />, to: '/movimento/transfer_out' },
    { label: 'Metas', icon: <I.Target size={30} />, to: '/metas' },
  ]

  return (
    <div className="pb-28">
      <header className="flex items-center justify-between px-5 pt-5">
        <button type="button" aria-label="Ajustar dados do perfil" onClick={() => nav('/ajustar')} className="rounded-full">
          <Avatar src={state.profile.photo} name={state.profile.name} size={52} />
        </button>
        <div className="flex items-center gap-7">
          <button type="button" aria-label="Configurações" className="p-2 -m-2 rounded-full hover:bg-card" onClick={() => nav('/config')}>
            <I.Settings size={26} />
          </button>
          <button type="button" aria-label="Ajuda" className="p-2 -m-2 rounded-full hover:bg-card" onClick={() => nav('/ajuda')}>
            <I.Help size={28} />
          </button>
          <EyeToggle />
        </div>
      </header>

      <main className="px-5">
        <label className="mt-6 flex items-center gap-3 h-14 rounded-full bg-card px-3">
          <span className="w-9 h-9 rounded-full grid place-items-center bg-gradient-to-br from-[#c9853a] to-[#7a4a1d] text-white shrink-0">
            <I.Search size={18} />
          </span>
          <span className="sr-only">Buscar</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Busque em ${state.profile.appName}`}
            className="flex-1 bg-transparent outline-none text-[18px] placeholder:text-[#9a9a9a]"
          />
          {q && (
            <button type="button" aria-label="Limpar busca" onClick={() => setQ('')} className="p-1 text-muted">
              <I.Close size={20} />
            </button>
          )}
        </label>

        {results && (
          <section className="mt-4 bg-card rounded-card p-4" aria-label="Resultados da busca">
            {results.txs.length === 0 && results.prods.length === 0 && <p className="text-muted">Nada encontrado para "{q}".</p>}
            {results.prods.map((p) => (
              <button key={p.id} type="button" onClick={() => nav(`/investir?produto=${p.id}`)} className="w-full flex items-center gap-3 py-2 text-left">
                <ProductBadge product={p} size={36} />
                <span className="flex-1">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="block text-muted text-sm">{p.rateLabel(state.rates)}</span>
                </span>
                <I.ChevronRight className="text-muted" />
              </button>
            ))}
            {results.txs.length > 0 && (
              <ul className="divide-y divide-line">
                {results.txs.map((t) => (
                  <TxRow key={t.id} tx={t} />
                ))}
              </ul>
            )}
          </section>
        )}

        {state.sampleData && (
          <div className="mt-5 bg-card rounded-card p-4 flex gap-3 items-start" role="note">
            <span className="text-[#d6a400] mt-0.5">
              <I.Help size={22} />
            </span>
            <div className="flex-1">
              <p className="font-semibold">Você está vendo dados de exemplo</p>
              <p className="text-muted text-[15px]">Comece do zero para registrar só as suas movimentações.</p>
              <div className="flex gap-4 mt-2">
                <button type="button" className="text-pillText font-semibold underline underline-offset-4" onClick={() => run((s) => ({ ...s, transactions: [], sampleData: false }), 'Pronto. Defina seu saldo em Poupança → Ajustar dados.')}>
                  Começar vazio
                </button>
                <button type="button" className="text-muted font-semibold" onClick={() => run((s) => ({ ...s, sampleData: false }))}>
                  Manter
                </button>
              </div>
            </div>
          </div>
        )}

        <button type="button" onClick={() => nav('/conta')} className="mt-8 w-full text-left flex items-end justify-between group" aria-label="Ver conta e extrato">
          <div>
            <p className="text-muted text-[17px] mb-3">Saldo</p>
            <BigBalance cents={balance} />
          </div>
          <I.ChevronRight size={30} className="mb-1 text-white group-hover:translate-x-0.5 transition-transform" />
        </button>

        <div className="flex gap-3 mt-7 overflow-x-auto no-scrollbar">
          <Pill onClick={() => nav('/pix')}>
            <I.PixIcon size={20} /> Pix
          </Pill>
          <Pill onClick={() => nav('/movimento/payment')}>Pagar</Pill>
          <Pill onClick={() => nav('/cartoes')}>Cartões</Pill>
        </div>

        <div className="mt-6 -mx-5 px-5 flex gap-3 overflow-x-auto no-scrollbar snap-x">
          {shortcuts.map((s) => (
            <Card key={s.label} onClick={() => nav(s.to)} className="snap-start shrink-0 w-[124px] h-[124px] p-4 flex flex-col justify-between">
              {s.icon}
              <span className="font-medium text-[17px]">{s.label}</span>
            </Card>
          ))}
        </div>

        <section className="mt-6 rounded-card p-5 bg-[#FFD8A8] text-[#5a2a06] relative overflow-hidden" aria-label="Resumo do mês">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#ffc27a]" aria-hidden />
          <div className="relative">
            <p className="font-bold text-[26px] leading-tight text-[#d4610a]">Seu mês até agora</p>
            <dl className="mt-4 grid grid-cols-3 gap-2">
              <div>
                <dt className="text-sm">Entradas</dt>
                <dd className="font-bold tabular-nums"><Money cents={summary.income} /></dd>
              </div>
              <div>
                <dt className="text-sm">Saídas</dt>
                <dd className="font-bold tabular-nums"><Money cents={summary.expenses} /></dd>
              </div>
              <div>
                <dt className="text-sm">Rendimento</dt>
                <dd className="font-bold tabular-nums"><Money cents={summary.gains} /></dd>
              </div>
            </dl>
            <button type="button" onClick={() => nav('/extrato')} className="mt-4 inline-flex items-center h-10 px-5 rounded-full bg-[#9a3f06] text-white font-semibold">
              Ver extrato
            </button>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card onClick={() => nav('/porquinho')} className="p-5 h-[120px] flex flex-col justify-between">
            <span className="font-medium text-[18px]">Meu Porquinho</span>
            <Money cents={piggyBalance(state)} className="text-pillText font-semibold tabular-nums" />
          </Card>
          <Card onClick={() => nav('/invest')} className="p-5 h-[120px] flex flex-col justify-between">
            <span className="font-medium text-[18px]">Investimentos</span>
            <span className="text-pos font-semibold">Ver carteira</span>
          </Card>
        </div>
      </main>
    </div>
  )
}
