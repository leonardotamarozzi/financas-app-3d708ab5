import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store/store'
import { BottomNav, Toasts } from './components/UI'
import PixBanner from './components/PixBanner'
import Login from './screens/Login'
import Home from './screens/Home'
import Account from './screens/Account'
import Statement from './screens/Statement'
import ExchangeScreen from './screens/Exchange'
import Portability from './screens/Portability'
import Savings from './screens/Savings'
import AdjustData from './screens/AdjustData'
import Movement from './screens/Movement'
import PixHub from './screens/PixHub'
import Piggy from './screens/Piggy'
import GoalsPage from './screens/GoalsPage'
// Charts (recharts) load only when the Invest tab opens.
const Invest = lazy(() => import('./screens/Invest'))
import Products from './screens/Products'
import InvestFlow from './screens/InvestFlow'
import RedeemFlow from './screens/RedeemFlow'
import SettingsScreen from './screens/Settings'
import HelpScreen from './screens/Help'
import ComingSoon from './screens/ComingSoon'

export default function App() {
  const { unlocked } = useStore()
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="mx-auto max-w-[430px] min-h-screen bg-bg md:border-x md:border-line relative">
      <Toasts />
      <PixBanner />
      {!unlocked ? (
        <Login />
      ) : (
        <>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/conta" element={<Account />} />
            <Route path="/extrato" element={<Statement />} />
            <Route path="/cambio" element={<ExchangeScreen />} />
            <Route path="/portabilidade" element={<Portability />} />
            <Route path="/poupanca" element={<Savings />} />
            <Route path="/ajustar" element={<AdjustData />} />
            <Route path="/movimento/:kind" element={<Movement />} />
            <Route path="/pix" element={<PixHub />} />
            <Route path="/porquinho" element={<Piggy />} />
            <Route path="/metas" element={<GoalsPage />} />
            <Route
              path="/invest"
              element={
                <Suspense fallback={<p className="p-6 text-muted">Carregando investimentos…</p>}>
                  <Invest />
                </Suspense>
              }
            />
            <Route path="/produtos" element={<Products />} />
            {/* key by query string so a new link (other product/position) starts the flow fresh */}
            <Route path="/investir" element={<InvestFlow key={search} />} />
            <Route path="/resgatar" element={<RedeemFlow key={search} />} />
            <Route path="/config" element={<SettingsScreen />} />
            <Route path="/ajuda" element={<HelpScreen />} />
            <Route path="/forum" element={<ComingSoon title="Fórum" />} />
            <Route path="/shop" element={<ComingSoon title="Shop" />} />
            <Route path="/cartoes" element={<ComingSoon title="Cartões" back />} />
            <Route path="*" element={<ComingSoon title="Página não encontrada" back />} />
          </Routes>
          <BottomNav />
        </>
      )}
    </div>
  )
}
