import type { Position, Rates } from '../store/types'
import { formatPercent } from './money'

export type Category = 'renda_fixa' | 'fundo' | 'poupanca' | 'variavel' | 'cripto' | 'global'
export type Liquidity = 'diaria' | 'carencia' | 'vencimento'
export type Risk = 'baixo' | 'medio' | 'alto'

export interface Product {
  id: string
  name: string
  short: string
  issuer: string
  category: Category
  liquidity: Liquidity
  /** Days until money can be redeemed (carência or maturity). 0 = daily liquidity. */
  lockDays: number
  term: string
  minApplication: number
  risk: Risk
  /** Regressive income tax applies to gains. */
  ir: boolean
  model: 'fixed' | 'market' | 'usd' | 'global'
  /** Annual rate as a decimal (fixed model only). */
  annualRate?: (r: Rates) => number
  rateLabel: (r: Rates) => string
  /** Market model: daily volatility and drift. */
  vol?: number
  drift?: number
  seed?: number
}

export function poupancaAnnual(r: Rates): number {
  // Regra atual: Selic > 8,5% a.a. => 0,5% a.m.; senão 70% da Selic (TR ignorada).
  if (r.selic > 8.5) return Math.pow(1.005, 12) - 1
  return (0.7 * r.selic) / 100
}

export const PRODUCTS: Product[] = [
  {
    id: 'cdb-liquidez',
    name: 'CDB Liquidez Diária',
    short: 'CDB diário',
    issuer: 'Banco Horizonte S.A.',
    category: 'renda_fixa',
    liquidity: 'diaria',
    lockDays: 0,
    term: 'Sem prazo mínimo',
    minApplication: 100,
    risk: 'baixo',
    ir: true,
    model: 'fixed',
    annualRate: (r) => r.cdi / 100,
    rateLabel: () => '100% do CDI',
  },
  {
    id: 'cdb-pre-12',
    name: 'CDB Prefixado 12 meses',
    short: 'CDB pré',
    issuer: 'Banco Aurora S.A.',
    category: 'renda_fixa',
    liquidity: 'vencimento',
    lockDays: 365,
    term: 'Vence em 12 meses',
    minApplication: 10000,
    risk: 'baixo',
    ir: true,
    model: 'fixed',
    annualRate: () => 0.138,
    rateLabel: () => '13,80% a.a. prefixado',
  },
  {
    id: 'lci',
    name: 'LCI 90 dias',
    short: 'LCI',
    issuer: 'Banco Horizonte S.A.',
    category: 'renda_fixa',
    liquidity: 'carencia',
    lockDays: 90,
    term: 'Carência de 90 dias',
    minApplication: 50000,
    risk: 'baixo',
    ir: false,
    model: 'fixed',
    annualRate: (r) => (0.92 * r.cdi) / 100,
    rateLabel: () => '92% do CDI, isento de IR',
  },
  {
    id: 'lca',
    name: 'LCA 90 dias',
    short: 'LCA',
    issuer: 'Banco Campo Verde S.A.',
    category: 'renda_fixa',
    liquidity: 'carencia',
    lockDays: 90,
    term: 'Carência de 90 dias',
    minApplication: 50000,
    risk: 'baixo',
    ir: false,
    model: 'fixed',
    annualRate: (r) => (0.94 * r.cdi) / 100,
    rateLabel: () => '94% do CDI, isento de IR',
  },
  {
    id: 'tesouro-selic',
    name: 'Tesouro Selic 2031',
    short: 'Tesouro Selic',
    issuer: 'Tesouro Nacional',
    category: 'renda_fixa',
    liquidity: 'diaria',
    lockDays: 0,
    term: 'Vence em 2031, resgate diário',
    minApplication: 15000,
    risk: 'baixo',
    ir: true,
    model: 'fixed',
    annualRate: (r) => (r.selic + 0.1) / 100,
    rateLabel: () => 'Selic + 0,10% a.a.',
  },
  {
    id: 'tesouro-ipca',
    name: 'Tesouro IPCA+ 2035',
    short: 'Tesouro IPCA+',
    issuer: 'Tesouro Nacional',
    category: 'renda_fixa',
    liquidity: 'diaria',
    lockDays: 0,
    term: 'Vence em 2035, resgate diário',
    minApplication: 4000,
    risk: 'medio',
    ir: true,
    model: 'fixed',
    annualRate: (r) => (1 + r.ipca / 100) * 1.072 - 1,
    rateLabel: () => 'IPCA + 7,20% a.a.',
  },
  {
    id: 'fundo-rf',
    name: 'Fundo Renda Fixa',
    short: 'Fundo RF',
    issuer: 'Gestora Pinheiro',
    category: 'fundo',
    liquidity: 'diaria',
    lockDays: 0,
    term: 'Liquidez diária',
    minApplication: 100,
    risk: 'baixo',
    ir: true,
    model: 'fixed',
    annualRate: (r) => Math.max(0, r.cdi - 0.5) / 100,
    rateLabel: (r) => `CDI − 0,50% de taxa (${formatPercent(Math.max(0, r.cdi - 0.5))} a.a.)`,
  },
  {
    id: 'poupanca',
    name: 'Poupança',
    short: 'Poupança',
    issuer: 'Sua conta',
    category: 'poupanca',
    liquidity: 'diaria',
    lockDays: 0,
    term: 'Liquidez diária',
    minApplication: 1,
    risk: 'baixo',
    ir: false,
    model: 'fixed',
    annualRate: poupancaAnnual,
    rateLabel: (r) => `${formatPercent(poupancaAnnual(r) * 100)} a.a., isenta de IR`,
  },
  {
    id: 'acoes',
    name: 'Carteira de Ações',
    short: 'Ações',
    issuer: 'Carteira simulada',
    category: 'variavel',
    liquidity: 'diaria',
    lockDays: 0,
    term: 'Liquidez diária',
    minApplication: 1000,
    risk: 'alto',
    ir: false,
    model: 'market',
    vol: 0.016,
    drift: 0.0004,
    seed: 11,
    rateLabel: () => 'Renda variável',
  },
  {
    id: 'fii',
    name: 'Fundos Imobiliários',
    short: 'FIIs',
    issuer: 'Carteira simulada',
    category: 'variavel',
    liquidity: 'diaria',
    lockDays: 0,
    term: 'Liquidez diária',
    minApplication: 1000,
    risk: 'medio',
    ir: false,
    model: 'market',
    vol: 0.008,
    drift: 0.00035,
    seed: 23,
    rateLabel: () => 'Renda variável com dividendos',
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    short: 'BTC',
    issuer: 'Cripto simulada',
    category: 'cripto',
    liquidity: 'diaria',
    lockDays: 0,
    term: 'Liquidez diária',
    minApplication: 100,
    risk: 'alto',
    ir: false,
    model: 'market',
    vol: 0.032,
    drift: 0.0008,
    seed: 37,
    rateLabel: () => 'Cripto, alta volatilidade',
  },
  {
    id: 'usdt',
    name: 'USDT (dólar digital)',
    short: 'USDT',
    issuer: 'Cripto simulada',
    category: 'cripto',
    liquidity: 'diaria',
    lockDays: 0,
    term: 'Liquidez diária',
    minApplication: 100,
    risk: 'medio',
    ir: false,
    model: 'usd',
    rateLabel: () => 'Acompanha o dólar',
  },
  {
    id: 'global',
    name: 'Global: Fundo em Dólar',
    short: 'Global',
    issuer: 'Gestora Pinheiro',
    category: 'global',
    liquidity: 'diaria',
    lockDays: 0,
    term: 'Liquidez diária',
    minApplication: 5000,
    risk: 'medio',
    ir: true,
    model: 'global',
    rateLabel: () => '4,50% a.a. em dólar + variação cambial',
  },
]

export const CATEGORY_LABEL: Record<Category, string> = {
  renda_fixa: 'Renda fixa',
  fundo: 'Fundos',
  poupanca: 'Poupança',
  variavel: 'Renda variável',
  cripto: 'Cripto',
  global: 'Global',
}

export const RISK_LABEL: Record<Risk, string> = { baixo: 'Risco baixo', medio: 'Risco médio', alto: 'Risco alto' }

export const LIQUIDITY_LABEL: Record<Liquidity, string> = {
  diaria: 'Liquidez diária',
  carencia: 'Com carência',
  vencimento: 'No vencimento',
}

export function getProduct(id: string): Product {
  const p = PRODUCTS.find((x) => x.id === id)
  if (!p) throw new Error(`Produto desconhecido: ${id}`)
  return p
}

const DAY = 86_400_000
const EPOCH = Date.UTC(2025, 0, 1)

export function daysBetween(fromIso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / DAY))
}

export function dayIndex(d: Date): number {
  return Math.max(0, Math.floor((d.getTime() - EPOCH) / DAY))
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const walks = new Map<string, { rand: () => number; values: number[] }>()

/** Deterministic simulated price index (starts at 100 on 2025-01-01). */
export function priceIndex(p: Product, day: number): number {
  let w = walks.get(p.id)
  if (!w) {
    w = { rand: mulberry32(p.seed ?? 1), values: [100] }
    walks.set(p.id, w)
  }
  while (w.values.length <= day) {
    // Box-Muller normal sample
    const u = Math.max(w.rand(), 1e-9)
    const v = w.rand()
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    const prev = w.values[w.values.length - 1]
    w.values.push(prev * Math.exp((p.drift ?? 0) + (p.vol ?? 0) * z))
  }
  return w.values[day]
}

/** Daily change of a market product, as a decimal. */
export function dailyChange(p: Product, now: Date): number {
  if (p.model !== 'market') return 0
  const d = dayIndex(now)
  if (d === 0) return 0
  return priceIndex(p, d) / priceIndex(p, d - 1) - 1
}

/** Current gross value of a position, in cents. */
export function positionValue(pos: Position, rates: Rates, now: Date): number {
  const p = getProduct(pos.productId)
  const days = daysBetween(pos.date, now)
  let factor = 1
  switch (p.model) {
    case 'fixed':
      factor = Math.pow(1 + (p.annualRate ? p.annualRate(rates) : 0), days / 365)
      break
    case 'market':
      factor = priceIndex(p, dayIndex(now)) / priceIndex(p, dayIndex(new Date(pos.date)))
      break
    case 'usd':
      factor = rates.usd / (pos.usdAtBuy || rates.usd)
      break
    case 'global':
      factor = (rates.usd / (pos.usdAtBuy || rates.usd)) * Math.pow(1.045, days / 365)
      break
  }
  return Math.max(0, Math.round(pos.principal * factor))
}

/** Regressive income tax rate for fixed income, by holding days. */
export function irRate(days: number): number {
  if (days <= 180) return 0.225
  if (days <= 360) return 0.2
  if (days <= 720) return 0.175
  return 0.15
}

export interface RedeemCheck {
  ok: boolean
  reason?: string
  availableOn?: Date
}

export function canRedeem(pos: Position, now: Date): RedeemCheck {
  const p = getProduct(pos.productId)
  if (p.lockDays === 0) return { ok: true }
  const available = new Date(new Date(pos.date).getTime() + p.lockDays * DAY)
  if (now.getTime() >= available.getTime()) return { ok: true }
  const label = p.liquidity === 'vencimento' ? 'vencimento' : 'fim da carência'
  return {
    ok: false,
    availableOn: available,
    reason: `${p.name} só pode ser resgatado no ${label}, em ${available.toLocaleDateString('pt-BR')}.`,
  }
}

export interface RedeemQuote {
  value: number
  gross: number
  gain: number
  tax: number
  net: number
  remainingPrincipal: number
  taxRate: number
}

/** Quote for redeeming `gross` cents from a position (proportional cost basis). */
export function quoteRedeem(pos: Position, gross: number, rates: Rates, now: Date): RedeemQuote {
  const p = getProduct(pos.productId)
  const value = positionValue(pos, rates, now)
  const g = Math.min(gross, value)
  const fraction = value > 0 ? g / value : 1
  const costPart = Math.round(pos.principal * fraction)
  const gain = Math.max(0, g - costPart)
  const days = daysBetween(pos.date, now)
  const taxRate = p.ir ? irRate(days) : 0
  const tax = Math.round(gain * taxRate)
  return {
    value,
    gross: g,
    gain,
    tax,
    net: g - tax,
    remainingPrincipal: g >= value ? 0 : pos.principal - costPart,
    taxRate,
  }
}
