import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Button from '../components/Button'
import { approveBadge, getItemsByBadge } from '../api/inventoryApi'

function LKR(n) { return `LKR ${Number(n).toLocaleString('en-LK')}` }

const HEADER_CHIP = {
  PENDING:  'bg-amber-400/20 text-amber-300 border border-amber-400/30',
  APPROVED: 'bg-green-400/20 text-green-300 border border-green-400/30',
  ENDED:    'bg-white/10 text-white/50 border border-white/20',
}

const th = 'sticky top-0 bg-[#14213d] px-3 py-3 font-medium whitespace-nowrap text-left'

export default function BadgeView({ badge, onClose, onApprove }) {
  const [approving, setApproving] = useState(false)
  const [items,     setItems]     = useState([])
  const [total,     setTotal]     = useState(0)
  const [offset,    setOffset]    = useState(0)
  const [limit,     setLimit]     = useState(10)
  const [loading,   setLoading]   = useState(false)

  const token = localStorage.getItem('accessToken')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await getItemsByBadge(badge.id, { offset, limit }, token)
        if (res.status === 200) {
          setItems(res.data.items ?? [])
          setTotal(res.data.total ?? 0)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [badge.id, offset, limit])

  const totalPages  = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.floor(offset / limit) + 1
  const fromItem    = total === 0 ? 0 : offset + 1
  const toItem      = Math.min(offset + limit, total)

  async function handleApprove() {
    setApproving(true)
    try {
      const res = await approveBadge(badge.id, token)
      if (res.status === 200) onApprove(badge.id)
      else alert(res.message || 'Failed to approve badge')
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#f0f0f0] rounded-2xl shadow-2xl w-full max-w-[95vw] overflow-hidden">

          {/* Header */}
          <div className="bg-[#14213d] rounded-t-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-base">Badge {badge.badgeNumber}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${HEADER_CHIP[badge.status]}`}>
                {badge.status}
              </span>
              <span className="text-[#6b7a99] text-xs">
                {total} item{total !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-[#6b7a99] hover:text-white transition-colors duration-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          {loading && total === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#bbb]">Loading…</p>
            </div>
          ) : total === 0 && !loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#bbb]">No items in this badge.</p>
            </div>
          ) : (
            <>
              <div className="overflow-auto max-h-[60vh]">
                <table className="min-w-max w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-white text-xs">
                      <th className={`${th} w-10 text-center`}>#</th>
                      <th className={th}>Category</th>
                      <th className={th}>Item</th>
                      <th className={th}>Model</th>
                      <th className={th}>Name</th>
                      <th className={th}>Size</th>
                      <th className={th}>Transfer Price</th>
                      <th className={th}>Admin Cost</th>
                      <th className={th}>S&amp;P</th>
                      <th className={th}>Transport</th>
                      <th className={th}>Total Cost</th>
                      <th className={th}>Price</th>
                      <th className={th}>6M</th>
                      <th className={th}>12M</th>
                      <th className={th}>18M</th>
                      <th className={th}>24M</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={16} className="px-3 py-6 text-center text-sm text-[#bbb]">Loading…</td>
                      </tr>
                    ) : items.map((e, i) => (
                      <tr
                        key={e.id}
                        className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                          i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
                        }`}
                      >
                        <td className="px-3 py-2 text-center text-xs text-[#ccc] font-medium">{offset + i + 1}</td>
                        <td className="px-3 py-2 text-[#555]">{e.category}</td>
                        <td className="px-3 py-2 font-semibold text-[#14213d] whitespace-nowrap">{e.itemName}</td>
                        <td className="px-3 py-2 text-[#555]">{e.modelName}</td>
                        <td className="px-3 py-2 text-[#555]">{e.name || '—'}</td>
                        <td className="px-3 py-2 text-[#555]">{e.size || '—'}</td>
                        <td className="px-3 py-2 text-[#444] whitespace-nowrap">{LKR(e.transferPrice)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[#444]">{LKR(e.adminCost)}</div>
                          <div className="text-[10px] text-[#999]">{e.adminCostPct}%</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[#444]">{LKR(e.salesAndPromotion)}</div>
                          <div className="text-[10px] text-[#999]">{e.salesAndPromotionPct}%</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[#444]">{LKR(e.transport)}</div>
                          <div className="text-[10px] text-[#999]">{e.transportPct}%</div>
                        </td>
                        <td className="px-3 py-2 font-semibold text-[#14213d] whitespace-nowrap">{LKR(e.totalCost)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="font-bold text-[#14213d]">{LKR(e.price)}</div>
                          <div className="text-[10px] text-[#999]">Tax {e.taxPct}%</div>
                        </td>
                        <td className="px-3 py-2 text-[#555]">{e.month6  || '—'}</td>
                        <td className="px-3 py-2 text-[#555]">{e.month12 || '—'}</td>
                        <td className="px-3 py-2 text-[#555]">{e.month18 || '—'}</td>
                        <td className="px-3 py-2 text-[#555]">{e.month24 || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e5e5] bg-white text-xs text-[#666]">
                <span>
                  {total === 0 ? 'No items' : `Showing ${fromItem}–${toItem} of ${total} item${total !== 1 ? 's' : ''}`}
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
            </>
          )}

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-[#e5e5e5] flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-sm text-[#888] hover:text-[#14213d] cursor-pointer transition-colors duration-100"
            >
              Close
            </button>
            {badge.status === 'PENDING' && (
              <Button type="button" disabled={approving} onClick={handleApprove}>
                {approving ? 'Approving…' : 'Approve'}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
