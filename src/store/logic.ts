import type { AppState, Goal, Position, Rates, Tx, TxType } from './types'
import { canRedeem, getProduct, positionValue, quoteRedeem } from '../lib/invest'
import { formatBRL } from '../lib/money'

export class UserError extends Error {}

export const DEFAULT_RATES: Rates = { selic: 15, cdi: 14.9, ipca: 4.6, usd: 5.35, eur: 6.2 }

let counter = 0
export function uid(prefix = 'id'): string {
  counter = (counter + 1) % 1e6
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

const daysAgo = (now: Date, d: number, h = 12) => {
  const x = new Date(now)
  x.setDate(x.getDate() - d)
  x.setHours(h, 0, 0, 0)
  return x.toISOString()
}

export function sampleTransactions(now: Date): Tx[] {
  return [
    { id: uid('tx'), date: daysAgo(now, 3, 9), type: 'pix_in', title: 'Pix recebido', description: 'Salário (exemplo)', amount: 250000 },
    { id: uid('tx'), date: daysAgo(now, 1, 18), type: 'pix_out', title: 'Pix enviado', description: 'Mercado do bairro (exemplo)', amount: -18000 },
    { id: uid('tx'), date: daysAgo(now, 0, 10), type: 'payment', title: 'Pagamento', description: 'Conta de luz (exemplo)', amount: -12050 },
  ]
}

export function defaultGoals(): Goal[] {
  return [
    { id: uid('goal'), name: 'Comprar uma casa', target: 30000000, saved: 0 },
    { id: uid('goal'), name: 'Comprar um carro novo', target: 8000000, saved: 0 },
    { id: uid('goal'), name: 'Comprar um celular', target: 500000, saved: 0 },
  ]
}

export function createInitialState(now = new Date()): AppState {
  return {
    version: 1,
    profile: { name: 'Seu nome', doc: '***.000.000-**', appName: 'Minhas Finanças' },
    hideBalance: false,
    transactions: sampleTransactions(now),
    positions: [],
    goals: defaultGoals(),
    rates: { ...DEFAULT_RATES },
    sampleData: true,
    createdAt: now.toISOString(),
  }
}

// ---------- Derived values ----------

export const accountBalance = (s: AppState) => s.transactions.reduce((sum, t) => sum + t.amount, 0)

export const piggyBalance = (s: AppState) =>
  -s.transactions.filter((t) => t.type === 'piggy_in' || t.type === 'piggy_out').reduce((sum, t) => sum + t.amount, 0)

export const savingsPositions = (s: AppState) => s.positions.filter((p) => p.productId === 'poupanca')
export const investPositions = (s: AppState) => s.positions.filter((p) => p.productId !== 'poupanca')

export const sumValue = (list: Position[], rates: Rates, now: Date) =>
  list.reduce((sum, p) => sum + positionValue(p, rates, now), 0)

export const savingsBalance = (s: AppState, now = new Date()) => sumValue(savingsPositions(s), s.rates, now)
export const totalInvested = (s: AppState, now = new Date()) => sumValue(investPositions(s), s.rates, now)

export const savingsYield = (s: AppState, now = new Date()) =>
  savingsBalance(s, now) - savingsPositions(s).reduce((sum, p) => sum + p.principal, 0)

export const netWorth = (s: AppState, now = new Date()) =>
  accountBalance(s) + piggyBalance(s) + savingsBalance(s, now) + totalInvested(s, now)

// ---------- Mutations (pure: return a new state or throw UserError) ----------

function assertAmount(amount: number) {
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    throw new UserError('Informe um valor maior que zero.')
  }
}

function assertFunds(s: AppState, amount: number) {
  const bal = accountBalance(s)
  if (amount > bal) throw new UserError(`Saldo insuficiente. Disponível na conta: ${formatBRL(bal)}.`)
}

function pushTx(s: AppState, tx: Omit<Tx, 'id'>): AppState {
  return { ...s, transactions: [...s.transactions, { ...tx, id: uid('tx') }] }
}

export type MovementKind = 'pix_out' | 'pix_in' | 'payment' | 'receive' | 'recharge' | 'transfer_out'

export const MOVEMENT: Record<MovementKind, { title: string; sign: 1 | -1 }> = {
  pix_out: { title: 'Pix enviado', sign: -1 },
  pix_in: { title: 'Pix recebido', sign: 1 },
  payment: { title: 'Pagamento', sign: -1 },
  receive: { title: 'Recebimento', sign: 1 },
  recharge: { title: 'Recarga de celular', sign: -1 },
  transfer_out: { title: 'Transferência enviada', sign: -1 },
}

export function addMovement(s: AppState, kind: MovementKind, description: string, amount: number, now = new Date()): AppState {
  assertAmount(amount)
  const desc = description.trim()
  if (!desc) throw new UserError('Preencha a descrição.')
  const m = MOVEMENT[kind]
  if (m.sign < 0) assertFunds(s, amount)
  return pushTx(s, { date: now.toISOString(), type: kind as TxType, title: m.title, description: desc, amount: m.sign * amount })
}

/** Sets the account balance to `target` by recording an "Ajuste" transaction. */
export function setAccountBalance(s: AppState, target: number, now = new Date()): AppState {
  if (!Number.isFinite(target) || !Number.isInteger(target) || target < 0) {
    throw new UserError('O saldo não pode ser negativo.')
  }
  const diff = target - accountBalance(s)
  if (diff === 0) return s
  return pushTx(s, {
    date: now.toISOString(),
    type: 'adjust',
    title: 'Ajuste de saldo',
    description: diff > 0 ? 'Saldo ajustado para cima' : 'Saldo ajustado para baixo',
    amount: diff,
  })
}

export function piggyDeposit(s: AppState, amount: number, now = new Date()): AppState {
  assertAmount(amount)
  assertFunds(s, amount)
  return pushTx(s, { date: now.toISOString(), type: 'piggy_in', title: 'Meu Porquinho', description: 'Dinheiro guardado', amount: -amount })
}

export function piggyWithdraw(s: AppState, amount: number, now = new Date()): AppState {
  assertAmount(amount)
  const bal = piggyBalance(s)
  if (amount > bal) throw new UserError(`O porquinho tem ${formatBRL(bal)}.`)
  return pushTx(s, { date: now.toISOString(), type: 'piggy_out', title: 'Meu Porquinho', description: 'Dinheiro retirado', amount })
}

function createPosition(s: AppState, productId: string, amount: number, now: Date): AppState {
  const pos: Position = { id: uid('pos'), productId, principal: amount, date: now.toISOString() }
  const p = getProduct(productId)
  if (p.model === 'usd' || p.model === 'global') pos.usdAtBuy = s.rates.usd
  return { ...s, positions: [...s.positions, pos] }
}

export function savingsDeposit(s: AppState, amount: number, now = new Date()): AppState {
  assertAmount(amount)
  assertFunds(s, amount)
  const next = createPosition(s, 'poupanca', amount, now)
  return pushTx(next, { date: now.toISOString(), type: 'savings_in', title: 'Poupança', description: 'Guardado na poupança', amount: -amount, productId: 'poupanca' })
}

/** Withdraws from savings, oldest deposits first. No income tax. */
export function savingsWithdraw(s: AppState, amount: number, now = new Date(), description = 'Resgate para a conta'): AppState {
  assertAmount(amount)
  const available = savingsBalance(s, now)
  if (amount > available) throw new UserError(`A poupança tem ${formatBRL(available)}.`)
  let remaining = amount
  const positions: Position[] = []
  const ordered = [...s.positions].sort((a, b) => a.date.localeCompare(b.date))
  for (const pos of ordered) {
    if (pos.productId !== 'poupanca' || remaining === 0) {
      positions.push(pos)
      continue
    }
    const value = positionValue(pos, s.rates, now)
    if (remaining >= value) {
      remaining -= value
      continue // fully withdrawn
    }
    const fraction = remaining / value
    positions.push({ ...pos, principal: pos.principal - Math.round(pos.principal * fraction) })
    remaining = 0
  }
  return pushTx({ ...s, positions }, { date: now.toISOString(), type: 'savings_out', title: 'Poupança', description, amount, productId: 'poupanca' })
}

export type Origin = 'conta' | 'poupanca'

export function invest(s: AppState, productId: string, amount: number, origin: Origin, now = new Date()): AppState {
  assertAmount(amount)
  const p = getProduct(productId)
  if (amount < p.minApplication) throw new UserError(`A aplicação mínima de ${p.name} é ${formatBRL(p.minApplication)}.`)
  if (productId === 'poupanca' && origin === 'poupanca') throw new UserError('Escolha a conta como origem para aplicar na poupança.')
  let next = s
  if (origin === 'poupanca') {
    const sb = savingsBalance(s, now)
    if (amount > sb) throw new UserError(`Saldo insuficiente na poupança. Disponível: ${formatBRL(sb)}.`)
    next = savingsWithdraw(next, amount, now, `Resgate para aplicar em ${p.name}`)
  }
  if (productId === 'poupanca') return savingsDeposit(next, amount, now)
  assertFunds(next, amount)
  next = createPosition(next, productId, amount, now)
  return pushTx(next, { date: now.toISOString(), type: 'invest', title: 'Aplicação', description: p.name, amount: -amount, productId })
}

export function redeem(s: AppState, positionId: string, gross: number, now = new Date()): AppState {
  assertAmount(gross)
  const pos = s.positions.find((p) => p.id === positionId)
  if (!pos) throw new UserError('Investimento não encontrado.')
  const check = canRedeem(pos, now)
  if (!check.ok) throw new UserError(check.reason!)
  const q = quoteRedeem(pos, gross, s.rates, now)
  if (gross > q.value) throw new UserError(`O valor máximo para resgate é ${formatBRL(q.value)}.`)
  const p = getProduct(pos.productId)
  const positions =
    q.remainingPrincipal <= 0
      ? s.positions.filter((x) => x.id !== pos.id)
      : s.positions.map((x) => (x.id === pos.id ? { ...x, principal: q.remainingPrincipal } : x))
  const desc = q.tax > 0 ? `${p.name} (IR ${formatBRL(q.tax)})` : p.name
  return pushTx({ ...s, positions }, { date: now.toISOString(), type: 'redeem', title: 'Resgate', description: desc, amount: q.net, productId: p.id })
}

// ---------- Reports ----------

const EXTERNAL_IN: TxType[] = ['pix_in', 'receive']
const EXTERNAL_OUT: TxType[] = ['pix_out', 'payment', 'recharge', 'transfer_out']

export function monthSummary(s: AppState, now = new Date()) {
  const m = now.getMonth()
  const y = now.getFullYear()
  const inMonth = s.transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === m && d.getFullYear() === y
  })
  const income = inMonth
    .filter((t) => EXTERNAL_IN.includes(t.type) || (t.type === 'adjust' && t.amount > 0))
    .reduce((a, t) => a + t.amount, 0)
  const expenses = -inMonth
    .filter((t) => EXTERNAL_OUT.includes(t.type) || (t.type === 'adjust' && t.amount < 0))
    .reduce((a, t) => a + t.amount, 0)
  const gains = s.positions.reduce((a, p) => a + positionValue(p, s.rates, now) - p.principal, 0)
  return { income, expenses, gains }
}

/** Net worth for each of the last `days` days (positions valued with today's principal). */
export function netWorthSeries(s: AppState, now = new Date(), days = 30) {
  const out: { label: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const end = new Date(now)
    end.setDate(end.getDate() - i)
    end.setHours(23, 59, 59, 999)
    const at = i === 0 ? now : end
    const cash = s.transactions.filter((t) => new Date(t.date) <= at).reduce((a, t) => a + t.amount, 0)
    const piggy = -s.transactions
      .filter((t) => (t.type === 'piggy_in' || t.type === 'piggy_out') && new Date(t.date) <= at)
      .reduce((a, t) => a + t.amount, 0)
    const inv = s.positions.filter((p) => new Date(p.date) <= at).reduce((a, p) => a + positionValue(p, s.rates, at), 0)
    out.push({ label: `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}`, value: cash + piggy + inv })
  }
  return out
}

export function toCSV(txs: Tx[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const rows = txs.map((t) =>
    [new Date(t.date).toLocaleString('pt-BR'), t.title, t.description, (t.amount / 100).toFixed(2).replace('.', ',')].map(esc).join(';'),
  )
  return ['Data;Tipo;Descrição;Valor (R$)', ...rows].join('\n')
}

/** Validates an imported backup. Throws UserError when invalid. */
export function parseBackup(text: string): AppState {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new UserError('O arquivo não é um backup válido (JSON inválido).')
  }
  const d = data as Partial<AppState>
  if (!d || d.version !== 1 || !Array.isArray(d.transactions) || !Array.isArray(d.positions) || !d.profile || !d.rates) {
    throw new UserError('O arquivo não é um backup deste app.')
  }
  return { ...createInitialState(), ...d, goals: Array.isArray(d.goals) ? d.goals : [] } as AppState
}
