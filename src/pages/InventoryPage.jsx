import { useState } from 'react'
import { Plus, Pencil, Eye } from 'lucide-react'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import AddBadgeForm from './AddBadgeForm'
import BadgeView from './BadgeView'
import rawInventory from '../data/inventory.json'

const iconBtn = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'
const endBtn  = 'px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-100 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer'

const STATUS_CHIP = {
  PENDING:  'bg-amber-50 text-amber-600 border border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  ENDED:    'bg-[#f0f0f0] text-[#888] border border-[#e0e0e0]',
}

function nextBadgeNumber(badges) {
  if (badges.length === 0) return 'B-001'
  const max = Math.max(...badges.map(b => parseInt(b.badgeNumber.replace('B-', ''), 10)))
  return `B-${String(max + 1).padStart(3, '0')}`
}

// ── Inventory table ───────────────────────────────────────────────────────────

function InventoryTable({ badges, onEdit, onView, onEnd }) {
  if (badges.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#d8d8d8] py-16 text-center">
        <p className="text-sm text-[#bbb]">No badges yet. Click "Add Badge" to create your first one.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-x-auto">
      <table className="min-w-max w-full text-sm">
        <thead>
          <tr className="bg-[#14213d] text-white text-left">
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Badge #</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Items</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Status</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {badges.map((badge, i) => (
            <tr
              key={badge.id}
              className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
              }`}
            >
              <td className="px-5 py-3.5 font-semibold text-[#14213d]">{badge.badgeNumber}</td>
              <td className="px-5 py-3.5 text-[#555]">{badge.items.length}</td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CHIP[badge.status]}`}>
                  {badge.status}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <button className={iconBtn} title="Edit" onClick={() => onEdit(badge)}><Pencil size={15} /></button>
                  <button className={iconBtn} title="View" onClick={() => onView(badge)}><Eye    size={15} /></button>
                  {badge.status === 'APPROVED' && (
                    <button className={endBtn} onClick={() => onEnd(badge.id)}>End</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [view,      setView]      = useState('list') // 'list' | 'form'
  const [editBadge, setEditBadge] = useState(null)
  const [viewBadge, setViewBadge] = useState(null)
  const [badges,    setBadges]    = useState(rawInventory)
  const [dialog,    setDialog]    = useState(null)

  const confirm = (message, onConfirm) => setDialog({ message, onConfirm })
  const closeDialog = () => setDialog(null)

  function handleSave(entries, badgeId) {
    if (badgeId) {
      setBadges(prev => prev.map(b => b.id === badgeId ? { ...b, items: entries } : b))
    } else {
      setBadges(prev => [...prev, {
        id:          crypto.randomUUID(),
        badgeNumber: nextBadgeNumber(prev),
        status:      'PENDING',
        items:       entries,
      }])
    }
    setEditBadge(null)
    setView('list')
  }

  function handleApprove(id) {
    setBadges(prev => prev.map(b => {
      if (b.id === id)             return { ...b, status: 'APPROVED' }
      if (b.status === 'APPROVED') return { ...b, status: 'ENDED' }
      return b
    }))
    setViewBadge(prev => prev ? { ...prev, status: 'APPROVED' } : prev)
  }

  function handleEnd(id) {
    confirm('End this badge?', () => {
      setBadges(prev => prev.map(b => b.id === id ? { ...b, status: 'ENDED' } : b))
    })
  }

  if (view === 'form') return (
    <div className="p-8">
      <AddBadgeForm
        badge={editBadge}
        onBack={() => { setEditBadge(null); setView('list') }}
        onSave={handleSave}
      />
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[#14213d]">Inventory</h1>
        <Button onClick={() => setView('form')}>
          <Plus size={15} className="mr-1.5" />
          Add Badge
        </Button>
      </div>

      <InventoryTable
        badges={badges}
        onEdit={badge => { setEditBadge(badge); setView('form') }}
        onView={badge => setViewBadge(badge)}
        onEnd={handleEnd}
      />

      {viewBadge && (
        <BadgeView
          badge={viewBadge}
          onClose={() => setViewBadge(null)}
          onApprove={handleApprove}
        />
      )}

      {dialog && (
        <ConfirmDialog
          message={dialog.message}
          onConfirm={() => { dialog.onConfirm(); closeDialog() }}
          onCancel={closeDialog}
        />
      )}
    </div>
  )
}
