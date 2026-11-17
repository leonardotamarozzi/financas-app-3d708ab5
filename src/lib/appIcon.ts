import type { AppIcon } from '../store/types'
import { loadImage, squareFromImage } from './image'

/** Default icon: a rising chart inside a coin, in the theme colors. */
export const DEFAULT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="112" fill="#121212"/>
<circle cx="256" cy="256" r="168" fill="#E8700A"/>
<circle cx="256" cy="256" r="136" fill="none" stroke="#F0A060" stroke-width="12" opacity=".55"/>
<path d="M164 316 L226 252 L270 290 L350 200" fill="none" stroke="#121212" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M306 196 L354 196 L354 244" fill="none" stroke="#121212" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

export const DEFAULT_ICON_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(DEFAULT_ICON_SVG)

let defaultPngs: AppIcon | null = null
async function defaultIconPngs(): Promise<AppIcon> {
  if (defaultPngs) return defaultPngs
  const img = await loadImage(DEFAULT_ICON_URL)
  defaultPngs = { s192: squareFromImage(img, 512, 512, 192), s512: squareFromImage(img, 512, 512, 512) }
  return defaultPngs
}

let manifestUrl: string | null = null

function setLink(id: string, rel: string, href: string, type?: string) {
  // Re-inserting the element makes browsers pick up the change reliably.
  document.getElementById(id)?.remove()
  const link = document.createElement('link')
  link.id = id
  link.rel = rel
  link.href = href
  if (type) link.type = type
  document.head.appendChild(link)
}

/** Applies favicon, apple-touch-icon, manifest and document title. */
export async function applyAppIdentity(icon: AppIcon | undefined, appName: string) {
  const name = appName.trim() || 'Minhas Finanças'
  document.title = name
  const pngs = icon ?? (await defaultIconPngs().catch(() => null))
  setLink('app-favicon', 'icon', icon ? icon.s192 : DEFAULT_ICON_URL, icon ? 'image/png' : 'image/svg+xml')
  if (pngs) setLink('app-apple-icon', 'apple-touch-icon', pngs.s192)

  const start = location.origin + location.pathname
  const manifest = {
    name,
    short_name: name.slice(0, 24),
    start_url: start,
    scope: start,
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#121212',
    icons: pngs
      ? [
          { src: pngs.s192, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: pngs.s512, sizes: '512x512', type: 'image/png', purpose: 'any' },
        ]
      : [],
  }
  if (manifestUrl) URL.revokeObjectURL(manifestUrl)
  manifestUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }))
  setLink('app-manifest', 'manifest', manifestUrl)
}
