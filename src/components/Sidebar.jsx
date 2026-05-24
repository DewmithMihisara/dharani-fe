import { LayoutDashboard, ClipboardList } from 'lucide-react'
import Logo from './Logo'

const navItems = [
  { key: 'home', icon: LayoutDashboard, label: 'Home' },
  { key: 'orders', icon: ClipboardList, label: 'Orders' },
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
  return (
    <aside className="w-60 min-h-screen bg-[#14213d] flex flex-col px-4 py-6 shrink-0">
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
    </aside>
  )
}
