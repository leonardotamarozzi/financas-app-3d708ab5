import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { accountBalance } from '../store/logic'
import { Card, Money, Screen } from '../components/UI'
import * as I from '../components/Icons'

export default function PixHub() {
  const { state } = useStore()
  const nav = useNavigate()
  const count = state.transactions.filter((t) => t.type === 'pix_in' || t.type === 'pix_out').length
  return (
    <Screen title="Pix">
      <p className="text-muted">
        Saldo disponível: <Money cents={accountBalance(state)} className="text-white font-semibold" />
      </p>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Card onClick={() => nav('/movimento/pix_out')} className="p-5 h-[132px] flex flex-col justify-between">
          <I.ArrowUp size={30} />
          <span className="font-semibold text-[17px]">Enviar Pix</span>
        </Card>
        <Card onClick={() => nav('/movimento/pix_in')} className="p-5 h-[132px] flex flex-col justify-between">
          <I.ArrowDown size={30} />
          <span className="font-semibold text-[17px]">Registrar Pix recebido</span>
        </Card>
      </div>
      <p className="text-muted mt-6">
        {count} {count === 1 ? 'Pix registrado' : 'Pix registrados'} no total.
      </p>
    </Screen>
  )
}
