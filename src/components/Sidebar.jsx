import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Package, FileBarChart, LogOut, ChevronDown, ChevronRight, Building2 } from 'lucide-react'
import Logo from './Logo'
import ConfirmDialog from './ConfirmDialog'
import { getCompanies, getBranchesByCompany } from '../api/orderApi'

const navItems = [
  { key: 'home',      icon: LayoutDashboard, label: 'Home'      },
  { key: 'inventory', icon: Package,         label: 'Inventory' },
  { key: 'reports',   icon: FileBarChart,    label: 'Reports'   },
]

function NavItem({ navKey, icon: Icon, label, isActive, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(navKey)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
        isActive
          ? 'bg-[#fca311] text-[#14213d]'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon size={18} strokeWidth={1.8} />
      {label}
    </button>
  )
}

export default function Sidebar({ activeView, onNavigate, navVersion = 0 }) {
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)

  const [ordersOpen, setOrdersOpen]               = useState(false)
  const [companies, setCompanies]                 = useState(null)   // null = not loaded yet
  const [branchesByCompany, setBranchesByCompany] = useState({})     // { [companyId]: OptionDto[] | undefined }
  const [hoverCompanyId, setHoverCompanyId]       = useState(null)

  const [companyMgmtOpen, setCompanyMgmtOpen]     = useState(false)

  const token = localStorage.getItem('accessToken')

  // Refresh the drill-down when companies/branches change on the management pages.
  useEffect(() => {
    if (navVersion === 0) return            // skip initial mount
    setBranchesByCompany({})                // drop cached branches → re-fetch on next hover
    if (companies != null) {                // if companies were already loaded, refresh now
      getCompanies(token).then(res => setCompanies(res.data?.companies ?? []))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navVersion])

  function toggleOrders() {
    const next = !ordersOpen
    setOrdersOpen(next)
    if (next && companies == null) {
      getCompanies(token).then(res => setCompanies(res.data?.companies ?? []))
    }
  }

  function handleCompanyHover(companyId) {
    setHoverCompanyId(companyId)
    if (branchesByCompany[companyId] === undefined) {
      getBranchesByCompany(companyId, token).then(res =>
        setBranchesByCompany(prev => ({ ...prev, [companyId]: res.data?.branches ?? [] }))
      )
    }
  }

  function handleBranchClick(company, branch) {
    onNavigate('orders', {
      branchId: branch.id,
      branchName: branch.name,
      companyName: company.name,
      companyLabel: `${company.name} - ${branch.name}`,
    })
    setOrdersOpen(false)
    setHoverCompanyId(null)
  }

  const ordersActive = activeView === 'orders'

  return (
    <aside className="w-60 h-full bg-[#14213d] flex flex-col px-4 py-6 shrink-0">
      <div className="px-2 mb-6">
        <Logo dark size="sm" />
      </div>

      <nav className="flex flex-col gap-1">
        <NavItem
          navKey="home"
          icon={LayoutDashboard}
          label="Home"
          isActive={activeView === 'home'}
          onNavigate={onNavigate}
        />

        {/* Orders — drill-down: companies → branches */}
        <div>
          <button
            onClick={toggleOrders}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
              ordersActive
                ? 'bg-[#fca311] text-[#14213d]'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <ClipboardList size={18} strokeWidth={1.8} />
            Orders
            <ChevronDown
              size={16}
              strokeWidth={1.8}
              className={`ml-auto transition-transform duration-150 ${ordersOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {ordersOpen && (
            <div
              className="mt-1 flex flex-col gap-0.5 pl-3"
              onMouseLeave={() => setHoverCompanyId(null)}
            >
              {companies == null && (
                <div className="px-3 py-2 text-xs text-white/40">Loading…</div>
              )}
              {companies != null && companies.length === 0 && (
                <div className="px-3 py-2 text-xs text-white/40">No companies</div>
              )}
              {(companies ?? []).map(company => {
                const branches = branchesByCompany[company.id]
                return (
                  <div
                    key={company.id}
                    className="relative"
                    onMouseEnter={() => handleCompanyHover(company.id)}
                  >
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors duration-150 cursor-pointer ${
                        hoverCompanyId === company.id
                          ? 'bg-white/10 text-white'
                          : 'text-white/55 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{company.name}</span>
                      <ChevronRight size={14} strokeWidth={1.8} className="ml-auto shrink-0" />
                    </button>

                    {hoverCompanyId === company.id && (
                      <div className="absolute left-full top-0 z-50 pl-1">
                        <div className="min-w-44 bg-[#1c2c4d] border border-white/10 rounded-lg shadow-xl py-1">
                          {branches === undefined && (
                            <div className="px-3 py-2 text-xs text-white/40">Loading…</div>
                          )}
                          {branches && branches.length === 0 && (
                            <div className="px-3 py-2 text-xs text-white/40">No branches</div>
                          )}
                          {(branches ?? []).map(branch => (
                            <button
                              key={branch.id}
                              onClick={() => handleBranchClick(company, branch)}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-white/70 hover:text-[#14213d] hover:bg-[#fca311] transition-colors duration-150 cursor-pointer"
                            >
                              {branch.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Company Management — sub-menus: Company / Branch / Projects */}
        <div>
          <button
            onClick={() => setCompanyMgmtOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
              ['company', 'branch', 'projects'].includes(activeView)
                ? 'bg-[#fca311] text-[#14213d]'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Building2 size={18} strokeWidth={1.8} />
            Companies
            <ChevronDown
              size={16}
              strokeWidth={1.8}
              className={`ml-auto transition-transform duration-150 ${companyMgmtOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {companyMgmtOpen && (
            <div className="mt-1 flex flex-col gap-0.5 pl-3">
              {[
                { key: 'company',  label: 'Company'  },
                { key: 'branch',   label: 'Branch'   },
                { key: 'projects', label: 'Projects' },
              ].map(sub => (
                <button
                  key={sub.key}
                  onClick={() => onNavigate(sub.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors duration-150 cursor-pointer ${
                    activeView === sub.key
                      ? 'bg-white/10 text-white'
                      : 'text-white/55 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {navItems.filter(i => i.key !== 'home').map(item => (
          <NavItem
            key={item.key}
            navKey={item.key}
            icon={item.icon}
            label={item.label}
            isActive={activeView === item.key}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto">
        <button
          onClick={() => setShowLogout(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer text-white/60 hover:text-red-400 hover:bg-red-400/10"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Logout
        </button>
      </div>

      {showLogout && (
        <ConfirmDialog
          message="Are you sure you want to logout?"
          onConfirm={() => {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            navigate('/login')
          }}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </aside>
  )
}
