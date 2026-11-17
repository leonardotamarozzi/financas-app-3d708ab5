import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store/store'
import { investPositions, netWorthSeries, totalInvested } from '../store/logic'
import { BigBalance, Card, EyeToggle, Money, Pill, ProductBadge, SectionTitle, cx } from '../components/UI'
import * as I from '../components/Icons'
import { CATEGORY_LABEL, dailyChange, getProduct, positionValue, type Category } from '../lib/invest'
import { formatBRL, formatPercent } from '../lib/money'
import { GoalsCard } from './GoalsPage'
import { PigArt } from './Piggy'

const CAT_COLORS: Record<Category, string> = {
  renda_fixa: '#E8700A',
  fundo: '#F0A060',
  poupanca: '#8A4B26',
  variavel: '#5B7BD5',
  cripto: '#F7C948',
  global: '#2ECC8F',
}

function BrFlag() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <circle cx="14" cy="14" r="14" fill="#1F9D3A" />
      <path d="M14 5 25 14 14 23 3 14Z" fill="#F7D117" />
      <circle cx="14" cy="14" r="5" fill="#1B3F94" />
    </svg>
  )
}

export default function Invest() {
  const { state, now } = useStore()
  const nav = useNavigate()
  const positions = investPositions(state)
  const total = totalInvested(state, now)

  const allocation = useMemo(() => {
    const map = new Map<Category, number>()
    for (const p of state.positions) {
      const cat = getProduct(p.productId).category
      map.set(cat, (map.get(cat) ?? 0) + positionValue(p, state.rates, now))
    }
    return [...map.entries()].map(([cat, value]) => ({ name: CATEGORY_LABEL[cat], value, color: CAT_COLORS[cat] }))
  }, [state.positions, state.rates, now])

  const series = useMemo(() => netWorthSeries(state, now, 30), [state, now])
  const allocTotal = allocation.reduce((a, x) => a + x.value, 0)

  return (
    <div className="pb-nav">
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur flex items-center px-5 pt-safe pb-4">
        <h1 className="flex-1 min-w-0 truncate text-[30px] font-bold">Investimentos</h1>
        <div className="flex items-center gap-6 shrink-0 pl-3">
          <EyeToggle />
          <button type="button" aria-label="Buscar produtos" className="p-2 -m-2 rounded-full hover:bg-card" onClick={() => nav('/produtos')}>
            <I.Search size={28} />
          </button>
          <button type="button" aria-label="Configurações" className="p-2 -m-2 rounded-full hover:bg-card" onClick={() => nav('/config')}>
            <I.Menu size={28} />
          </button>
        </div>
      </header>

      <main className="px-5">
        <Card className="p-5 flex items-center gap-4">
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
            <path d="M20 4 36 20 20 36 4 20Z" fill="#C79A00" />
            <path d="M20 12v10M20 27v.5" stroke="#121212" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[17px]">Rendimentos usam suas taxas</p>
            <p className="text-muted truncate">
              CDI {formatPercent(state.rates.cdi)} · Selic {formatPercent(state.rates.selic)}
            </p>
            <button type="button" onClick={() => nav('/config')} className="text-pillText font-semibold underline underline-offset-4 decoration-2">
              Ajustar taxas
            </button>
          </div>
        </Card>

        <div className="mt-9 flex items-center gap-3">
          <BrFlag />
          <p className="text-[18px]">Total investido</p>
        </div>
        <div className="mt-4">
          <BigBalance cents={total} />
        </div>

        <div className="flex gap-3 mt-7">
          <Pill onClick={() => nav('/investir')}>Investir</Pill>
          <Pill onClick={() => nav('/resgatar')} disabled={state.positions.length === 0}>
            Resgatar
          </Pill>
        </div>

        <div className="mt-8">
          <GoalsCard />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <Card onClick={() => nav('/investir?produto=fundo-rf')} className="p-5 min-h-[196px] flex flex-col justify-between">
            <ProductBadge product="fundo-rf" />
            <span className="text-[18px] leading-snug">
              Fundo
              <br />
              Renda Fixa
              <span className="block text-pos font-semibold">Liquidez Diária</span>
            </span>
          </Card>
          <Card onClick={() => nav('/investir?produto=btc')} className="p-5 min-h-[196px] flex flex-col justify-between">
            <ProductBadge product="btc" />
            <span className="text-[18px] leading-snug">
              Bitcoin + USDT
              <span className="block text-pos font-semibold">Compre aqui!</span>
            </span>
          </Card>
          <Card onClick={() => nav('/investir?produto=global')} className="p-5 min-h-[180px] flex flex-col justify-between">
            <ProductBadge product="global" />
            <span className="text-[18px] leading-snug">
              Global
              <span className="block text-pos font-semibold">Invista em Dólar!</span>
            </span>
          </Card>
          <Card onClick={() => nav('/investir?produto=cdb-liquidez')} className="p-5 min-h-[180px] flex flex-col justify-between">
            <ProductBadge product="cdb-liquidez" />
            <span className="text-[18px] leading-snug">
              CDB
              <span className="block text-pos font-semibold">100% do CDI</span>
            </span>
          </Card>
        </div>

        <SectionTitle>Minha carteira</SectionTitle>
        {positions.length === 0 ? (
          <Card className="p-5">
            <p className="text-muted">Você ainda não tem investimentos. Escolha um produto acima ou toque em Investir.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {positions.map((pos) => {
              const p = getProduct(pos.productId)
              const value = positionValue(pos, state.rates, now)
              const gain = value - pos.principal
              const dc = dailyChange(p, now)
              return (
                <li key={pos.id}>
                  <Card onClick={() => nav(`/resgatar?posicao=${pos.id}`)} className="w-full p-4 flex items-center gap-3">
                    <ProductBadge product={p} size={42} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-muted text-sm truncate">
                        {p.model === 'market' ? (
                          <>
                            Hoje <span className={dc >= 0 ? 'text-pos' : 'text-red-300'}>{dc >= 0 ? '+' : ''}{formatPercent(dc * 100)}</span>
                          </>
                        ) : (
                          <>
                            Aplicado <Money cents={pos.principal} />
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <Money cents={value} className="block font-semibold tabular-nums" />
                      <Money cents={gain} signed className={cx('block text-sm tabular-nums', gain >= 0 ? 'text-pos' : 'text-red-300')} />
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}

        {allocation.length > 0 && (
          <>
            <SectionTitle>Alocação</SectionTitle>
            <Card className="p-5 flex items-center gap-4">
              <div className="w-[132px] h-[132px] shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={allocation} dataKey="value" innerRadius={40} outerRadius={64} stroke="#202020" strokeWidth={3} isAnimationActive={false}>
                      {allocation.map((a) => (
                        <Cell key={a.name} fill={a.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-2 text-[15px]">
                {allocation.map((a) => (
                  <li key={a.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: a.color }} aria-hidden />
                    <span className="flex-1">{a.name}</span>
                    <span className="text-muted tabular-nums">{formatPercent((a.value / allocTotal) * 100, 1)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}

        <SectionTitle>Patrimônio em 30 dias</SectionTitle>
        <Card className="p-4 pt-6">
          <div className="h-[180px]" role="img" aria-label="Gráfico de evolução do patrimônio nos últimos 30 dias">
            <ResponsiveContainer>
              <LineChart data={series} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#8a8a8a', fontSize: 11 }} tickLine={false} axisLine={false} interval={6} />
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Tooltip
                  contentStyle={{ background: '#2a2a2a', border: 'none', borderRadius: 12, color: '#fff' }}
                  labelStyle={{ color: '#a3a3a3' }}
                  formatter={(v: number) => [state.hideBalance ? 'R$ •••••' : formatBRL(v), 'Patrimônio']}
                />
                <Line type="monotone" dataKey="value" stroke="#E8700A" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-muted text-sm mt-2">Soma de conta, porquinho, poupança e investimentos.</p>
        </Card>

        <Card className="p-5 mt-10 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[20px]">Meu Porquinho</p>
            <Pill className="mt-8" onClick={() => nav('/porquinho')}>
              Guardar Dinheiro
            </Pill>
          </div>
          <PigArt size={112} />
        </Card>

        <SectionTitle>Explore mais produtos</SectionTitle>
        <ul className="space-y-5 mt-4">
          {[
            { title: 'Renda fixa', sub: 'CDBs, LCIs, LCAs, Tesouro', cat: 'renda_fixa' },
            { title: 'Renda variável', sub: 'Ações e fundos imobiliários', cat: 'variavel' },
            { title: 'Cripto', sub: 'Bitcoin e USDT', cat: 'cripto' },
          ].map((r) => (
            <li key={r.cat} className="flex items-center gap-4">
              <span className="w-[6px] self-stretch rounded-full bg-card2" aria-hidden />
              <div className="flex-1">
                <p className="font-semibold text-[18px]">{r.title}</p>
                <p className="text-muted">{r.sub}</p>
              </div>
              <Pill onClick={() => nav(`/produtos?cat=${r.cat}`)}>Conhecer</Pill>
            </li>
          ))}
        </ul>

        <Card onClick={() => nav('/ajuda')} className="w-full p-5 mt-10 flex items-center justify-between">
          <span className="font-semibold text-[18px]">Precisa de ajuda? Veja as dúvidas</span>
          <I.ChevronRight />
        </Card>
      </main>
    </div>
  )
}
