import { useState, useEffect } from 'react'
import { Plus, Pencil, Eye, Upload } from 'lucide-react'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import AddRetailBadgeForm from './AddRetailBadgeForm'
import RetailBadgeView from './RetailBadgeView'
import RetailBadgeUploadDialog from '../components/RetailBadgeUploadDialog'
import { getBadgesPaginated, endBadge } from '../api/retailBadgeApi'

const iconBtn = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'
const endBtn  = 'px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-100 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer'

const STATUS_CHIP = {
  PENDING:  'bg-amber-50 text-amber-600 border border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  ENDED:    'bg-[#f0f0f0] text-[#888] border border-[#e0e0e0]',
}

// ── Retail badge table ───────────────────────────────────────────────────────

function RetailBadgeTable({ badges, onEdit, onView, onEnd }) {
  if (badges.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#d8d8d8] py-16 text-center">
        <p className="text-sm text-[#bbb]">No retail badges yet. Click "Add Badge" to create your first one.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-x-auto">
      <table className="min-w-max w-full text-xs">
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
              <td className="px-5 py-3.5 text-[#555]">{badge.items?.length ?? 0}</td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CHIP[badge.status] ?? ''}`}>
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

export default function RetailItemsPage() {
  const [view,       setView]       = useState('list')
  const [editBadge,  setEditBadge]  = useState(null)
  const [viewBadge,  setViewBadge]  = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [badges,    setBadges]    = useState([])
  const [dialog,    setDialog]    = useState(null)
  const [offset,    setOffset]    = useState(0)
  const [limit,     setLimit]     = useState(10)
  const [total,     setTotal]     = useState(0)

  const token = localStorage.getItem('accessToken')

  async function loadBadges(off = offset, lim = limit) {
    const res = await getBadgesPaginated({ offset: off, limit: lim }, token)
    if (res.status === 200) {
      setBadges(res.data.badges ?? [])
      setTotal(res.data.total ?? 0)
    }
  }

  useEffect(() => { loadBadges(offset, limit) }, [offset, limit])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.floor(offset / limit) + 1
  const from = total === 0 ? 0 : offset + 1
  const to   = Math.min(offset + limit, total)

  const confirm     = (message, onConfirm) => setDialog({ message, onConfirm })
  const closeDialog = () => setDialog(null)

  function handleSave() {
    setEditBadge(null)
    setView('list')
    loadBadges(offset, limit)
  }

  function handleApprove() {
    setViewBadge(null)
    loadBadges(offset, limit)
  }

  function handleView(badge) {
    setViewBadge(badge)
  }

  function handleEnd(id) {
    confirm('End this badge?', async () => {
      const res = await endBadge(id, token)
      if (res.status === 200) {
        loadBadges(offset, limit)
      } else {
        alert(res.message || 'Failed to end badge')
      }
    })
  }

  function handleBack() {
    setEditBadge(null)
    setView('list')
    loadBadges(offset, limit)
  }

  if (view === 'form') return (
    <div className="p-8">
      <AddRetailBadgeForm
        badge={editBadge}
        onBack={handleBack}
        onSave={handleSave}
      />
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#14213d]">Retail Items</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowUpload(true)}>
            <Upload size={15} className="mr-1.5" />
            Upload by Excel
          </Button>
          <Button onClick={() => setView('form')}>
            <Plus size={15} className="mr-1.5" />
            Add Badge
          </Button>
        </div>
      </div>

      <RetailBadgeTable
        badges={badges}
        onEdit={badge => { setEditBadge(badge); setView('form') }}
        onView={handleView}
        onEnd={handleEnd}
      />

      {/* Pagination bar */}
      <div className="flex items-center justify-between px-1 pt-4 text-xs text-[#666]">
        <span>
          {total === 0 ? 'No badges' : `Showing ${from}–${to} of ${total} badge${total !== 1 ? 's' : ''}`}
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#888]">Rows per page:</span>
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setOffset(0) }}
              className="border border-[#e5e5e5] rounded-md px-2 py-1 text-xs text-[#444] bg-white focus:outline-none focus:border-[#14213d] cursor-pointer"
            >
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(o => Math.max(0, o - limit))}
              disabled={offset === 0}
              className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >←</button>
            <span className="text-[#444] font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setOffset(o => o + limit)}
              disabled={currentPage >= totalPages}
              className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >→</button>
          </div>
        </div>
      </div>

      {viewBadge && (
        <RetailBadgeView
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

      {showUpload && (
        <RetailBadgeUploadDialog
          onClose={() => { setShowUpload(false); loadBadges(offset, limit) }}
          onUploaded={badge => { setShowUpload(false); setViewBadge(badge); loadBadges(offset, limit) }}
        />
      )}
    </div>
  )
}
