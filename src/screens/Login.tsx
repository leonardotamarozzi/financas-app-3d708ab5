import { useState } from 'react'
import { hashPin, useStore } from '../store/store'
import { Avatar, ErrorText, FilePick, Pill, Sheet, cx } from '../components/UI'
import * as I from '../components/Icons'
import { fileToResized } from '../lib/image'

export function LogoBox({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const { state, run, toast } = useStore()
  const { logo, icon } = state.profile
  const onFile = async (f: File) => {
    try {
      const data = await fileToResized(f, 256, 'image/png')
      run((s) => ({ ...s, profile: { ...s.profile, logo: data } }), 'Logo atualizada.')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não foi possível usar essa imagem.', 'error')
    }
  }
  const box = size === 'lg' ? 'h-[72px] w-[176px]' : 'h-12 w-28'
  return (
    <FilePick onFile={onFile} label="Enviar logo" className={cx('rounded-2xl overflow-hidden flex items-center justify-start', box, !logo && !icon && 'border-2 border-dashed border-[#555] justify-center hover:border-pillText')}>
      {logo ? (
        <img src={logo} alt="Logo" className="max-h-full max-w-full object-contain" />
      ) : icon ? (
        <img src={icon.s192} alt="Ícone do app" className="h-full aspect-square rounded-2xl object-cover" />
      ) : (
        <span className="flex items-center gap-2 text-sm text-muted">
          <I.Image size={20} /> Adicionar logo
        </span>
      )}
    </FilePick>
  )
}

export default function Login() {
  const { state, run, setUnlocked, toast } = useStore()
  const creating = !state.pinHash
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [forgot, setForgot] = useState(false)
  const [help, setHelp] = useState(false)
  const [scanning, setScanning] = useState(false)

  const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, 6)
  const canSubmit = creating ? pin.length >= 4 && pin2.length >= 4 : pin.length >= 4

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (creating) {
      if (pin !== pin2) return setError('Os PINs não são iguais. Digite o mesmo PIN nos dois campos.')
      const h = await hashPin(pin)
      run((s) => ({ ...s, pinHash: h }), 'PIN criado. Use-o para entrar.')
      setUnlocked(true)
      return
    }
    const h = await hashPin(pin)
    if (h !== state.pinHash) {
      setPin('')
      return setError('PIN incorreto. Tente de novo.')
    }
    setUnlocked(true)
  }

  function biometric() {
    if (creating) return
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      setUnlocked(true)
    }, 900)
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-safe pb-10">
      <header className="flex items-start justify-between">
        <LogoBox />
        <div className="flex items-center gap-6 pt-3">
          <button type="button" aria-label="Segurança" className="p-2 -m-2 rounded-full hover:bg-card" onClick={() => toast('Seus dados ficam só neste aparelho. Nada é enviado para servidores.')}>
            <I.Shield size={30} />
          </button>
          <button type="button" aria-label="Ajuda" className="p-2 -m-2 rounded-full hover:bg-card" onClick={() => setHelp(true)}>
            <I.Help size={30} />
          </button>
        </div>
      </header>

      <div className="mt-8 bg-card rounded-card p-5 flex items-center gap-4">
        <Avatar src={state.profile.photo} name={state.profile.name} size={52} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[18px] truncate">{state.profile.name}</p>
          <p className="text-muted tracking-wide">{state.profile.doc}</p>
        </div>
        <Pill variant="outline" type="button" className="px-5" onClick={() => toast('Este aparelho guarda um único perfil. Edite nome e foto em Poupança → Ajustar dados.')}>
          Trocar
        </Pill>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {creating && <p className="text-muted">Primeiro acesso: crie um PIN de 4 a 6 dígitos para proteger o app.</p>}
        <input
          type="password"
          inputMode="numeric"
          autoComplete={creating ? 'new-password' : 'current-password'}
          aria-label={creating ? 'Novo PIN' : 'Senha'}
          placeholder={creating ? 'Novo PIN' : 'Senha'}
          value={pin}
          onChange={(e) => setPin(onlyDigits(e.target.value))}
          className="w-full h-[72px] rounded-[20px] bg-transparent border border-[#555] px-5 text-[20px] outline-none focus:border-accent placeholder:text-[#9a9a9a] tracking-[0.3em] placeholder:tracking-normal"
        />
        {creating && (
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            aria-label="Confirmar PIN"
            placeholder="Confirmar PIN"
            value={pin2}
            onChange={(e) => setPin2(onlyDigits(e.target.value))}
            className="w-full h-[72px] rounded-[20px] bg-transparent border border-[#555] px-5 text-[20px] outline-none focus:border-accent placeholder:text-[#9a9a9a] tracking-[0.3em] placeholder:tracking-normal"
          />
        )}
        <ErrorText>{error}</ErrorText>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cx('w-full h-[60px] rounded-full text-[19px] font-semibold transition-colors', canSubmit ? 'bg-accent text-[#1a0d03] hover:bg-[#f27d18]' : 'bg-card2 text-[#777]')}
        >
          {creating ? 'Criar PIN e entrar' : 'Entrar'}
        </button>
        {!creating && (
          <Pill type="button" className="w-full h-[60px] text-[19px]" onClick={() => setForgot(true)}>
            Esqueci minha senha
          </Pill>
        )}
      </form>

      {!creating && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={biometric}
            aria-label="Entrar com biometria"
            className={cx('w-[60px] h-[60px] rounded-full border border-pillText text-pillText grid place-items-center hover:bg-pill/40', scanning && 'animate-pulse')}
          >
            <I.Face size={30} />
          </button>
          <span className="text-pillText font-semibold text-[17px]">{scanning ? 'Verificando…' : 'Entrar com biometria'}</span>
        </div>
      )}

      <p className="mt-auto pt-10 text-center text-sm text-[#8a8a8a]">Dados salvos somente neste aparelho.</p>

      <Sheet open={forgot} onClose={() => setForgot(false)} title="Esqueci minha senha">
        <p className="text-muted mb-6">Isso apaga o PIN deste aparelho. Seu saldo e seus investimentos continuam salvos, e você cria um PIN novo em seguida.</p>
        <Pill
          variant="solid"
          className="w-full"
          onClick={() => {
            run((s) => ({ ...s, pinHash: undefined }), 'PIN apagado. Crie um novo.')
            setForgot(false)
            setPin('')
          }}
        >
          Apagar PIN
        </Pill>
      </Sheet>

      <Sheet open={help} onClose={() => setHelp(false)} title="Ajuda">
        <ul className="space-y-3 text-muted">
          <li>Toque na caixa no canto superior para enviar a logo do app.</li>
          <li>O PIN fica guardado só neste navegador. Se esquecer, use "Esqueci minha senha".</li>
          <li>Todos os valores são uma simulação para organizar suas finanças. Nenhum dinheiro real é movimentado.</li>
        </ul>
      </Sheet>
    </div>
  )
}
