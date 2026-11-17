import { useNavigate } from 'react-router-dom'
import { Card, Screen } from '../components/UI'
import * as I from '../components/Icons'

const FAQ = [
  ['Os valores são reais?', 'Não. É uma simulação para você organizar e acompanhar suas finanças. Nenhum dinheiro é movimentado.'],
  ['Onde meus dados ficam?', 'Somente neste navegador, neste aparelho. Use Configurações → Backup para salvar uma cópia.'],
  ['Como mudo meu saldo, foto, logo ou ícone?', 'Em Início → Poupança → Ajustar dados.'],
  ['Como o rendimento é calculado?', 'Por dias corridos desde a aplicação, usando as taxas CDI, Selic e IPCA que você define em Configurações.'],
  ['Por que não consigo resgatar?', 'Alguns produtos têm carência (LCI, LCA) ou só liberam no vencimento (CDB prefixado). A data aparece na tela de resgate.'],
]

export default function HelpScreen() {
  const nav = useNavigate()
  return (
    <Screen title="Ajuda">
      <div className="space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="bg-card rounded-card p-5 group">
            <summary className="font-semibold text-[17px] cursor-pointer list-none flex justify-between items-center gap-3">
              {q}
              <I.ChevronRight className="shrink-0 transition-transform group-open:rotate-90" />
            </summary>
            <p className="text-muted mt-3">{a}</p>
          </details>
        ))}
      </div>
      <Card onClick={() => nav('/config')} className="w-full p-5 mt-6 flex items-center justify-between">
        <span className="font-semibold text-[17px]">Abrir configurações</span>
        <I.ChevronRight />
      </Card>
    </Screen>
  )
}
