import type { Profile } from '../store/types'
import { formatBRL } from './money'
import { DEFAULT_ICON_URL } from './appIcon'

export interface Notice {
  id: number
  title: string
  body: string
  icon: string
}

type IconSource = Pick<Profile, 'icon' | 'logo'>

/** App icon first, then the login logo, then the built-in icon. */
export function noticeIcon(p: IconSource): string {
  return p.icon?.s192 ?? p.logo ?? DEFAULT_ICON_URL
}

export function pixNotice(
  p: IconSource & Pick<Profile, 'appName' | 'accountNumber'>,
  pix: { payerName: string; amount: number },
): Omit<Notice, 'id'> {
  return {
    title: `${p.appName} | Pix Recebido`,
    body: `${pix.payerName} te enviou um Pix de ${formatBRL(pix.amount).replace(' ', ' ')} creditado na sua conta final ***${p.accountNumber}.`,
    icon: noticeIcon(p),
  }
}

/** Mirrors the banner as a system notification when the user granted permission. Works only while the app is open. */
export function systemNotify(n: Omit<Notice, 'id'>) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    new Notification(n.title, { body: n.body, icon: n.icon })
  } catch {
    /* Some mobile browsers only allow notifications from a service worker; the in-app banner still shows. */
  }
}
