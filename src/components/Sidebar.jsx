import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Package, LogOut } from 'lucide-react'
import Logo from './Logo'
import ConfirmDialog from './ConfirmDialog'

const navItems = [
  { key: 'home',      icon: LayoutDashboard, label: 'Home'      },
  { key: 'orders',    icon: ClipboardList,   label: 'Orders'    },
  { key: 'inventory', icon: Package,         label: 'Inventory' },
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

export default function Sidebar({ activeView, onNavigate }) {
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)

  return (
    <aside className="w-60 h-full bg-[#14213d] flex flex-col px-4 py-6 shrink-0">
      <div className="px-2 mb-6">
        <Logo dark size="sm" />
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(item => (
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
          onConfirm={() => navigate('/login')}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </aside>
  )
}
