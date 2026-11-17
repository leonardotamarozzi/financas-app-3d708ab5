import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { accountBalance, setAccountBalance, UserError } from '../store/logic'
import type { AppIcon } from '../store/types'
import { AmountInput, Avatar, Card, Field, FilePick, Pill, Screen, cx } from '../components/UI'
import * as I from '../components/Icons'
import { fileToAppIcon, fileToAvatar, fileToResized } from '../lib/image'
import { DEFAULT_ICON_URL } from '../lib/appIcon'

export default function AdjustData() {
  const { state, run, toast } = useStore()
  const nav = useNavigate()
  const p = state.profile
  const [name, setName] = useState(p.name)
  const [appName, setAppName] = useState(p.appName)
  const [doc, setDoc] = useState(p.doc)
  const [photo, setPhoto] = useState(p.photo)
  const [logo, setLogo] = useState(p.logo)
  const [icon, setIcon] = useState<AppIcon | undefined>(p.icon)
  const [balance, setBalance] = useState(accountBalance(state))
  const [errors, setErrors] = useState<{ name?: string; appName?: string }>({})

  async function pick<T>(f: File, fn: (f: File) => Promise<T>, set: (v: T) => void) {
    try {
      set(await fn(f))
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não foi possível usar essa imagem.', 'error')
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Informe seu nome.'
    if (!appName.trim()) next.appName = 'Informe o nome do app.'
    setErrors(next)
    if (Object.keys(next).length) return
    const ok = run((s) => {
      if (balance < 0) throw new UserError('O saldo não pode ser negativo.')
      const withProfile = { ...s, profile: { ...s.profile, name: name.trim(), appName: appName.trim(), doc: doc.trim() || '***.000.000-**', photo, logo, icon } }
      return setAccountBalance(withProfile, balance)
    }, 'Dados salvos.')
    if (ok) nav('/poupanca')
  }

  return (
    <Screen title="Ajustar dados">
      <form onSubmit={save} className="space-y-8" noValidate>
        <section className="flex items-center gap-5">
          <Avatar src={photo} name={name || 'Você'} size={88} />
          <div className="space-y-2">
            <FilePick label="Enviar foto de perfil" onFile={(f) => pick(f, fileToAvatar, setPhoto)} className="h-10 px-4 rounded-full bg-pill text-pillText font-semibold">
              {photo ? 'Trocar foto' : 'Adicionar foto'}
            </FilePick>
            {photo && (
              <button type="button" className="block text-muted text-sm underline underline-offset-4" onClick={() => setPhoto(undefined)}>
                Remover foto
              </button>
            )}
          </div>
        </section>

        <Field label="Seu nome" value={name} onChange={setName} error={errors.name} maxLength={40} />
        <Field label="Documento exibido (mascarado)" value={doc} onChange={setDoc} placeholder="***.000.000-**" maxLength={20} />

        <Card className="p-5">
          <AmountInput label="Saldo da conta" value={balance} onChange={setBalance} />
          <p className="text-muted text-sm mt-3">Ao salvar, a diferença entra no extrato como "Ajuste de saldo".</p>
        </Card>

        <Field label="Nome do app" value={appName} onChange={setAppName} error={errors.appName} maxLength={30} />

        <section>
          <h2 className="text-muted text-sm mb-2">Logo do app (tela de entrada)</h2>
          <div className="flex items-center gap-4">
            <div className="h-16 w-36 rounded-2xl bg-card border border-line grid place-items-center overflow-hidden">
              {logo ? <img src={logo} alt="Logo atual" className="max-h-full max-w-full object-contain" /> : <I.Image className="text-muted" />}
            </div>
            <div className="space-y-2">
              <FilePick label="Enviar logo" onFile={(f) => pick(f, (x) => fileToResized(x, 256, 'image/png'), setLogo)} className="h-10 px-4 rounded-full bg-pill text-pillText font-semibold">
                {logo ? 'Trocar logo' : 'Adicionar logo'}
              </FilePick>
              {logo && (
                <button type="button" className="block text-muted text-sm underline underline-offset-4" onClick={() => setLogo(undefined)}>
                  Remover logo
                </button>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby="icon-title">
          <h2 id="icon-title" className="text-muted text-sm mb-2">Ícone do app</h2>
          <div className="flex items-center gap-4">
            <img
              src={icon ? icon.s192 : DEFAULT_ICON_URL}
              alt={icon ? 'Ícone personalizado' : 'Ícone padrão'}
              className={cx('w-20 h-20 rounded-[22px] object-cover border border-line', !icon && 'bg-bg')}
              data-testid="icon-preview"
            />
            <div className="space-y-2">
              <FilePick label="Escolher imagem do ícone" onFile={(f) => pick(f, fileToAppIcon, setIcon)} className="h-10 px-4 rounded-full bg-pill text-pillText font-semibold">
                Escolher imagem
              </FilePick>
              <button type="button" disabled={!icon} className="block text-muted text-sm underline underline-offset-4 disabled:opacity-40 disabled:no-underline" onClick={() => setIcon(undefined)}>
                Restaurar padrão
              </button>
            </div>
          </div>
          <p className="text-muted text-sm mt-3">
            Imagem quadrada de pelo menos 192×192px (PNG, JPG, WebP ou SVG, até 5 MB). O ícone vale só neste navegador. Para vê-lo na tela inicial do celular, use "Adicionar à tela inicial" depois de salvar. No iPhone, remova e adicione de novo para trocar.
          </p>
        </section>

        <Pill type="submit" variant="solid" className="w-full h-14">
          Salvar
        </Pill>
      </form>
    </Screen>
  )
}
