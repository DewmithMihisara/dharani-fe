import { useState } from 'react'
import { Plus, Eye, Pencil, Printer, ClipboardList, Truck, Receipt, Trash2, X } from 'lucide-react'
import Button from '../components/Button'
import Badge from '../components/Badge'
import NewOrderForm from './NewOrderForm'
import rawOrders from '../data/orders.json'

const STATUS_VARIANT = {
  APPROVAL_PROCESSING: 'approval',
  ORDER_PROCESSING:    'processing',
  ON_DELIVERY:         'delivery',
  DELIVERED:           'delivered',
  REJECTED:            'rejected',
}

const STATUS_LABELS = {
  APPROVAL_PROCESSING: 'Approval Processing',
  ORDER_PROCESSING:    'Order Processing',
  ON_DELIVERY:         'On Delivery',
  DELIVERED:           'Delivered',
  REJECTED:            'Rejected',
}

const EDIT_STATUSES     = new Set(['APPROVAL_PROCESSING', 'REJECTED'])
const PO_STATUSES       = new Set(['ORDER_PROCESSING', 'ON_DELIVERY', 'DELIVERED'])
const DELIVERY_STATUSES = new Set(['ON_DELIVERY', 'DELIVERED'])

const iconBtn        = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'
const iconBtnAmber   = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#fca311] hover:bg-[#fff8ec] cursor-pointer'
const disabledBtn    = 'p-1.5 rounded-md text-[#d5d5d5] cursor-not-allowed'
const deleteBtn      = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-red-600 hover:bg-red-50 cursor-pointer'

function LKR(n) {
  return `LKR ${Number(n).toLocaleString('en-LK')}`
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg px-6 py-5 w-80">
        <p className="text-sm text-[#222] mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] transition-colors duration-100 cursor-pointer">
            No
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-[#14213d] text-white hover:bg-[#fca311] hover:text-[#14213d] font-medium transition-colors duration-100 cursor-pointer">
            Yes
          </button>
        </div>
      </div>
    </div>
  )
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

// ── Order detail modal ────────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose, onSave }) {
  const [newStatus,     setNewStatus]     = useState(order.status)
  const [remark,        setRemark]        = useState('')
  const [isPartial,     setIsPartial]     = useState(false)
  const [partialAmount, setPartialAmount] = useState('')
  const [confirmMsg,    setConfirmMsg]    = useState(null)

  const o = order

  function handleSaveClick() {
    if (!remark.trim()) return
    let msg = `Update ${o.id} status to "${STATUS_LABELS[newStatus]}"?`
    if (isPartial && partialAmount)
      msg += ` Partial payment of ${LKR(partialAmount)} will be recorded.`
    setConfirmMsg(msg)
  }

  function handleConfirm() {
    onSave({
      newStatus,
      remark: remark.trim(),
      partialAmount: isPartial && partialAmount ? Number(partialAmount) : null,
    })
    setRemark('')
    setIsPartial(false)
    setPartialAmount('')
    setConfirmMsg(null)
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#000] focus:outline-none focus:border-[#14213d] transition-colors duration-100'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {confirmMsg && (
        <ConfirmDialog
          message={confirmMsg}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmMsg(null)}
        />
      )}

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#f0f0f0] rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden">

        {/* Header */}
        <div className="sticky top-4 z-10 bg-[#14213d] rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-base">{o.id}</span>
            <Badge variant={STATUS_VARIANT[o.status]} />
            <span className="text-[#6b7a99] text-xs">{o.date}</span>
          </div>
          <button onClick={onClose} className="text-[#6b7a99] hover:text-white transition-colors duration-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4">

          {/* ① Customer Details — 2-col */}
          <div className="grid grid-cols-[3fr_2fr] gap-3">
            {/* Left */}
            <DetailSection title="Customer Details">
              <SubGroup title="Employment" cols={3}>
                <Field label="Company Name"             value={o.companyName} />
                <Field label="Employee ID"              value={o.employeeId} />
                <Field label="Employment Start Date"    value={o.employmentStartDate} />
                <Field label="Department & Designation" value={o.departmentAndDesignation} />
              </SubGroup>
              <SubGroup title="Personal Information" cols={3}>
                <Field label="Full Name"      value={o.fullName} />
                <Field label="NIC Number"     value={o.nicNumber} />
                <Field label="Date of Birth"  value={o.dateOfBirth} />
                <Field label="Marital Status" value={o.maritalStatus} />
                <Field label="Nationality"    value={o.nationality} />
                {o.spouseName          && <Field label="Spouse Name"    value={o.spouseName} />}
                {o.spouseContactNumber && <Field label="Spouse Contact" value={o.spouseContactNumber} />}
              </SubGroup>
              <SubGroup title="Contact Details" cols={3}>
                <Field label="Mobile Number"   value={o.mobileNumber} />
                <Field label="Landline Number" value={o.landlineNumber} />
                <Field label="Email Address"   value={o.emailAddress} />
              </SubGroup>
              <SubGroup title="Financial" cols={3}>
                <Field label="Expected Income" value={o.expectedIncome ? LKR(o.expectedIncome) : ''} />
                <Field label="Payment Method"  value={o.paymentMethod} />
              </SubGroup>
              <SubGroup title="Address" cols={3}>
                <Field label="Nearest Post Office" value={o.nearestPostOffice} />
                <Field label="Main City"           value={o.mainCity} />
                <div className="col-span-3 grid grid-cols-2 gap-x-5 gap-y-2.5">
                  <AddressField label="Permanent Address" p1={o.permanentAddress1} p2={o.permanentAddress2} p3={o.permanentAddress3} p4={o.permanentAddress4} />
                  <AddressField label="Postal Address"    p1={o.postalAddress1}    p2={o.postalAddress2}    p3={o.postalAddress3}    p4={o.postalAddress4} />
                  {o.routeDirectionDescription && (
                    <div className="col-span-2"><Field label="Route / Directions" value={o.routeDirectionDescription} /></div>
                  )}
                </div>
              </SubGroup>
              {o.otherNotes && (
                <SubGroup title="Other" cols={1}>
                  <Field label="Special Notes" value={o.otherNotes} />
                </SubGroup>
              )}
            </DetailSection>

            {/* Right */}
            <div className="flex flex-col gap-3">
              <DetailSection title="Relative Details">
                <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                  <Field label="Full Name"          value={o.relativeFullName} />
                  <Field label="Relationship"       value={o.relativeRelationship} />
                  <Field label="Mobile Number"      value={o.relativeMobileNumber} />
                  <Field label="Landline Number"    value={o.relativeLandlineNumber} />
                  <Field label="Alternative Number" value={o.relativeAlternativeNumber} />
                  <div className="col-span-2">
                    <AddressField label="Permanent Address" p1={o.relativePermanentAddress1} p2={o.relativePermanentAddress2} p3={o.relativePermanentAddress3} p4={o.relativePermanentAddress4} />
                  </div>
                </div>
              </DetailSection>
              <DetailSection title="Guarantor 1">
                <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                  <Field label="Employee ID"         value={o.g1_employeeId} />
                  <Field label="Full Name"           value={o.g1_fullName} />
                  <Field label="NIC Number"          value={o.g1_nicNumber} />
                  <Field label="Mobile Number"       value={o.g1_mobileNumber} />
                  <Field label="Landline Number"     value={o.g1_landlineNumber} />
                  <Field label="Nearest Post Office" value={o.g1_nearestPostOffice} />
                  <Field label="Nearest Main City"   value={o.g1_nearestMainCity} />
                  <div className="col-span-2 grid grid-cols-2 gap-x-5 gap-y-2.5">
                    <AddressField label="Permanent Address" p1={o.g1_permanentAddress1} p2={o.g1_permanentAddress2} p3={o.g1_permanentAddress3} p4={o.g1_permanentAddress4} />
                    <AddressField label="Postal Address"    p1={o.g1_postalAddress1}    p2={o.g1_postalAddress2}    p3={o.g1_postalAddress3}    p4={o.g1_postalAddress4} />
                  </div>
                </div>
              </DetailSection>
              <DetailSection title="Guarantor 2">
                <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                  <Field label="Employee ID"         value={o.g2_employeeId} />
                  <Field label="Full Name"           value={o.g2_fullName} />
                  <Field label="NIC Number"          value={o.g2_nicNumber} />
                  <Field label="Mobile Number"       value={o.g2_mobileNumber} />
                  <Field label="Landline Number"     value={o.g2_landlineNumber} />
                  <Field label="Nearest Post Office" value={o.g2_nearestPostOffice} />
                  <Field label="Nearest Main City"   value={o.g2_nearestMainCity} />
                  <div className="col-span-2 grid grid-cols-2 gap-x-5 gap-y-2.5">
                    <AddressField label="Permanent Address" p1={o.g2_permanentAddress1} p2={o.g2_permanentAddress2} p3={o.g2_permanentAddress3} p4={o.g2_permanentAddress4} />
                    <AddressField label="Postal Address"    p1={o.g2_postalAddress1}    p2={o.g2_postalAddress2}    p3={o.g2_postalAddress3}    p4={o.g2_postalAddress4} />
                  </div>
                </div>
              </DetailSection>
            </div>
          </div>

          {/* ② Items */}
          {o.items && o.items.length > 0 && (
            <DetailSection title="Items">
              <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f5f5f5] text-[#555] text-left">
                      <th className="px-4 py-2.5 font-medium">Item Name</th>
                      <th className="px-4 py-2.5 font-medium">Model</th>
                      <th className="px-4 py-2.5 font-medium">Value</th>
                      <th className="px-4 py-2.5 font-medium">Duration</th>
                      <th className="px-4 py-2.5 font-medium">Monthly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((item, i) => (
                      <tr key={item.code} className={`border-t border-[#ebebeb] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                        <td className="px-4 py-3 text-[#222] font-medium">{item.item_name}</td>
                        <td className="px-4 py-3 text-[#666]">{item.model}</td>
                        <td className="px-4 py-3 text-[#444]">{LKR(item.item_value)}</td>
                        <td className="px-4 py-3 text-[#555]">{item.duration_months} months</td>
                        <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR(Math.ceil(item.item_value / item.duration_months))}</td>
                      </tr>
                    ))}
                  </tbody>
                  {o.items.length > 1 && (
                    <tfoot>
                      <tr className="border-t-2 border-[#e5e5e5] bg-[#f9f9f9]">
                        <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-[#555] uppercase tracking-wide">Totals</td>
                        <td className="px-4 py-3 font-bold text-[#14213d]">{LKR(o.items.reduce((s, i) => s + i.item_value, 0))}</td>
                        <td />
                        <td className="px-4 py-3 font-bold text-[#14213d]">{LKR(o.items.reduce((s, i) => s + Math.ceil(i.item_value / i.duration_months), 0))}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </DetailSection>
          )}

          {/* ③ Update Status */}
          <DetailSection title="Update Status">
            <div className="grid grid-cols-[1fr_2fr] gap-4 items-start">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">New Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className={inputCls + ' cursor-pointer'}
                >
                  {Object.keys(STATUS_LABELS).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">
                  Remark <span className="text-[#fca311]">*</span>
                </label>
                <textarea
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  rows={2}
                  placeholder="Enter a remark for this status update..."
                  className={inputCls + ' resize-none placeholder-[#bbb]'}
                />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPartial}
                    onChange={e => setIsPartial(e.target.checked)}
                    className="w-4 h-4 rounded border-[#d8d8d8] accent-[#14213d] cursor-pointer"
                  />
                  <span className="text-sm text-[#333]">Partial Payment</span>
                </label>
                {isPartial && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#555]">LKR</span>
                    <input
                      type="number"
                      value={partialAmount}
                      onChange={e => setPartialAmount(e.target.value)}
                      placeholder="Enter amount"
                      min={0}
                      className="px-3 py-2 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#000] focus:outline-none focus:border-[#14213d] transition-colors duration-100 w-44 placeholder-[#bbb]"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleSaveClick}
                disabled={!remark.trim()}
                className="px-5 py-2.5 rounded-lg bg-[#14213d] text-white text-sm font-medium hover:bg-[#fca311] hover:text-[#14213d] transition-colors duration-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Status Update
              </button>
            </div>
          </DetailSection>

          {/* ④ Order History */}
          {o.history && o.history.length > 0 && (
            <DetailSection title="Order History">
              <div className="flex flex-col">
                {o.history.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${i === 0 ? 'bg-[#fca311]' : 'bg-[#ccc]'}`} />
                      {i < o.history.length - 1 && <div className="w-px flex-1 bg-[#e5e5e5] my-1" />}
                    </div>
                    <div className={`pb-4 ${i === o.history.length - 1 ? 'pb-0' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={STATUS_VARIANT[entry.status]} />
                        <span className="text-xs text-[#aaa]">{entry.date}</span>
                      </div>
                      <p className="text-sm text-[#444] leading-relaxed">{entry.remark}</p>
                    </div>
                  </div>
                ))}
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

function ActionButtons({ order, onView }) {
  const [dialog, setDialog] = useState(null)
  const { id: orderId, status } = order

  const canEdit      = EDIT_STATUSES.has(status)
  const showPO       = PO_STATUSES.has(status)
  const showDelivery = DELIVERY_STATUSES.has(status)
  const hasPartial   = order.partialPayment !== null && order.partialPayment !== undefined

  const confirm = (message, onConfirm) => setDialog({ message, onConfirm })
  const close   = () => setDialog(null)

  return (
    <>
      {dialog && (
        <ConfirmDialog
          message={dialog.message}
          onConfirm={() => { dialog.onConfirm(); close() }}
          onCancel={close}
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
          onClick={() => canEdit && confirm(`Edit order ${orderId}?`, () => {})}
        >
          <Pencil size={15} />
        </button>
        <button
          className={iconBtn}
          title="Print Singer Finance Form"
          onClick={() => confirm(`Print Singer Finance form for ${orderId}?`, () => {})}
        >
          <Printer size={15} />
        </button>
        <button
          className={showPO ? iconBtn : disabledBtn}
          title="Print Purchase Order"
          disabled={!showPO}
          onClick={() => showPO && confirm(`Print Purchase Order for ${orderId}?`, () => {})}
        >
          <ClipboardList size={15} />
        </button>
        <button
          className={showDelivery ? iconBtn : disabledBtn}
          title="Print Delivery Order"
          disabled={!showDelivery}
          onClick={() => showDelivery && confirm(`Print Delivery Order for ${orderId}?`, () => {})}
        >
          <Truck size={15} />
        </button>
        {hasPartial && (
          <button
            className={iconBtnAmber}
            title="Print Partial Invoice"
            onClick={() => confirm(`Print Partial Invoice for ${orderId}?`, () => {})}
          >
            <Receipt size={15} />
          </button>
        )}
        <button
          className={deleteBtn}
          title="Delete Order"
          onClick={() => confirm(`Delete order ${orderId}? This cannot be undone.`, () => {})}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </>
  )
}

// ── Orders table ──────────────────────────────────────────────────────────────

function OrdersTable({ orders, onView }) {
  return (
    <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#14213d] text-white text-left">
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Order No.</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Employee ID</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Status</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Date</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr
              key={order.id}
              className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
              }`}
            >
              <td className="px-5 py-3.5 font-semibold text-[#14213d]">{order.id}</td>
              <td className="px-5 py-3.5 text-[#555]">{order.employeeId}</td>
              <td className="px-5 py-3.5">
                <Badge variant={STATUS_VARIANT[order.status]} />
              </td>
              <td className="px-5 py-3.5 text-[#666]">{order.date}</td>
              <td className="px-5 py-3.5">
                <ActionButtons order={order} onView={onView} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [view,      setView]      = useState('list')
  const [orders,    setOrders]    = useState(rawOrders)
  const [viewOrder, setViewOrder] = useState(null)

  function handleSave({ newStatus, remark, partialAmount }) {
    const today = new Date().toISOString().slice(0, 10)
    const entry = { date: today, status: newStatus, remark }
    const update = o => ({
      ...o,
      status: newStatus,
      history: [entry, ...o.history],
      partialPayment: partialAmount != null ? { amount: partialAmount } : o.partialPayment,
    })
    setOrders(prev => prev.map(o => o.id === viewOrder.id ? update(o) : o))
    setViewOrder(prev => update(prev))
  }

  return (
    <div className="p-8">
      {viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onSave={handleSave}
        />
      )}

      {view === 'list' ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-[#14213d]">Orders</h1>
            <Button onClick={() => setView('form')}>
              <Plus size={15} className="mr-1.5" />
              Add New Order
            </Button>
          </div>
          <OrdersTable orders={orders} onView={setViewOrder} />
        </>
      ) : (
        <NewOrderForm onBack={() => setView('list')} />
      )}
    </div>
  )
}
