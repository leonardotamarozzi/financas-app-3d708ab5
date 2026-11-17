import { Screen } from '../components/UI'
import * as I from '../components/Icons'

export default function ComingSoon({ title, back = false }: { title: string; back?: boolean }) {
  return (
    <Screen title={title} back={back} big>
      <div className="mt-16 flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-card grid place-items-center text-pillText">
          <I.Lock size={34} />
        </div>
        <p className="text-xl font-semibold">Em breve</p>
        <p className="text-muted max-w-[280px]">Esta área ainda não está disponível nesta versão do app.</p>
      </div>
    </Screen>
  )
}
