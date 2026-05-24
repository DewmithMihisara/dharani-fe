import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import DashboardPage from '../pages/DashboardPage'
import OrdersPage from '../pages/OrdersPage'

const views = {
  home: DashboardPage,
  orders: OrdersPage,
}

export default function AppLayout() {
  const [activeView, setActiveView] = useState('home')
  const ActivePage = views[activeView]

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="flex-1 bg-[#e5e5e5] overflow-auto">
        <ActivePage />
      </main>
    </div>
  )
}
