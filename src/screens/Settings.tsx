import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hashPin, STORAGE_KEY, useStore } from '../store/store'
import { createInitialState, DEFAULT_RATES, parseBackup } from '../store/logic'
import { Card, Field, Pill, Screen, Sheet } from '../components/UI'
import { formatNumber } from '../lib/money'
import * as I from '../components/Icons'

function parseRate(v: string): number | null {
  const n = Number(v.replace(/\s|%/g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null
}

export default function SettingsScreen() {
  const { state, run, replace, toast, setUnlocked } = useStore()
  const nav = useNavigate()
  const [selic, setSelic] = useState(formatNumber(state.rates.selic))
  const [cdi, setCdi] = useState(formatNumber(state.rates.cdi))
  const [ipca, setIpca] = useState(formatNumber(state.rates.ipca))
  const [rateErr, setRateErr] = useState<string | null>(null)
  const [appName, setAppName] = useState(state.profile.appName)
  const [pinOpen, setPinOpen] = useState(false)
  const [cur, setCur] = useState('')
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinErr, setPinErr] = useState<string | null>(null)
  const [wipe, setWipe] = useState<0 | 1 | 2>(0)
  const fileRef = useRef<HTMLInputElement>(null)

  function saveRates() {
    const s = parseRate(selic)
    const c = parseRate(cdi)
    const i = parseRate(ipca)
    if (s === null || c === null || i === null) return setRateErr('Use números entre 0 e 100, como 14,90.')
    setRateErr(null)
    run((st) => ({ ...st, rates: { ...st.rates, selic: s, cdi: c, ipca: i } }), 'Taxas salvas. Os rendimentos foram recalculados.')
  }

  function resetRates() {
    setSelic(formatNumber(DEFAULT_RATES.selic))
    setCdi(formatNumber(DEFAULT_RATES.cdi))
    setIpca(formatNumber(DEFAULT_RATES.ipca))
    run((st) => ({ ...st, rates: { ...st.rates, selic: DEFAULT_RATES.selic, cdi: DEFAULT_RATES.cdi, ipca: DEFAULT_RATES.ipca } }), 'Taxas padrão restauradas.')
  }

  async function changePin() {
    const digits = /^\d{4,6}$/
    if (state.pinHash && (await hashPin(cur)) !== state.pinHash) return setPinErr('O PIN atual está incorreto.')
    if (!digits.test(pin1)) return setPinErr('O novo PIN deve ter de 4 a 6 números.')
    if (pin1 !== pin2) return setPinErr('Os PINs novos não são iguais.')
    const h = await hashPin(pin1)
    run((s) => ({ ...s, pinHash: h }), 'PIN alterado.')
    setPinOpen(false)
    setCur('')
    setPin1('')
    setPin2('')
    setPinErr(null)
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `backup-financas-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast('Backup exportado.')
  }

  async function importBackup(f: File) {
    try {
      const next = parseBackup(await f.text())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      replace(next)
      toast('Backup importado.')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não foi possível importar.', 'error')
    }
  }

  const pinInput = (label: string, v: string, set: (s: string) => void) => (
    <Field label={label} value={v} onChange={(x) => set(x.replace(/\D/g, '').slice(0, 6))} type="password" inputMode="numeric" />
  )

  return (
    <Screen title="Configurações">
      <section>
        <h2 className="text-xl font-semibold mb-1">Taxas da simulação</h2>
        <p className="text-muted text-sm mb-4">Usadas para calcular o rendimento de todos os investimentos (% ao ano).</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Selic" value={selic} onChange={setSelic} inputMode="decimal" />
          <Field label="CDI" value={cdi} onChange={setCdi} inputMode="decimal" />
          <Field label="IPCA" value={ipca} onChange={setIpca} inputMode="decimal" />
        </div>
        {rateErr && <p role="alert" className="text-red-300 text-sm mt-2">{rateErr}</p>}
        <div className="flex gap-3 mt-4">
          <Pill onClick={saveRates}>Salvar taxas</Pill>
          <Pill variant="ghost" onClick={resetRates}>
            Restaurar padrão
          </Pill>
        </div>
        <p className="text-muted text-sm mt-3">Cotações de dólar e euro ficam em Conta → Câmbio.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">App</h2>
        <Field label="Nome do app" value={appName} onChange={setAppName} maxLength={30} />
        <Pill
          className="mt-4"
          onClick={() => (appName.trim() ? run((s) => ({ ...s, profile: { ...s.profile, appName: appName.trim() } }), 'Nome do app salvo.') : toast('Informe o nome do app.', 'error'))}
        >
          Salvar nome
        </Pill>
        <Card onClick={() => nav('/ajustar')} className="w-full p-5 mt-4 flex items-center justify-between">
          <span>
            <span className="block font-semibold">Foto, logo, ícone e saldo</span>
            <span className="block text-muted text-sm">Abre Ajustar dados</span>
          </span>
          <I.ChevronRight />
        </Card>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold mb-1">Segurança</h2>
        <Card onClick={() => setPinOpen(true)} className="w-full p-5 flex items-center justify-between">
          <span className="font-semibold">Alterar PIN</span>
          <I.ChevronRight />
        </Card>
        <Card
          onClick={() => {
            setUnlocked(false)
            nav('/')
          }}
          className="w-full p-5 flex items-center justify-between"
        >
          <span className="font-semibold">Bloquear app agora</span>
          <I.Lock />
        </Card>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold mb-1">Backup</h2>
        <p className="text-muted text-sm">O arquivo inclui transações, investimentos, metas, foto, logo e ícone.</p>
        <div className="flex gap-3 flex-wrap">
          <Pill onClick={exportBackup}>
            <I.Download size={20} /> Exportar backup
          </Pill>
          <Pill variant="ghost" onClick={() => fileRef.current?.click()}>
            Importar backup
          </Pill>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            data-testid="import-backup"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importBackup(f)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      <section className="mt-10">
        <button type="button" className="w-full h-14 rounded-full border border-red-400/60 text-red-300 font-semibold hover:bg-red-950/40" onClick={() => setWipe(1)}>
          Apagar todos os dados
        </button>
      </section>

      <Sheet open={pinOpen} onClose={() => setPinOpen(false)} title="Alterar PIN">
        <div className="space-y-4">
          {state.pinHash && pinInput('PIN atual', cur, setCur)}
          {pinInput('Novo PIN', pin1, setPin1)}
          {pinInput('Confirmar novo PIN', pin2, setPin2)}
          {pinErr && <p role="alert" className="text-red-300 text-sm">{pinErr}</p>}
          <Pill variant="solid" className="w-full" onClick={changePin}>
            Salvar PIN
          </Pill>
        </div>
      </Sheet>

      <Sheet open={wipe > 0} onClose={() => setWipe(0)} title={wipe === 1 ? 'Apagar todos os dados?' : 'Tem certeza mesmo?'}>
        <p className="text-muted mb-6">
          {wipe === 1
            ? 'Saldo, transações, investimentos, metas, foto, logo, ícone e PIN deste aparelho serão apagados.'
            : 'Esta ação não pode ser desfeita. Exporte um backup antes se quiser guardar uma cópia.'}
        </p>
        {wipe === 1 ? (
          <Pill variant="ghost" className="w-full" onClick={() => setWipe(2)}>
            Sim, quero apagar
          </Pill>
        ) : (
          <button
            type="button"
            className="w-full h-12 rounded-full bg-red-500 text-white font-semibold"
            onClick={() => {
              const fresh = { ...createInitialState(), transactions: [], sampleData: false }
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
              replace(fresh)
              setWipe(0)
              setUnlocked(false)
              nav('/')
            }}
          >
            Apagar definitivamente
          </button>
        )}
      </Sheet>
    </Screen>
  )
}
