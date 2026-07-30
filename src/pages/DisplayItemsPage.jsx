import { useState, useEffect } from 'react'
import { Plus, Receipt, Download, X } from 'lucide-react'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import AddDisplayItemForm from './AddDisplayItemForm'
import { printFreeItemVoucher } from '../print/printFreeItemVoucher'
import {
  getDisplayItemsPaginated,
  changeDisplayItemStatus,
  getDisplayItemSuppliers,
  getDisplayItemVoucher,
} from '../api/displayItemApi'

function LKR(n) { return `LKR ${Number(n).toLocaleString('en-LK')}` }

const iconBtn = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'

const STATUS_CHIP = {
  PENDING: 'bg-amber-50 text-amber-600 border border-amber-200',
  SOLD:    'bg-green-50 text-green-700 border border-green-200',
}

// ── Display item table ───────────────────────────────────────────────────────

function DisplayItemTable({ items, onChangeStatus }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#d8d8d8] py-16 text-center">
        <p className="text-sm text-[#bbb]">No display items yet. Click "Add Item" to create your first one.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-x-auto">
      <table className="min-w-max w-full text-xs">
        <thead>
          <tr className="bg-[#14213d] text-white text-left">
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Category</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Item</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Model</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Size</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Name</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Supplier</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Price</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Qty</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Status</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={item.id}
              className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
              }`}
            >
              <td className="px-5 py-3.5 text-[#555]">{item.category}</td>
              <td className="px-5 py-3.5 font-semibold text-[#14213d]">{item.itemName}</td>
              <td className="px-5 py-3.5 text-[#555]">{item.modelName}</td>
              <td className="px-5 py-3.5 text-[#555]">{item.size || '—'}</td>
              <td className="px-5 py-3.5 text-[#555]">{item.name || '—'}</td>
              <td className="px-5 py-3.5 text-[#555]">{item.supplierName}</td>
              <td className="px-5 py-3.5 font-semibold text-[#14213d]">{LKR(item.price)}</td>
              <td className="px-5 py-3.5 text-[#555]">{item.qty}</td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CHIP[item.status] ?? ''}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <button className={iconBtn} title="Change Status" onClick={() => onChangeStatus(item)}>
                    Change Status
                  </button>
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

export default function DisplayItemsPage() {
  const [view,        setView]        = useState('list')
  const [items,       setItems]       = useState([])
  const [dialog,      setDialog]      = useState(null)
  const [offset,      setOffset]      = useState(0)
  const [limit,       setLimit]       = useState(10)
  const [total,       setTotal]       = useState(0)
  const [voucherOpen,        setVoucherOpen]        = useState(false)
  const [voucherSuppliers,   setVoucherSuppliers]   = useState([])
  const [voucherSupplierId,  setVoucherSupplierId]  = useState('')
  const [voucherGenerating,  setVoucherGenerating]  = useState(false)

  const token = localStorage.getItem('accessToken')

  async function loadItems(off = offset, lim = limit) {
    const res = await getDisplayItemsPaginated({ offset: off, limit: lim }, token)
    if (res.status === 200) {
      setItems(res.data.items ?? [])
      setTotal(res.data.total ?? 0)
    }
  }

  useEffect(() => { loadItems(offset, limit) }, [offset, limit])

  useEffect(() => {
    if (!voucherOpen) return
    getDisplayItemSuppliers(token).then(res => setVoucherSuppliers(res.data?.suppliers ?? []))
  }, [voucherOpen])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.floor(offset / limit) + 1
  const from = total === 0 ? 0 : offset + 1
  const to   = Math.min(offset + limit, total)

  const confirm     = (message, onConfirm) => setDialog({ message, onConfirm })
  const closeDialog = () => setDialog(null)

  function handleBack() {
    setView('list')
    loadItems(offset, limit)
  }

  function handleChangeStatus(item) {
    const next = item.status === 'PENDING' ? 'SOLD' : 'PENDING'
    confirm(`Mark this item as ${next === 'SOLD' ? 'Sold' : 'Pending'}?`, async () => {
      const res = await changeDisplayItemStatus(item.id, token)
      if (res.status === 200) {
        loadItems(offset, limit)
      } else {
        alert(res.message || 'Failed to change status')
      }
    })
  }

  async function handleVoucherExport() {
    if (!voucherSupplierId) return
    setVoucherGenerating(true)
    try {
      const res = await getDisplayItemVoucher({ supplierId: Number(voucherSupplierId) }, token)
      if (res.status === 200) {
        printFreeItemVoucher(res.data)
        setVoucherOpen(false)
      } else {
        alert(res.message || 'Failed to generate voucher')
      }
    } finally {
      setVoucherGenerating(false)
    }
  }

  if (view === 'form') return (
    <div className="p-8">
      <AddDisplayItemForm onBack={handleBack} />
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#14213d]">Display Items</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setVoucherOpen(true)}>
            <Receipt size={15} className="mr-1.5" />
            Payment Voucher
          </Button>
          <Button onClick={() => setView('form')}>
            <Plus size={15} className="mr-1.5" />
            Add Item
          </Button>
        </div>
      </div>

      <DisplayItemTable items={items} onChangeStatus={handleChangeStatus} />

      {/* Pagination bar */}
      <div className="flex items-center justify-between px-1 pt-4 text-xs text-[#666]">
        <span>
          {total === 0 ? 'No items' : `Showing ${from}–${to} of ${total} item${total !== 1 ? 's' : ''}`}
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

      {dialog && (
        <ConfirmDialog
          message={dialog.message}
          onConfirm={() => { dialog.onConfirm(); closeDialog() }}
          onCancel={closeDialog}
        />
      )}

      {voucherOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => setVoucherOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-[#14213d] px-6 py-4 flex items-center justify-between">
                <span className="text-white font-semibold text-sm">Payment Voucher</span>
                <button onClick={() => setVoucherOpen(false)} className="text-[#6b7a99] hover:text-white transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#555] uppercase tracking-wider">Supplier <span className="text-red-400">*</span></label>
                  <select
                    className="border border-[#d8d8d8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#14213d] cursor-pointer"
                    value={voucherSupplierId}
                    onChange={e => setVoucherSupplierId(e.target.value)}
                  >
                    <option value="">Select supplier…</option>
                    {voucherSuppliers.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#e5e5e5]">
                <button onClick={() => setVoucherOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] transition-colors cursor-pointer">
                  Cancel
                </button>
                <Button onClick={handleVoucherExport} disabled={voucherGenerating || !voucherSupplierId}>
                  {voucherGenerating ? 'Generating…' : <><Download size={14} className="mr-1.5" />Export</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
