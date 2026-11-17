import { describe, expect, it } from 'vitest'
import {
  accountBalance,
  cancelScheduledPix,
  migrateState,
  nextPixDelay,
  processDuePix,
  schedulePix,
  addMovement,
  createInitialState,
  invest,
  monthSummary,
  parseBackup,
  piggyBalance,
  piggyDeposit,
  redeem,
  savingsBalance,
  savingsDeposit,
  savingsWithdraw,
  setAccountBalance,
  totalInvested,
  UserError,
} from './logic'
import type { AppState } from './types'
import { canRedeem, irRate, poupancaAnnual, positionValue, quoteRedeem } from '../lib/invest'
import { digitsToCents, formatBRL, formatSigned, parseBRL } from '../lib/money'
import { fitWithin, squareCrop } from '../lib/image'

const T0 = new Date('2026-03-01T12:00:00Z')
const days = (n: number) => new Date(T0.getTime() + n * 86_400_000)

function empty(): AppState {
  return { ...createInitialState(T0), transactions: [], sampleData: false }
}

describe('money', () => {
  it('formats cents as BRL', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56')
    expect(formatSigned(-800)).toBe('-R$ 8,00')
    expect(formatSigned(1500)).toBe('R$ 15,00')
  })
  it('parses user input', () => {
    expect(parseBRL('1.234,56')).toBe(123456)
    expect(parseBRL('R$ 10')).toBe(1000)
    expect(parseBRL('10.5')).toBe(1050)
    expect(parseBRL('1.000')).toBe(100000)
    expect(parseBRL('abc')).toBeNull()
    expect(parseBRL('-5')).toBeNull()
    expect(parseBRL('')).toBeNull()
  })
  it('turns typed digits into cents', () => {
    expect(digitsToCents('12345')).toBe(12345)
    expect(digitsToCents('R$ 1,99')).toBe(199)
    expect(digitsToCents('')).toBe(0)
  })
})

describe('account movements', () => {
  it('sample data balance equals the sum of transactions', () => {
    const s = createInitialState(T0)
    expect(accountBalance(s)).toBe(250000 - 18000 - 12050)
  })
  it('blocks negative balance', () => {
    const s = setAccountBalance(empty(), 1000, T0)
    expect(() => addMovement(s, 'pix_out', 'Fulano', 1001, T0)).toThrow(UserError)
    const s2 = addMovement(s, 'pix_out', 'Fulano', 1000, T0)
    expect(accountBalance(s2)).toBe(0)
  })
  it('rejects zero, NaN and empty description', () => {
    const s = setAccountBalance(empty(), 1000, T0)
    expect(() => addMovement(s, 'pix_in', 'X', 0, T0)).toThrow(UserError)
    expect(() => addMovement(s, 'pix_in', 'X', NaN, T0)).toThrow(UserError)
    expect(() => addMovement(s, 'pix_in', '  ', 100, T0)).toThrow(UserError)
  })
  it('adjusting the balance records an "adjust" transaction', () => {
    let s = setAccountBalance(empty(), 50000, T0)
    s = setAccountBalance(s, 20000, T0)
    expect(accountBalance(s)).toBe(20000)
    expect(s.transactions.map((t) => t.type)).toEqual(['adjust', 'adjust'])
    expect(() => setAccountBalance(s, -1, T0)).toThrow(UserError)
    expect(setAccountBalance(s, 20000, T0)).toBe(s)
  })
  it('piggy bank moves money out of the account', () => {
    let s = setAccountBalance(empty(), 10000, T0)
    s = piggyDeposit(s, 4000, T0)
    expect(accountBalance(s)).toBe(6000)
    expect(piggyBalance(s)).toBe(4000)
  })
})

describe('yields', () => {
  it('poupança pays 0.5% a month when Selic > 8.5%', () => {
    expect(poupancaAnnual({ selic: 15, cdi: 14.9, ipca: 4, usd: 5, eur: 6 })).toBeCloseTo(0.0617, 3)
    expect(poupancaAnnual({ selic: 8, cdi: 7.9, ipca: 4, usd: 5, eur: 6 })).toBeCloseTo(0.056, 4)
  })
  it('CDB 100% CDI compounds over calendar days', () => {
    let s = setAccountBalance(empty(), 1_000_000, T0)
    s = invest(s, 'cdb-liquidez', 1_000_000, 'conta', T0)
    const v = positionValue(s.positions[0], s.rates, days(365))
    expect(v).toBe(Math.round(1_000_000 * (1 + s.rates.cdi / 100)))
  })
  it('regressive IR table', () => {
    expect(irRate(10)).toBe(0.225)
    expect(irRate(200)).toBe(0.2)
    expect(irRate(500)).toBe(0.175)
    expect(irRate(800)).toBe(0.15)
  })
})

describe('invest and redeem', () => {
  it('rejects amounts below the minimum and above the balance', () => {
    const s = setAccountBalance(empty(), 10000, T0)
    expect(() => invest(s, 'lci', 10000, 'conta', T0)).toThrow(/mínima/)
    expect(() => invest(s, 'cdb-liquidez', 10001, 'conta', T0)).toThrow(/insuficiente/)
  })
  it('redeems with income tax on the gain only', () => {
    let s = setAccountBalance(empty(), 1_000_000, T0)
    s = invest(s, 'cdb-liquidez', 1_000_000, 'conta', T0)
    expect(accountBalance(s)).toBe(0)
    const later = days(100)
    const value = positionValue(s.positions[0], s.rates, later)
    const q = quoteRedeem(s.positions[0], value, s.rates, later)
    expect(q.tax).toBe(Math.round((value - 1_000_000) * 0.225))
    s = redeem(s, s.positions[0].id, value, later)
    expect(s.positions).toHaveLength(0)
    expect(accountBalance(s)).toBe(value - q.tax)
  })
  it('LCI is tax free but locked during the grace period', () => {
    let s = setAccountBalance(empty(), 100_000, T0)
    s = invest(s, 'lci', 100_000, 'conta', T0)
    const pos = s.positions[0]
    expect(canRedeem(pos, days(30)).ok).toBe(false)
    expect(() => redeem(s, pos.id, 1000, days(30))).toThrow(/carência/)
    expect(canRedeem(pos, days(91)).ok).toBe(true)
    expect(quoteRedeem(pos, 50_000, s.rates, days(91)).tax).toBe(0)
  })
  it('partial redemption keeps the remaining cost basis', () => {
    let s = setAccountBalance(empty(), 200_000, T0)
    s = invest(s, 'tesouro-selic', 200_000, 'conta', T0)
    s = redeem(s, s.positions[0].id, 50_000, days(60))
    expect(s.positions[0].principal).toBeLessThan(200_000)
    expect(s.positions[0].principal).toBeGreaterThan(150_000)
  })
  it('bitcoin value follows the simulated market', () => {
    let s = setAccountBalance(empty(), 100_000, T0)
    s = invest(s, 'btc', 100_000, 'conta', T0)
    const v = positionValue(s.positions[0], s.rates, days(30))
    expect(v).toBeGreaterThan(0)
    expect(v).not.toBe(100_000)
    // deterministic
    expect(positionValue(s.positions[0], s.rates, days(30))).toBe(v)
  })
  it('invests from savings in two recorded steps', () => {
    let s = setAccountBalance(empty(), 100_000, T0)
    s = savingsDeposit(s, 100_000, T0)
    expect(accountBalance(s)).toBe(0)
    s = invest(s, 'cdb-liquidez', 40_000, 'poupanca', T0)
    expect(savingsBalance(s, T0)).toBe(60_000)
    expect(totalInvested(s, T0)).toBe(40_000)
    expect(accountBalance(s)).toBe(0)
  })
  it('savings withdraws oldest first and never goes below zero', () => {
    let s = setAccountBalance(empty(), 30_000, T0)
    s = savingsDeposit(s, 10_000, T0)
    s = savingsDeposit(s, 20_000, days(1))
    s = savingsWithdraw(s, 15_000, days(1))
    expect(savingsBalance(s, days(1))).toBeGreaterThanOrEqual(15_000)
    expect(() => savingsWithdraw(s, 999_999, days(1))).toThrow(UserError)
  })
})

describe('invariants and reports', () => {
  it('account balance always equals the sum of transactions', () => {
    let s = setAccountBalance(empty(), 500_000, T0)
    s = addMovement(s, 'pix_in', 'A', 10_000, T0)
    s = savingsDeposit(s, 50_000, T0)
    s = invest(s, 'fundo-rf', 100_000, 'conta', T0)
    s = piggyDeposit(s, 5_000, T0)
    s = redeem(s, s.positions.find((p) => p.productId === 'fundo-rf')!.id, 30_000, days(10))
    expect(accountBalance(s)).toBe(s.transactions.reduce((a, t) => a + t.amount, 0))
    expect(accountBalance(s)).toBeGreaterThanOrEqual(0)
  })
  it('month summary splits income and expenses', () => {
    let s = empty()
    s = addMovement(s, 'pix_in', 'Salário', 300_000, T0)
    s = addMovement(s, 'payment', 'Luz', 20_000, T0)
    const m = monthSummary(s, T0)
    expect(m.income).toBe(300_000)
    expect(m.expenses).toBe(20_000)
  })
  it('backup round trip and validation', () => {
    const s = createInitialState(T0)
    expect(parseBackup(JSON.stringify(s)).transactions).toHaveLength(3)
    expect(() => parseBackup('{oops')).toThrow(UserError)
    expect(() => parseBackup('{"version":2}')).toThrow(UserError)
  })
})

describe('image helpers', () => {
  it('square crop is centered', () => {
    expect(squareCrop(400, 200)).toEqual({ sx: 100, sy: 0, size: 200 })
    expect(squareCrop(300, 500)).toEqual({ sx: 0, sy: 100, size: 300 })
  })
  it('fitWithin never upscales', () => {
    expect(fitWithin(1000, 500, 256)).toEqual({ width: 256, height: 128 })
    expect(fitWithin(100, 50, 256)).toEqual({ width: 100, height: 50 })
  })
})

describe('scheduled Pix', () => {
  const base = () => ({ ...createInitialState(T0), transactions: [], sampleData: false }) as AppState
  const inMin = (m: number) => new Date(T0.getTime() + m * 60_000).toISOString()

  it('validates name, amount and date', () => {
    const s = base()
    const ok = { payerName: 'Ana Teste', amount: 2500, dueAt: inMin(1) }
    expect(() => schedulePix(s, { ...ok, payerName: 'A' }, T0)).toThrow(UserError)
    expect(() => schedulePix(s, { ...ok, payerName: 'x'.repeat(61) }, T0)).toThrow(UserError)
    expect(() => schedulePix(s, { ...ok, amount: 0 }, T0)).toThrow(UserError)
    expect(() => schedulePix(s, { ...ok, amount: 100_000_001 }, T0)).toThrow(UserError)
    expect(() => schedulePix(s, { ...ok, dueAt: inMin(-1) }, T0)).toThrow(UserError)
    expect(() => schedulePix(s, { ...ok, dueAt: inMin(60 * 24 * 400) }, T0)).toThrow(UserError)
    expect(() => schedulePix(s, { ...ok, dueAt: 'not a date' }, T0)).toThrow(UserError)
    const next = schedulePix(s, ok, T0)
    expect(next.scheduledPix).toHaveLength(1)
    expect(next.scheduledPix[0].status).toBe('agendado')
    expect(accountBalance(next)).toBe(0)
  })

  it('does not credit a future Pix and credits a due one with the right amount', () => {
    let s = schedulePix(base(), { payerName: 'Ana Teste', amount: 2500, dueAt: inMin(1) }, T0)
    const early = processDuePix(s, T0)
    expect(early.received).toHaveLength(0)
    expect(early.state).toBe(s)
    expect(nextPixDelay(s, T0)).toBe(60_000)
    const r = processDuePix(s, new Date(inMin(2)))
    s = r.state
    expect(r.received).toHaveLength(1)
    expect(accountBalance(s)).toBe(2500)
    const tx = s.transactions[0]
    expect(tx).toMatchObject({ type: 'pix_in', title: 'Pix recebido', description: 'De Ana Teste', amount: 2500, date: inMin(1) })
    expect(s.scheduledPix[0]).toMatchObject({ status: 'recebido', receivedTxId: tx.id })
    expect(nextPixDelay(s, T0)).toBeNull()
  })

  it('is idempotent and keeps the balance invariant', () => {
    let s = base()
    s = schedulePix(s, { payerName: 'Ana Teste', amount: 2500, dueAt: inMin(1) }, T0)
    s = schedulePix(s, { payerName: 'Bruno Teste', amount: 1000, dueAt: inMin(5) }, T0)
    const later = new Date(inMin(10))
    const once = processDuePix(s, later).state
    const twice = processDuePix(once, later)
    expect(twice.received).toHaveLength(0)
    expect(accountBalance(twice.state)).toBe(3500)
    expect(twice.state.transactions).toHaveLength(2)
    expect(accountBalance(twice.state)).toBe(twice.state.transactions.reduce((a, t) => a + t.amount, 0))
  })

  it('cancels only scheduled items', () => {
    let s = schedulePix(base(), { payerName: 'Ana Teste', amount: 2500, dueAt: inMin(1) }, T0)
    const id = s.scheduledPix[0].id
    s = cancelScheduledPix(s, id)
    expect(s.scheduledPix[0].status).toBe('cancelado')
    expect(processDuePix(s, new Date(inMin(5))).received).toHaveLength(0)
    expect(() => cancelScheduledPix(s, id)).toThrow(UserError)
    expect(() => cancelScheduledPix(s, 'nope')).toThrow(UserError)
  })

  it('migration fills scheduledPix and accountNumber', () => {
    const old = createInitialState(T0) as Partial<AppState>
    delete (old as { scheduledPix?: unknown }).scheduledPix
    const profile = { ...old.profile! } as Partial<AppState['profile']>
    delete profile.accountNumber
    const m = migrateState({ ...old, profile: profile as AppState['profile'] })
    expect(m.scheduledPix).toEqual([])
    expect(m.profile.accountNumber).toMatch(/^\d{5}-\d$/)
    expect(m.profile.name).toBe('Seu nome')
    const kept = migrateState({ ...old, profile: { ...old.profile!, accountNumber: '12345-6' } })
    expect(kept.profile.accountNumber).toBe('12345-6')
  })
})
