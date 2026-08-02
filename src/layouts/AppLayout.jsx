import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import LicenseLockDialog from '../components/LicenseLockDialog'
import DashboardPage from '../pages/DashboardPage'
import OrdersPage from '../pages/OrdersPage'
import InventoryPage from '../pages/InventoryPage'
import FreeItemsPage from '../pages/FreeItemsPage'
import DisplayItemsPage from '../pages/DisplayItemsPage'
import RetailItemsPage from '../pages/RetailItemsPage'
import RetailPage from '../pages/RetailPage'
import ReportsPage from '../pages/ReportsPage'
import CompanyManagementPage from '../pages/CompanyManagementPage'
import BranchManagementPage from '../pages/BranchManagementPage'
import ProjectManagementPage from '../pages/ProjectManagementPage'
import { isProgramLocked } from '../utils/licenseLock'

export default function AppLayout() {
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('home')
  const [orderContext, setOrderContext] = useState(null)
  const [navVersion, setNavVersion] = useState(0)

  const bumpNav = () => setNavVersion(v => v + 1)

  if (isProgramLocked()) {
    return (
      <LicenseLockDialog
        variant="full"
        onLogout={() => {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          navigate('/login', { replace: true })
        }}
      />
    )
  }

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
      case 'inventory-selling':
        return <InventoryPage />
      case 'inventory-free':
        return <FreeItemsPage />
      case 'inventory-display':
        return <DisplayItemsPage />
      case 'inventory-retail':
        return <RetailItemsPage />
      case 'retail':
        return <RetailPage />
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
