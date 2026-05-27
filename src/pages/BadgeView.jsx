import { useState } from 'react'
import { X } from 'lucide-react'
import Button from '../components/Button'
import { approveBadge } from '../api/inventoryApi'

function LKR(n) { return `LKR ${Number(n).toLocaleString('en-LK')}` }

const HEADER_CHIP = {
  PENDING:  'bg-amber-400/20 text-amber-300 border border-amber-400/30',
  APPROVED: 'bg-green-400/20 text-green-300 border border-green-400/30',
  ENDED:    'bg-white/10 text-white/50 border border-white/20',
}

const th = 'sticky top-0 bg-[#14213d] px-3 py-3 font-medium whitespace-nowrap text-left'

export default function BadgeView({ badge, onClose, onApprove }) {
  const [approving, setApproving] = useState(false)

  async function handleApprove() {
    setApproving(true)
    try {
      const token = localStorage.getItem('accessToken')
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
                {badge.items.length} item{badge.items.length !== 1 ? 's' : ''}
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
          {badge.items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#bbb]">No items in this badge.</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[70vh]">
              <table className="min-w-max w-full text-sm border-collapse">
                <thead>
                  <tr className="text-white text-xs">
                    <th className={`${th} w-10 text-center`}>#</th>
                    <th className={th}>Category</th>
                    <th className={th}>Item</th>
                    <th className={th}>Model</th>
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
                  {badge.items.map((e, i) => (
                    <tr
                      key={e.id}
                      className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
                      }`}
                    >
                      <td className="px-3 py-2 text-center text-xs text-[#ccc] font-medium">{i + 1}</td>
                      <td className="px-3 py-2 text-[#555]">{e.category}</td>
                      <td className="px-3 py-2 font-semibold text-[#14213d] whitespace-nowrap">{e.itemName}</td>
                      <td className="px-3 py-2 text-[#555]">{e.modelName}</td>
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
