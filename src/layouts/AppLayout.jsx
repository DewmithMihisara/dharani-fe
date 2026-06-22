import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import DashboardPage from '../pages/DashboardPage'
import OrdersPage from '../pages/OrdersPage'
import InventoryPage from '../pages/InventoryPage'
import ReportsPage from '../pages/ReportsPage'
import CompanyManagementPage from '../pages/CompanyManagementPage'
import BranchManagementPage from '../pages/BranchManagementPage'
import ProjectManagementPage from '../pages/ProjectManagementPage'

export default function AppLayout() {
  const [activeView, setActiveView] = useState('home')
  const [orderContext, setOrderContext] = useState(null)
  const [navVersion, setNavVersion] = useState(0)

  const bumpNav = () => setNavVersion(v => v + 1)

  function handleNavigate(view, ctx) {
    setActiveView(view)
    if (ctx) setOrderContext(ctx)
  }

  function renderView() {
    switch (activeView) {
      case 'orders':
        return (
          <OrdersPage
            key={orderContext?.branchId ?? 'none'}
            branchId={orderContext?.branchId ?? null}
            branchName={orderContext?.branchName ?? ''}
            companyLabel={orderContext?.companyLabel ?? ''}
          />
        )
      case 'inventory':
        return <InventoryPage />
      case 'reports':
        return <ReportsPage />
      case 'company':
        return <CompanyManagementPage onDataChange={bumpNav} />
      case 'branch':
        return <BranchManagementPage onDataChange={bumpNav} />
      case 'projects':
        return <ProjectManagementPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={handleNavigate} navVersion={navVersion} />
      <main className="flex-1 bg-[#e5e5e5] overflow-y-auto">
        {renderView()}
      </main>
    </div>
  )
}
