import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import DashboardPage from '../pages/DashboardPage'
import OrdersPage from '../pages/OrdersPage'
import InventoryPage from '../pages/InventoryPage'

const views = {
  home:      DashboardPage,
  orders:    OrdersPage,
  inventory: InventoryPage,
}

export default function AppLayout() {
  const [activeView, setActiveView] = useState('home')
  const ActivePage = views[activeView]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="flex-1 bg-[#e5e5e5] overflow-y-auto">
        <ActivePage />
      </main>
    </div>
  )
}
