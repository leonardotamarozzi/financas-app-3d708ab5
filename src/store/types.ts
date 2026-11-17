export type TxType =
  | 'pix_out'
  | 'pix_in'
  | 'payment'
  | 'receive'
  | 'recharge'
  | 'transfer_out'
  | 'adjust'
  | 'savings_in'
  | 'savings_out'
  | 'piggy_in'
  | 'piggy_out'
  | 'invest'
  | 'redeem'

export interface Tx {
  id: string
  /** ISO date-time */
  date: string
  type: TxType
  title: string
  description: string
  /** Signed cents. Positive = money entering the account, negative = leaving it. */
  amount: number
  productId?: string
}

export interface Position {
  id: string
  productId: string
  /** Cents still invested (cost basis). */
  principal: number
  /** ISO date-time of the application. */
  date: string
  /** BRL per USD at purchase (for dollar products). */
  usdAtBuy?: number
}

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
}

export interface Rates {
  /** % a.a. */
  selic: number
  cdi: number
  ipca: number
  /** BRL per 1 unit */
  usd: number
  eur: number
}

export interface AppIcon {
  s192: string
  s512: string
}

export interface Profile {
  name: string
  doc: string
  appName: string
  photo?: string
  logo?: string
  icon?: AppIcon
}

export interface AppState {
  version: 1
  profile: Profile
  pinHash?: string
  hideBalance: boolean
  transactions: Tx[]
  positions: Position[]
  goals: Goal[]
  rates: Rates
  sampleData: boolean
  createdAt: string
}
