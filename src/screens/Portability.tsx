import { Card, Screen } from '../components/UI'

export default function Portability() {
  return (
    <Screen title="Portabilidade de salário">
      <p className="text-muted text-[17px]">Portabilidade é levar o salário que cai em outro banco direto para a sua conta, sem custo.</p>
      <Card className="p-5 mt-6 space-y-4">
        <h2 className="text-lg font-semibold">Como funciona na vida real</h2>
        <ol className="list-decimal pl-5 space-y-2 text-muted">
          <li>Peça a portabilidade no banco que vai receber o salário.</li>
          <li>Informe o CNPJ da empresa e o banco onde o salário cai hoje.</li>
          <li>Em até 10 dias úteis o salário passa a ser transferido automaticamente.</li>
        </ol>
      </Card>
      <Card className="p-5 mt-4">
        <h2 className="text-lg font-semibold">Neste app</h2>
        <p className="text-muted mt-2">Para registrar seu salário, use Conta → Receber ou Pix → Registrar Pix recebido.</p>
      </Card>
    </Screen>
  )
}
