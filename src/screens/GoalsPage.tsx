import { useState } from 'react'
import { useStore } from '../store/store'
import { uid, UserError } from '../store/logic'
import type { Goal } from '../store/types'
import { AmountInput, Field, Money, Pill, Screen, Sheet } from '../components/UI'
import * as I from '../components/Icons'
import { PigArt } from './Piggy'

function GoalEditor({ goal, onClose }: { goal: Goal | 'new'; onClose: () => void }) {
  const { run } = useStore()
  const isNew = goal === 'new'
  const [name, setName] = useState(isNew ? '' : goal.name)
  const [target, setTarget] = useState(isNew ? 0 : goal.target)
  const [saved, setSaved] = useState(isNew ? 0 : goal.saved)

  function save() {
    const ok = run((s) => {
      if (!name.trim()) throw new UserError('Dê um nome ao seu sonho.')
      if (target <= 0) throw new UserError('Informe quanto o sonho custa.')
      const g: Goal = { id: isNew ? uid('goal') : goal.id, name: name.trim(), target, saved }
      return { ...s, goals: isNew ? [...s.goals, g] : s.goals.map((x) => (x.id === g.id ? g : x)) }
    }, isNew ? 'Sonho adicionado.' : 'Sonho atualizado.')
    if (ok) onClose()
  }

  return (
    <Sheet open onClose={onClose} title={isNew ? 'Novo sonho' : 'Editar sonho'}>
      <div className="space-y-6">
        <Field label="Nome do sonho" value={name} onChange={setName} placeholder="Ex.: Viagem de férias" maxLength={40} />
        <AmountInput label="Quanto custa" value={target} onChange={setTarget} />
        <AmountInput label="Quanto já guardei" value={saved} onChange={setSaved} />
        <Pill variant="solid" className="w-full" onClick={save}>
          Salvar sonho
        </Pill>
        {!isNew && (
          <button
            type="button"
            className="w-full text-red-300 font-semibold py-2"
            onClick={() => run((s) => ({ ...s, goals: s.goals.filter((x) => x.id !== goal.id) }), 'Sonho removido.') && onClose()}
          >
            Remover sonho
          </button>
        )}
      </div>
    </Sheet>
  )
}

export function GoalsCard() {
  const { state } = useStore()
  const [editing, setEditing] = useState<Goal | 'new' | null>(null)
  return (
    <section className="rounded-card bg-accent p-5 relative overflow-hidden" aria-label="Qual o seu sonho?">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[28px] leading-tight text-white">
          Qual o <span className="font-extrabold">seu sonho?</span>
        </h2>
        <PigArt size={64} />
      </div>
      <ul className="mt-4 space-y-2.5">
        {state.goals.map((g) => {
          const pct = Math.min(100, g.target ? Math.round((g.saved / g.target) * 100) : 0)
          return (
            <li key={g.id}>
              <button type="button" onClick={() => setEditing(g)} className="relative w-full h-12 rounded-full bg-[#F4A46B] border border-[#ffc79a] overflow-hidden text-left" aria-label={`Editar ${g.name}, ${pct}% guardado`}>
                <span className="absolute inset-y-0 left-0 bg-[#ffd1a8]" style={{ width: `${pct}%` }} aria-hidden />
                <span className="relative flex items-center justify-between px-5 text-white font-semibold">
                  <span className="truncate">{g.name}</span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-[#7a3305]">{pct}%</span>
                    <I.Pencil size={20} />
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        <li>
          <button type="button" onClick={() => setEditing('new')} className="w-full h-12 rounded-full bg-[#F4A46B] border border-[#ffc79a] flex items-center justify-between px-5 text-white font-semibold">
            Outros… <I.Plus size={20} />
          </button>
        </li>
      </ul>
      {editing && <GoalEditor goal={editing} onClose={() => setEditing(null)} />}
    </section>
  )
}

export default function GoalsPage() {
  const { state } = useStore()
  const total = state.goals.reduce((a, g) => a + g.saved, 0)
  const target = state.goals.reduce((a, g) => a + g.target, 0)
  return (
    <Screen title="Metas">
      <p className="text-muted mb-5">
        Guardado para seus sonhos: <Money cents={total} className="text-white font-semibold" /> de <Money cents={target} />
      </p>
      <GoalsCard />
      <p className="text-muted text-sm mt-4">Toque em um sonho para editar o valor guardado. As metas são um controle à parte e não movimentam o saldo.</p>
    </Screen>
  )
}
