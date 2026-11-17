const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const num = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Formats integer cents as "R$ 1.234,56" (with a regular space). */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/ /g, ' ')
}

/** Formats with explicit sign: "-R$ 8,00" / "R$ 15,00". */
export function formatSigned(cents: number): string {
  return cents < 0 ? '-' + formatBRL(-cents) : formatBRL(cents)
}

export function formatNumber(value: number, digits = 2): string {
  if (digits === 2) return num.format(value)
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
}

export function formatPercent(value: number, digits = 2): string {
  return formatNumber(value, digits) + '%'
}

/**
 * Parses user text into integer cents. Accepts "1.234,56", "1234,56", "1234.56", "R$ 10".
 * Returns null for empty, invalid or negative input.
 */
export function parseBRL(input: string): number | null {
  let s = input.replace(/R\$/gi, '').replace(/\s/g, '').trim()
  if (!s) return null
  if (s.startsWith('-')) return null
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (!/^\d+\.\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, '')
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100)
}

/** Turns typed digits into cents ("12345" -> 12345 = R$ 123,45). Used by the amount input. */
export function digitsToCents(raw: string): number {
  const digits = raw.replace(/\D/g, '').slice(0, 13)
  return digits ? parseInt(digits, 10) : 0
}

export function formatDayMonth(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}
