import { useState, useEffect, Fragment } from 'react'
import { Plus, Eye, Pencil, ClipboardList, Truck, Trash2, X, Search } from 'lucide-react'
import Button from '../components/Button'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import OrderSavedDialog from '../components/OrderSavedDialog'
import NewRetailOrderForm from './NewRetailOrderForm'
import { getAllOrdersPaginated, getOrderById, deleteOrder, updateOrderStatus } from '../api/retailOrderApi'
import { printRetailPurchaseOrder } from '../print/printRetailPurchaseOrder'
import { printRetailDeliveryNote } from '../print/printRetailDeliveryNote'

const STATUS_VARIANT = {
  APPROVED:      'approved',
  IN_PRODUCTION: 'processing',
  ON_DELIVERY:   'delivery',
  DELIVERED:     'delivered',
  CANCELED:      'canceled',
}

const STATUS_LABELS = {
  APPROVED:      'Approved',
  IN_PRODUCTION: 'In Production',
  ON_DELIVERY:   'On Delivery',
  DELIVERED:     'Delivered',
  CANCELED:      'Cancelled',
}

// Retail order status transition rules (mirrored on the backend RetailOrderServiceImpl).
// No APPROVAL_PROCESSING / NOT_APPROVED — retail orders are created already APPROVED.
const MAIN_PIPELINE    = ['APPROVED', 'IN_PRODUCTION', 'ON_DELIVERY', 'DELIVERED']
const CANCELLABLE_FROM = new Set(['APPROVED', 'IN_PRODUCTION', 'ON_DELIVERY'])
const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELED'])

function isRemarkRequired(from, to) {
  const fi = MAIN_PIPELINE.indexOf(from), ti = MAIN_PIPELINE.indexOf(to)
  if (fi < 0 || ti < 0) return true
  return ti !== fi + 1
}

const STATUS_TABS = [null, 'APPROVED', 'IN_PRODUCTION', 'ON_DELIVERY', 'DELIVERED', 'CANCELED']

const EDIT_STATUSES     = new Set(['APPROVED'])
const PO_STATUSES       = new Set(['IN_PRODUCTION', 'ON_DELIVERY', 'DELIVERED'])
const DELIVERY_STATUSES = new Set(['ON_DELIVERY', 'DELIVERED'])

const iconBtn     = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'
const disabledBtn = 'p-1.5 rounded-md text-[#d5d5d5] cursor-not-allowed'
const deleteBtn   = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-red-600 hover:bg-red-50 cursor-pointer'

function LKR(n) {
  return `LKR ${Number(n).toLocaleString('en-LK')}`
}

// ── Detail modal helpers ──────────────────────────────────────────────────────

function Field({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">{label}</span>
      <span className="text-sm text-[#222]">{value}</span>
    </div>
  )
}

function AddressField({ label, p1, p2, p3, p4 }) {
  const lines = [p1, p2, p3, p4].filter(Boolean)
  if (!lines.length) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">{label}</span>
      <span className="text-sm text-[#222] leading-relaxed">{lines.join(', ')}</span>
    </div>
  )
}

function DetailSection({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#14213d]">
        <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">{title}</h3>
      </div>
      <div className="p-4 flex flex-col gap-4">{children}</div>
    </div>
  )
}

const GRID_COLS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }

function SubGroup({ title, cols = 3, children }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[9px] font-bold text-[#bbb] uppercase tracking-widest border-b border-[#f0f0f0] pb-1">{title}</p>
      <div className={`grid ${GRID_COLS[cols] ?? 'grid-cols-3'} gap-x-5 gap-y-2.5`}>{children}</div>
    </div>
  )
}

// ── Order Status Section ──────────────────────────────────────────────────────

const ALL_STATUS_OPTIONS = [
  { value: 'APPROVED',      label: 'APPROVED',      active: 'border-green-500 bg-green-50 text-green-600',    hover: 'hover:border-green-400 hover:text-green-500'  },
  { value: 'IN_PRODUCTION', label: 'IN PRODUCTION', active: 'border-blue-500 bg-blue-50 text-blue-700',       hover: 'hover:border-blue-400 hover:text-blue-600'    },
  { value: 'ON_DELIVERY',   label: 'ON DELIVERY',   active: 'border-orange-500 bg-orange-50 text-orange-700', hover: 'hover:border-orange-400 hover:text-orange-600' },
  { value: 'DELIVERED',     label: 'DELIVERED',     active: 'border-green-500 bg-green-50 text-green-700',    hover: 'hover:border-green-400 hover:text-green-600'  },
  { value: 'CANCELED',      label: 'CANCELLED',     active: 'border-[#6b7280] bg-[#e5e7eb] text-[#4b5563]',  hover: 'hover:border-[#9ca3af] hover:text-[#6b7280]'  },
]

function RetailOrderStatusSection({ o, token, onSaved }) {
  const [selected, setSelected] = useState(null)
  const [statusRemark, setStatusRemark] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPrintPoDialog, setShowPrintPoDialog] = useState(false)
  const [showPrintDeliveryDialog, setShowPrintDeliveryDialog] = useState(false)
  const [deliveryVehicle, setDeliveryVehicle] = useState('')
  const [meterStart, setMeterStart] = useState('')
  const [driverName, setDriverName] = useState('')
  const [meterEnd, setMeterEnd] = useState('')

  const options = ALL_STATUS_OPTIONS.filter(opt =>
    opt.value !== o.status &&
    (opt.value !== 'CANCELED' || CANCELLABLE_FROM.has(o.status))
  )

  const deliveryFieldsMissing =
    selected === 'DELIVERED' &&
    (!deliveryVehicle.trim() || !meterStart.trim() || !driverName.trim() || !meterEnd.trim())

  const remarkRequired = !!selected && isRemarkRequired(o.status, selected)

  async function handleSave() {
    if (!selected || deliveryFieldsMissing || (remarkRequired && !statusRemark.trim())) return
    setSaving(true)
    const body = { status: selected, remark: statusRemark }
    if (selected === 'DELIVERED') {
      body.vehicleNumber = deliveryVehicle
      body.meterStart = meterStart
      body.driverName = driverName
      body.meterEnd = meterEnd
    }
    await updateOrderStatus(o.orderId, body, token)
    setSaving(false)
    onSaved()
    if (selected === 'IN_PRODUCTION') setShowPrintPoDialog(true)
    if (selected === 'ON_DELIVERY')   setShowPrintDeliveryDialog(true)
  }

  return (
    <>
      {showPrintPoDialog && (
        <OrderSavedDialog
          orderCode={o.id}
          title="Status saved successfully!"
          message="Do you want to print the Purchase Order?"
          onPrint={() => { setShowPrintPoDialog(false); printRetailPurchaseOrder(o.orderId, token) }}
          onClose={() => setShowPrintPoDialog(false)}
        />
      )}
      {showPrintDeliveryDialog && (
        <OrderSavedDialog
          orderCode={o.id}
          title="Status saved successfully!"
          message="Do you want to print the Delivery Note?"
          onPrint={() => { setShowPrintDeliveryDialog(false); printRetailDeliveryNote(o.orderId, token) }}
          onClose={() => setShowPrintDeliveryDialog(false)}
        />
      )}
      <DetailSection title="Order Status">
        <div className="flex flex-col gap-4">
          {TERMINAL_STATUSES.has(o.status) ? (
            <p className="text-sm text-[#aaa] italic">Order is {STATUS_LABELS[o.status]?.toLowerCase()}. No further status changes allowed.</p>
          ) : (<>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-[#555]">Set Status</p>
            <div className="flex gap-3 flex-wrap">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSelected(opt.value); setStatusRemark('') }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    selected === opt.value
                      ? opt.active
                      : `border-[#ddd] text-[#999] ${opt.hover}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {selected === 'DELIVERED' && (
            <div className="grid grid-cols-4 gap-3 border-t border-[#f0f0f0] pt-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">Delivery Vehicle No. <span className="text-red-400">*</span></label>
                <input
                  className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#333] focus:outline-none focus:border-[#14213d]"
                  value={deliveryVehicle}
                  onChange={e => setDeliveryVehicle(e.target.value)}
                  placeholder="e.g. WP CAB-1234"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">Meter Start Reading <span className="text-red-400">*</span></label>
                <input
                  className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#333] focus:outline-none focus:border-[#14213d]"
                  value={meterStart}
                  onChange={e => setMeterStart(e.target.value)}
                  placeholder="e.g. 12450"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">Driver Name <span className="text-red-400">*</span></label>
                <input
                  className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#333] focus:outline-none focus:border-[#14213d]"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="Driver full name"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">Meter End Reading <span className="text-red-400">*</span></label>
                <input
                  className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#333] focus:outline-none focus:border-[#14213d]"
                  value={meterEnd}
                  onChange={e => setMeterEnd(e.target.value)}
                  placeholder="e.g. 12680"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">Remark {remarkRequired && <span className="text-red-400">*</span>}</label>
            <textarea
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#333] resize-none focus:outline-none focus:border-[#14213d]"
              rows={2}
              value={statusRemark}
              onChange={e => setStatusRemark(e.target.value)}
              placeholder="Enter remark..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!selected || saving || deliveryFieldsMissing || (remarkRequired && !statusRemark.trim())}
              className="px-5 py-2 rounded-lg bg-[#14213d] text-white text-xs font-semibold hover:bg-[#1e2f5a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          </>)}
        </div>
      </DetailSection>
    </>
  )
}

// ── Order detail modal ────────────────────────────────────────────────────────

function RetailOrderDetailModal({ order, token, onRefresh, onClose }) {
  const o = order

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#f0f0f0] rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden">

        {/* Header */}
        <div className="sticky top-4 z-10 bg-[#14213d] rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-base">{o.id}</span>
            <Badge variant={STATUS_VARIANT[o.status]} label={STATUS_LABELS[o.status]} />
            <span className="text-[#6b7a99] text-xs">{o.date}</span>
          </div>
          <button onClick={onClose} className="text-[#6b7a99] hover:text-white transition-colors duration-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4">

          {/* ① Order Status Section */}
          <RetailOrderStatusSection o={o} token={token} onSaved={onRefresh} />

          {/* ② Customer Details */}
          <DetailSection title="Customer Details">
            {(o.branchName || o.employeeId) && (
              <SubGroup title="Employment" cols={3}>
                <Field label="Company Name" value={o.companyName} />
                <Field label="Branch"       value={o.branchName} />
                <Field label="Employee ID"  value={o.employeeId} />
              </SubGroup>
            )}
            <SubGroup title="Personal Information" cols={3}>
              <Field label="Title"                 value={o.title} />
              <Field label="Surname"               value={o.surname} />
              <Field label="Other Names"           value={o.otherNames} />
              <Field label="Full Name w/ Initials" value={o.fullNameWithInitials} />
              <Field label="NIC Number"            value={o.nicNumber} />
            </SubGroup>
            <SubGroup title="Contact Details" cols={3}>
              <Field label="Mobile Number 1" value={o.mobileNumber1} />
              <Field label="Mobile Number 2" value={o.mobileNumber2} />
            </SubGroup>
            <SubGroup title="Address" cols={3}>
              <div className="col-span-3">
                <AddressField label="Permanent Address" p1={o.permanentAddress1} p2={o.permanentAddress2} p3={o.permanentAddress3} p4={o.permanentAddress4} />
              </div>
            </SubGroup>
          </DetailSection>

          {/* ③ Catalogue Items */}
          {o.items && o.items.length > 0 && (
            <DetailSection title="Catalogue Items">
              <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f5f5f5] text-[#555] text-left">
                      <th className="px-4 py-2.5 font-medium">Item</th>
                      <th className="px-4 py-2.5 font-medium">Model</th>
                      <th className="px-4 py-2.5 font-medium text-center">Qty</th>
                      <th className="px-4 py-2.5 font-medium text-center">Discount</th>
                      <th className="px-4 py-2.5 font-medium">Price After Discount</th>
                      <th className="px-4 py-2.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((item, i) => {
                      const rowCls = `border-t border-[#ebebeb] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`
                      const qty             = item.qty || 1
                      const disc            = parseFloat(item.discountPct) || 0
                      const itemValue       = Number(item.item_value)
                      const discountedPrice = disc > 0 ? Math.round(itemValue * (1 - disc / 100)) : itemValue
                      const priceAfterDiscount = disc > 0 ? discountedPrice : null
                      const total = discountedPrice * qty
                      return (
                        <Fragment key={i}>
                          <tr className={rowCls}>
                            <td className="px-4 py-3 text-[#222] font-medium">{item.item_name}</td>
                            <td className="px-4 py-3 text-[#666]">{item.model}</td>
                            <td className="px-4 py-3 text-center text-[#555]">{qty}</td>
                            <td className="px-4 py-3 text-center text-[#555]">{disc > 0 ? `${disc}%` : '—'}</td>
                            <td className="px-4 py-3 text-[#555]">{priceAfterDiscount != null ? LKR(priceAfterDiscount) : '—'}</td>
                            <td className="px-4 py-3 font-bold text-[#14213d]">{LKR(total)}</td>
                          </tr>
                          {item.remark && (
                            <tr className={rowCls}>
                              <td colSpan={6} className="px-4 pb-3 pt-0 text-xs text-[#888] italic">{item.remark}</td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </DetailSection>
          )}

          {/* ④ Singer Items */}
          {o.singerItems && o.singerItems.length > 0 && (
            <DetailSection title="Singer Items">
              <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f5f5f5] text-[#555] text-left">
                      <th className="px-4 py-2.5 font-medium">Item Name</th>
                      <th className="px-4 py-2.5 font-medium">Model</th>
                      <th className="px-4 py-2.5 font-medium">Value</th>
                      <th className="px-4 py-2.5 font-medium text-center">Qty</th>
                      <th className="px-4 py-2.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.singerItems.map((item, i) => {
                      const rowCls = `border-t border-[#ebebeb] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`
                      return (
                        <Fragment key={i}>
                          <tr className={rowCls}>
                            <td className="px-4 py-3 text-[#222] font-medium">{item.item_name}</td>
                            <td className="px-4 py-3 text-[#666]">{item.model}</td>
                            <td className="px-4 py-3 text-[#444]">{LKR(item.price_per_item)}</td>
                            <td className="px-4 py-3 text-center text-[#555]">{item.qty || 1}</td>
                            <td className="px-4 py-3 font-bold text-[#14213d]">{LKR(item.amount)}</td>
                          </tr>
                          {item.remark && (
                            <tr className={rowCls}>
                              <td colSpan={5} className="px-4 pb-3 pt-0 text-xs text-[#888] italic">{item.remark}</td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                  {o.singerItems.length > 1 && (
                    <tfoot>
                      <tr className="border-t-2 border-[#e5e5e5] bg-[#f9f9f9]">
                        <td colSpan={4} className="px-4 py-3 text-sm font-medium text-[#555]">Total</td>
                        <td className="px-4 py-3 font-bold text-[#14213d]">{LKR(o.singerItems.reduce((s, i) => s + (Number(i.amount) || 0), 0))}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </DetailSection>
          )}

          {/* ⑤ Delivery Details */}
          {o.delivery && (
            <DetailSection title="Delivery Details">
              <div className="grid grid-cols-4 gap-x-5 gap-y-2.5">
                <Field label="Vehicle No."    value={o.delivery.vehicleNumber} />
                <Field label="Meter Start"    value={o.delivery.meterStart} />
                {o.delivery.meterEnd   && <Field label="Meter End"    value={o.delivery.meterEnd} />}
                {o.delivery.driverName && <Field label="Driver Name"  value={o.delivery.driverName} />}
              </div>
            </DetailSection>
          )}

          {/* ⑥ Order History */}
          {o.history && o.history.length > 0 && (
            <DetailSection title="Order History">
              <div className="flex flex-col">
                {o.history.map((entry, i) => {
                  const raw = entry.date || ''
                  const [datePart, timePart] = raw.includes('T') ? raw.split('T') : [raw, '']
                  const timeFormatted = timePart ? timePart.substring(0, 5) : ''
                  const displayDateTime = timeFormatted ? `${datePart}  ${timeFormatted}` : datePart
                  return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${i === 0 ? 'bg-[#fca311]' : 'bg-[#ccc]'}`} />
                      {i < o.history.length - 1 && <div className="w-px flex-1 bg-[#e5e5e5] my-1" />}
                    </div>
                    <div className={`pb-4 ${i === o.history.length - 1 ? 'pb-0' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={STATUS_VARIANT[entry.status]} label={STATUS_LABELS[entry.status]} />
                        <span className="text-xs text-[#aaa]">{displayDateTime}</span>
                      </div>
                      <p className="text-sm text-[#444] leading-relaxed">{entry.remark}</p>
                    </div>
                  </div>
                )})}
              </div>
            </DetailSection>
          )}

        </div>
        </div>
      </div>
    </div>
  )
}

// ── Action buttons ────────────────────────────────────────────────────────────

function ActionButtons({ order, onView, onEdit, onDelete }) {
  const [dialog,      setDialog]      = useState(null)
  const [printDialog, setPrintDialog] = useState(null)
  const { id: displayId, status } = order

  const canEdit      = EDIT_STATUSES.has(status)
  const showPO       = PO_STATUSES.has(status)
  const showDelivery = DELIVERY_STATUSES.has(status)

  const confirm      = (message, onConfirm) => setDialog({ message, onConfirm })
  const close        = () => setDialog(null)
  const confirmPrint = (title, message, onPrint) => setPrintDialog({ title, message, onPrint })
  const closePrint   = () => setPrintDialog(null)

  return (
    <>
      {dialog && (
        <ConfirmDialog
          message={dialog.message}
          onConfirm={() => { dialog.onConfirm(); close() }}
          onCancel={close}
        />
      )}
      {printDialog && (
        <OrderSavedDialog
          orderCode={displayId}
          title={printDialog.title}
          message={printDialog.message}
          onPrint={() => { closePrint(); printDialog.onPrint() }}
          onClose={closePrint}
        />
      )}
      <div className="flex items-center gap-0.5 justify-end">
        <button className={iconBtn} title="View Order" onClick={() => onView(order)}>
          <Eye size={15} />
        </button>
        <button
          className={canEdit ? iconBtn : disabledBtn}
          title="Edit Order"
          disabled={!canEdit}
          onClick={() => canEdit && onEdit(order)}
        >
          <Pencil size={15} />
        </button>
        <button
          className={showPO ? iconBtn : disabledBtn}
          title="Print Purchase Order"
          disabled={!showPO}
          onClick={() => showPO && confirmPrint('Purchase Order', 'Do you want to print the Purchase Order?', () => {
            const token = localStorage.getItem('accessToken')
            printRetailPurchaseOrder(order.orderId, token)
          })}
        >
          <ClipboardList size={15} />
        </button>
        <button
          className={showDelivery ? iconBtn : disabledBtn}
          title="Print Delivery Note"
          disabled={!showDelivery}
          onClick={() => showDelivery && confirmPrint('Delivery Note', 'Do you want to print the Delivery Note?', () => {
            const token = localStorage.getItem('accessToken')
            printRetailDeliveryNote(order.orderId, token)
          })}
        >
          <Truck size={15} />
        </button>
        <button
          className={order.status === 'DELIVERED' ? disabledBtn : deleteBtn}
          title={order.status === 'DELIVERED' ? 'Cannot delete a delivered order' : 'Delete Order'}
          disabled={order.status === 'DELIVERED'}
          onClick={order.status === 'DELIVERED' ? undefined : () => confirm(`Delete order ${displayId}? This cannot be undone.`, () => onDelete(order))}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </>
  )
}

// ── Pagination bar ────────────────────────────────────────────────────────────

function PaginationBar({ offset, limit, total, onLimitChange, onPrev, onNext }) {
  const from  = total === 0 ? 0 : offset + 1
  const to    = Math.min(offset + limit, total)
  const page  = limit > 0 ? Math.floor(offset / limit) + 1 : 1
  const pages = limit > 0 ? Math.ceil(total / limit) : 1

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e5e5] bg-white text-xs text-[#666]">
      <span>{total > 0 ? `Showing ${from}–${to} of ${total} orders` : 'No orders found'}</span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[#aaa]">Rows per page:</span>
          <select
            value={limit}
            onChange={e => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 rounded-md border border-[#e5e5e5] bg-white text-xs text-[#333] focus:outline-none focus:border-[#14213d] cursor-pointer"
          >
            {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={offset === 0}
            className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            ←
          </button>
          <span className="text-[#444] font-medium">Page {page} of {pages}</span>
          <button
            onClick={onNext}
            disabled={offset + limit >= total}
            className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Orders table ──────────────────────────────────────────────────────────────

function RetailOrdersTable({ orders, onView, onEdit, onDelete }) {
  return (
    <div className="w-full overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#14213d] text-white text-left">
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Order No.</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Customer</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">NIC No.</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Status</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Date</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr
              key={order.orderId ?? order.id}
              className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
              }`}
            >
              <td className="px-5 py-3.5 font-semibold text-[#14213d]">{order.id}</td>
              <td className="px-5 py-3.5 text-[#555]">{order.customerName}</td>
              <td className="px-5 py-3.5 text-[#555]">{order.nicNumber}</td>
              <td className="px-5 py-3.5">
                <Badge variant={STATUS_VARIANT[order.status]} label={STATUS_LABELS[order.status]} />
              </td>
              <td className="px-5 py-3.5 text-[#666]">{order.date}</td>
              <td className="px-5 py-3.5">
                <ActionButtons order={order} onView={onView} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RetailPage() {
  const [view,      setView]      = useState('list')
  const [orders,    setOrders]    = useState([])
  const [viewOrder, setViewOrder] = useState(null)
  const [editOrder, setEditOrder] = useState(null)
  const [limit,      setLimit]      = useState(10)
  const [offset,     setOffset]     = useState(0)
  const [total,      setTotal]      = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusFilter, setStatusFilter] = useState(null) // null = ALL
  const [search,       setSearch]        = useState('')
  const [searchTerm,   setSearchTerm]    = useState('')

  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(search.trim()); setOffset(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  function handleSelectStatus(s) {
    setStatusFilter(s)
    setOffset(0)
  }

  const backToList = () => { setEditOrder(null); setView('list'); setRefreshKey(k => k + 1) }

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')
      const data = await getAllOrdersPaginated(
        { offset, limit, status: statusFilter, search: searchTerm },
        token,
      )
      if (data.status === 200) {
        setOrders(data.data.orders)
        setTotal(Number(data.data.total))
      }
    }
    load()
  }, [offset, limit, refreshKey, statusFilter, searchTerm])

  function handleLimitChange(newLimit) {
    setLimit(newLimit)
    setOffset(0)
  }

  function handlePrev() {
    setOffset(prev => Math.max(0, prev - limit))
  }

  function handleNext() {
    setOffset(prev => prev + limit < total ? prev + limit : prev)
  }

  async function handleView(order) {
    const token = localStorage.getItem('accessToken')
    const data = await getOrderById(order.orderId, token)
    if (data.status === 200) setViewOrder(data.data.order)
  }

  async function handleEdit(order) {
    const token = localStorage.getItem('accessToken')
    const data = await getOrderById(order.orderId, token)
    if (data.status === 200) {
      setEditOrder(data.data.order)
      setView('edit')
    }
  }

  async function handleDelete(order) {
    const token = localStorage.getItem('accessToken')
    const data = await deleteOrder(order.orderId, token)
    if (data.status === 200) setOrders(prev => prev.filter(o => o.orderId !== order.orderId))
  }

  return (
    <div className="p-8">
      {viewOrder && (
        <RetailOrderDetailModal
          order={viewOrder}
          token={localStorage.getItem('accessToken')}
          onRefresh={async () => {
            const token = localStorage.getItem('accessToken')
            const data = await getOrderById(viewOrder.orderId, token)
            if (data.status === 200) setViewOrder(data.data.order)
          }}
          onClose={() => { setViewOrder(null); setRefreshKey(k => k + 1) }}
        />
      )}

      {view === 'list' ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-[#14213d]">Retail</h1>
            <Button onClick={() => setView('form')}>
              <Plus size={15} className="mr-1.5" />
              Add New Order
            </Button>
          </div>

          {/* Status filter + search */}
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter ?? ''}
                onChange={e => handleSelectStatus(e.target.value || null)}
                className="border border-[#14213d] rounded-lg px-3 py-2 text-sm text-[#222] focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {STATUS_TABS.filter(s => s !== null).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by NIC…"
                  className="pl-9 pr-8 py-2 w-64 rounded-lg border border-[#14213d] text-sm text-[#222] focus:outline-none focus:border-[#14213d]"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#14213d] cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-[#999]">No orders match this filter.</p>
              </div>
            ) : (
              <>
                <RetailOrdersTable orders={orders} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
                <PaginationBar
                  offset={offset}
                  limit={limit}
                  total={total}
                  onLimitChange={handleLimitChange}
                  onPrev={handlePrev}
                  onNext={handleNext}
                />
              </>
            )}
          </div>
        </>
      ) : view === 'edit' ? (
        <NewRetailOrderForm
          onBack={backToList}
          initialData={editOrder}
          orderId={editOrder?.orderId}
        />
      ) : (
        <NewRetailOrderForm onBack={backToList} />
      )}
    </div>
  )
}
