export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export class ImageError extends Error {}

/** Centered square crop of a w×h image. */
export function squareCrop(w: number, h: number): { sx: number; sy: number; size: number } {
  const size = Math.min(w, h)
  return { sx: Math.floor((w - size) / 2), sy: Math.floor((h - size) / 2), size }
}

/** Scales w×h down so the longest side is at most `max` (never upscales). */
export function fitWithin(w: number, h: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(w, h))
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) }
}

export function validateFile(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new ImageError('Use uma imagem PNG, JPG, WebP ou SVG.')
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageError('A imagem passa de 5 MB. Escolha um arquivo menor.')
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new ImageError('Não foi possível ler o arquivo.'))
    r.readAsDataURL(file)
  })
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new ImageError('Não foi possível abrir essa imagem.'))
    img.src = src
  })
}

function dims(img: HTMLImageElement, isSvg: boolean) {
  const w = img.naturalWidth || (isSvg ? 512 : 0)
  const h = img.naturalHeight || (isSvg ? 512 : 0)
  return { w, h }
}

/** Resizes so the longest side is ≤ max. PNG keeps transparency; JPEG for photos. */
export async function fileToResized(file: File, max: number, type: 'image/png' | 'image/jpeg' = 'image/png'): Promise<string> {
  validateFile(file)
  const img = await loadImage(await readAsDataURL(file))
  const { w, h } = dims(img, file.type === 'image/svg+xml')
  const { width, height } = fitWithin(w, h, max)
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)
  return c.toDataURL(type, 0.86)
}

export function squareFromImage(img: HTMLImageElement, w: number, h: number, size: number): string {
  const crop = squareCrop(w, h)
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, crop.sx, crop.sy, crop.size, crop.size, 0, 0, size, size)
  return c.toDataURL('image/png')
}

/** Square-cropped profile photo (JPEG, 256px). */
export async function fileToAvatar(file: File): Promise<string> {
  validateFile(file)
  const img = await loadImage(await readAsDataURL(file))
  const { w, h } = dims(img, file.type === 'image/svg+xml')
  const crop = squareCrop(w, h)
  const size = Math.min(256, crop.size)
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, crop.sx, crop.sy, crop.size, crop.size, 0, 0, size, size)
  return c.toDataURL('image/jpeg', 0.86)
}

/** App icon: square crop, 192 and 512 PNG. Rejects images smaller than 192px. */
export async function fileToAppIcon(file: File): Promise<{ s192: string; s512: string }> {
  validateFile(file)
  const isSvg = file.type === 'image/svg+xml'
  const img = await loadImage(await readAsDataURL(file))
  const { w, h } = dims(img, isSvg)
  if (!isSvg && Math.min(w, h) < 192) {
    throw new ImageError(`A imagem tem ${w}×${h}px. O ícone precisa de pelo menos 192×192px.`)
  }
  return { s192: squareFromImage(img, w, h, 192), s512: squareFromImage(img, w, h, 512) }
}
