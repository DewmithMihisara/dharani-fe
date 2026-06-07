import { useState, useEffect, Fragment } from 'react'
import { Plus, Eye, Pencil, Printer, ClipboardList, Truck, Receipt, Trash2, X } from 'lucide-react'
import Button from '../components/Button'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import OrderSavedDialog from '../components/OrderSavedDialog'
import NewOrderForm from './NewOrderForm'
import { getAllOrdersPaginated, getOrderById, deleteOrder, printSingerForm, printPartialInvoice, printPurchaseOrder, printDeliveryNote, updateOrderStatus, savePartialPayments } from '../api/orderApi'

const STATUS_VARIANT = {
  APPROVAL_PROCESSING: 'approval',
  APPROVED:            'approved',
  NOT_APPROVED:        'not_approved',
  ORDER_PROCESSING:    'processing',
  ON_DELIVERY:         'delivery',
  DELIVERED:           'delivered',
}

const STATUS_LABELS = {
  APPROVAL_PROCESSING: 'Approval Processing',
  APPROVED:            'Approved',
  NOT_APPROVED:        'Not Approved',
  ORDER_PROCESSING:    'Order Processing',
  ON_DELIVERY:         'On Delivery',
  DELIVERED:           'Delivered',
}

const EDIT_STATUSES     = new Set(['APPROVAL_PROCESSING', 'NOT_APPROVED'])
const PO_STATUSES       = new Set(['ORDER_PROCESSING', 'ON_DELIVERY', 'DELIVERED'])
const DELIVERY_STATUSES = new Set(['ON_DELIVERY', 'DELIVERED'])

const iconBtn        = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'
const iconBtnAmber   = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#fca311] hover:bg-[#fff8ec] cursor-pointer'
const disabledBtn    = 'p-1.5 rounded-md text-[#d5d5d5] cursor-not-allowed'
const deleteBtn      = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-red-600 hover:bg-red-50 cursor-pointer'

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

// ── Unified Order Status Section (always at top of modal) ────────────────────

const ALL_STATUS_OPTIONS = [
  { value: 'APPROVAL_PROCESSING', label: 'APPROVAL PROCESSING', active: 'border-[#a06800] bg-[#fca311]/15 text-[#a06800]',   hover: 'hover:border-[#fca311] hover:text-[#a06800]'   },
  { value: 'NOT_APPROVED',        label: 'NOT APPROVED',        active: 'border-red-500 bg-red-50 text-red-600',              hover: 'hover:border-red-400 hover:text-red-500'         },
  { value: 'APPROVED',            label: 'APPROVED',            active: 'border-green-500 bg-green-50 text-green-600',        hover: 'hover:border-green-400 hover:text-green-500'     },
  { value: 'ORDER_PROCESSING',    label: 'ORDER PROCESSING',    active: 'border-blue-500 bg-blue-50 text-blue-700',           hover: 'hover:border-blue-400 hover:text-blue-600'       },
  { value: 'ON_DELIVERY',         label: 'ON DELIVERY',         active: 'border-orange-500 bg-orange-50 text-orange-700',     hover: 'hover:border-orange-400 hover:text-orange-600'   },
  { value: 'DELIVERED',           label: 'DELIVERED',           active: 'border-green-500 bg-green-50 text-green-700',        hover: 'hover:border-green-400 hover:text-green-600'     },
]

function OrderStatusSection({ o, token, onSaved }) {
  const [selected, setSelected] = useState(null)
  const [statusRemark, setStatusRemark] = useState('')
  const [needsPartialPayment, setNeedsPartialPayment] = useState(
    (o.items || []).some(i => Number(i.paidAmount || 0) > 0)
  )
  const [partialAmounts, setPartialAmounts] = useState(() => {
    const init = {}
    ;(o.items || []).forEach(i => {
      if (i.paidAmount) init[`oi_${i.orderItemId}`] = String(i.paidAmount)
    })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [showPrintPoDialog, setShowPrintPoDialog] = useState(false)
  const [showPrintDeliveryDialog, setShowPrintDeliveryDialog] = useState(false)
  const [deliveryVehicle, setDeliveryVehicle] = useState('')
  const [meterStart, setMeterStart] = useState('')
  const [driverName, setDriverName] = useState('')
  const [meterEnd, setMeterEnd] = useState('')

  const options = ALL_STATUS_OPTIONS.filter(opt => opt.value !== o.status)

  const deliveryFieldsMissing =
    (selected === 'ON_DELIVERY' && (!deliveryVehicle.trim() || !meterStart.trim())) ||
    (selected === 'DELIVERED'   && (!driverName.trim()     || !meterEnd.trim()))

  async function handleSave() {
    if (!selected || deliveryFieldsMissing) return
    setSaving(true)
    const body = { status: selected, remark: statusRemark }
    if (selected === 'ON_DELIVERY') { body.vehicleNumber = deliveryVehicle; body.meterStart = meterStart }
    if (selected === 'DELIVERED')   { body.driverName = driverName; body.meterEnd = meterEnd }
    await updateOrderStatus(o.orderId, body, token)
    let didSavePayments = false
    if (selected === 'NOT_APPROVED' && needsPartialPayment) {
      const items = (o.items || [])
        .filter(i => Number(partialAmounts[`oi_${i.orderItemId}`] || 0) > 0)
        .map(i => ({ orderItemId: i.orderItemId, paidAmount: Number(partialAmounts[`oi_${i.orderItemId}`]) }))
      if (items.length) {
        await savePartialPayments(o.orderId, { items }, token)
        didSavePayments = true
      }
    }
    setSaving(false)
    onSaved()
    if (didSavePayments) setShowPrintDialog(true)
    if (selected === 'ORDER_PROCESSING') setShowPrintPoDialog(true)
    if (selected === 'ON_DELIVERY')      setShowPrintDeliveryDialog(true)
  }

  return (
    <>
      {showPrintDialog && (
        <OrderSavedDialog
          orderCode={o.id}
          title="Payments saved successfully!"
          message="Do you want to print the invoice?"
          onPrint={() => { setShowPrintDialog(false); printPartialInvoice(o.orderId, token) }}
          onClose={() => setShowPrintDialog(false)}
        />
      )}
      {showPrintPoDialog && (
        <OrderSavedDialog
          orderCode={o.id}
          title="Status saved successfully!"
          message="Do you want to print the Purchase Order?"
          onPrint={() => { setShowPrintPoDialog(false); printPurchaseOrder(o.orderId, token) }}
          onClose={() => setShowPrintPoDialog(false)}
        />
      )}
      {showPrintDeliveryDialog && (
        <OrderSavedDialog
          orderCode={o.id}
          title="Status saved successfully!"
          message="Do you want to print the Delivery Note?"
          onPrint={() => { setShowPrintDeliveryDialog(false); printDeliveryNote(o.orderId, token) }}
          onClose={() => setShowPrintDeliveryDialog(false)}
        />
      )}
      <DetailSection title="Order Status">
        <div className="flex flex-col gap-4">
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

          {selected === 'ON_DELIVERY' && (
            <div className="grid grid-cols-2 gap-3 border-t border-[#f0f0f0] pt-3">
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
            </div>
          )}

          {selected === 'DELIVERED' && (
            <div className="grid grid-cols-2 gap-3 border-t border-[#f0f0f0] pt-3">
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
            <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">Remark</label>
            <textarea
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#333] resize-none focus:outline-none focus:border-[#14213d]"
              rows={2}
              value={statusRemark}
              onChange={e => setStatusRemark(e.target.value)}
              placeholder="Enter remark..."
            />
          </div>

          {selected === 'NOT_APPROVED' && (
            <div className="flex flex-col gap-3 border-t border-[#f0f0f0] pt-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={needsPartialPayment}
                  onChange={e => setNeedsPartialPayment(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#14213d] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#555]">Need Partial Payment?</span>
              </label>

              {needsPartialPayment && o.items && o.items.length > 0 && (
                <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f5f5f5] text-[#555] text-left">
                        <th className="px-3 py-2 font-medium text-xs">#</th>
                        <th className="px-3 py-2 font-medium text-xs">Item Name</th>
                        <th className="px-3 py-2 font-medium text-xs">Model</th>
                        <th className="px-3 py-2 font-medium text-xs">Value</th>
                        <th className="px-3 py-2 font-medium text-xs">Paid Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.items.map((item, idx) => {
                        const disc = parseFloat(item.discountPct) || 0
                        const displayValue = disc > 0
                          ? Math.round(Number(item.item_value) * (1 - disc / 100))
                          : Number(item.item_value)
                        return (
                          <tr key={idx} className={`border-t border-[#ebebeb] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                            <td className="px-3 py-2 text-[#aaa] text-xs">{idx + 1}</td>
                            <td className="px-3 py-2 text-[#222] font-medium text-xs">{item.item_name}</td>
                            <td className="px-3 py-2 text-[#666] text-xs">{item.model}</td>
                            <td className="px-3 py-2 text-[#444] text-xs">{LKR(displayValue)}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                value={partialAmounts[`oi_${item.orderItemId}`] || ''}
                                onChange={e => setPartialAmounts(prev => ({ ...prev, [`oi_${item.orderItemId}`]: e.target.value }))}
                                className="w-32 border border-[#e5e5e5] rounded-md px-2 py-1 text-xs text-[#333] focus:outline-none focus:border-[#14213d]"
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!selected || saving || deliveryFieldsMissing}
              className="px-5 py-2 rounded-lg bg-[#14213d] text-white text-xs font-semibold hover:bg-[#1e2f5a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </DetailSection>
    </>
  )
}

// ── Order detail modal ────────────────────────────────────────────────────────

function OrderDetailModal({ order, token, onRefresh, onClose }) {
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

          {/* ① Order Status Section (always at top, hidden only for DELIVERED) */}
          <OrderStatusSection o={o} token={token} onSaved={onRefresh} />

          {/* ② Customer Details — 2-col */}
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
                <Field label="Title"                  value={o.title} />
                <Field label="Surname"                value={o.surname} />
                <Field label="Other Names"            value={o.otherNames} />
                <Field label="Full Name w/ Initials"  value={o.fullNameWithInitials} />
                <Field label="NIC Number"             value={o.nicNumber} />
                <Field label="Date of Birth"          value={o.dateOfBirth} />
                <Field label="Marital Status"         value={o.maritalStatus} />
                {o.spouseName          && <Field label="Spouse Name"    value={o.spouseName} />}
                {o.spouseContactNumber && <Field label="Spouse Contact" value={o.spouseContactNumber} />}
              </SubGroup>
              <SubGroup title="Contact Details" cols={3}>
                <Field label="Mobile Number"   value={o.mobileNumber} />
                <Field label="Landline Number" value={o.landlineNumber} />
              </SubGroup>
              <SubGroup title="Address" cols={3}>
                <div className="col-span-3 grid grid-cols-2 gap-x-5 gap-y-2.5">
                  <AddressField label="Permanent Address" p1={o.permanentAddress1} p2={o.permanentAddress2} p3={o.permanentAddress3} p4={o.permanentAddress4} />
                  <AddressField label="Postal Address"    p1={o.postalAddress1}    p2={o.postalAddress2}    p3={o.postalAddress3}    p4={o.postalAddress4} />
                </div>
              </SubGroup>
            </DetailSection>

            {/* Right */}
            <div className="flex flex-col gap-3">
              <DetailSection title="Guarantor 1">
                <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                  <Field label="Employee ID"         value={o.g1_employeeId} />
                  <Field label="Title"               value={o.g1_title} />
                  <Field label="Surname"             value={o.g1_surname} />
                  <Field label="Other Names"         value={o.g1_otherNames} />
                  <Field label="Full Name w/ Initials" value={o.g1_fullNameWithInitials} />
                  <Field label="NIC Number"          value={o.g1_nicNumber} />
                  <Field label="Mobile Number"       value={o.g1_mobileNumber} />
                  <Field label="Landline Number"     value={o.g1_landlineNumber} />
                  <div className="col-span-2">
                    <AddressField label="Permanent Address" p1={o.g1_permanentAddress1} p2={o.g1_permanentAddress2} p3={o.g1_permanentAddress3} p4={o.g1_permanentAddress4} />
                  </div>
                </div>
              </DetailSection>
              <DetailSection title="Guarantor 2">
                <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                  <Field label="Employee ID"         value={o.g2_employeeId} />
                  <Field label="Title"               value={o.g2_title} />
                  <Field label="Surname"             value={o.g2_surname} />
                  <Field label="Other Names"         value={o.g2_otherNames} />
                  <Field label="Full Name w/ Initials" value={o.g2_fullNameWithInitials} />
                  <Field label="NIC Number"          value={o.g2_nicNumber} />
                  <Field label="Mobile Number"       value={o.g2_mobileNumber} />
                  <Field label="Landline Number"     value={o.g2_landlineNumber} />
                  <div className="col-span-2">
                    <AddressField label="Permanent Address" p1={o.g2_permanentAddress1} p2={o.g2_permanentAddress2} p3={o.g2_permanentAddress3} p4={o.g2_permanentAddress4} />
                  </div>
                </div>
              </DetailSection>
            </div>
          </div>

          {/* ③ Catalogue Items */}
          {o.items && o.items.length > 0 && (
            <DetailSection title="Catalogue Items">
              <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f5f5f5] text-[#555] text-left">
                      <th className="px-4 py-2.5 font-medium">Item</th>
                      <th className="px-4 py-2.5 font-medium">Model</th>
                      <th className="px-4 py-2.5 font-medium text-center">Duration</th>
                      <th className="px-4 py-2.5 font-medium text-center">Qty</th>
                      <th className="px-4 py-2.5 font-medium text-center">Discount</th>
                      <th className="px-4 py-2.5 font-medium">Price After Discount</th>
                      <th className="px-4 py-2.5 font-medium">Paid</th>
                      <th className="px-4 py-2.5 font-medium">Final Price</th>
                      <th className="px-4 py-2.5 font-medium">Monthly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((item, i) => {
                      const rowCls = `border-t border-[#ebebeb] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`
                      const qty             = item.qty || 1
                      const disc            = parseFloat(item.discountPct) || 0
                      const itemValue       = Number(item.item_value)
                      const baseMonthly     = Number(item[`month${item.duration_months}`] || 0)
                      const paidAmt         = Number(item.paidAmount || 0)
                      const discountedPrice = disc > 0 ? Math.round(itemValue * (1 - disc / 100)) : itemValue
                      const finalPrice      = discountedPrice - paidAmt
                      const adjMonthly      = Math.ceil(baseMonthly * finalPrice / itemValue) * qty
                      const priceAfterDiscount = disc > 0 ? discountedPrice : null
                      return (
                        <Fragment key={i}>
                          <tr className={rowCls}>
                            <td className="px-4 py-3 text-[#222] font-medium">{item.item_name}</td>
                            <td className="px-4 py-3 text-[#666]">{item.model}</td>
                            <td className="px-4 py-3 text-center text-[#555]">{item.duration_months ? `${item.duration_months}M` : '—'}</td>
                            <td className="px-4 py-3 text-center text-[#555]">{qty}</td>
                            <td className="px-4 py-3 text-center text-[#555]">{disc > 0 ? `${disc}%` : '—'}</td>
                            <td className="px-4 py-3 text-[#555]">{priceAfterDiscount != null ? LKR(priceAfterDiscount) : '—'}</td>
                            <td className="px-4 py-3 text-[#e05c3a] font-medium">{paidAmt > 0 ? LKR(paidAmt) : '—'}</td>
                            <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR(finalPrice)}</td>
                            <td className="px-4 py-3 font-bold text-[#14213d]">{LKR(adjMonthly)}</td>
                          </tr>
                          {item.remark && (
                            <tr className={rowCls}>
                              <td colSpan={9} className="px-4 pb-3 pt-0 text-xs text-[#888] italic">{item.remark}</td>
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
                      <th className="px-4 py-2.5 font-medium">Monthly</th>
                      <th className="px-4 py-2.5 font-medium text-center">Qty</th>
                      <th className="px-4 py-2.5 font-medium">Total Monthly</th>
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
                            <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR(item.monthly_per_item)}</td>
                            <td className="px-4 py-3 text-center text-[#555]">{item.qty || 1}</td>
                            <td className="px-4 py-3 font-bold text-[#14213d]">{LKR(item.amount)}</td>
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
                  {o.singerItems.length > 1 && (
                    <tfoot>
                      <tr className="border-t-2 border-[#e5e5e5] bg-[#f9f9f9]">
                        <td colSpan={5} className="px-4 py-3 text-sm font-medium text-[#555]">Total Monthly Installment</td>
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
  const hasPartial   = !!order.hasPartialPayment

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
          className={iconBtn}
          title="Print Singer Finance Form"
          onClick={() => confirmPrint('Singer Finance Form', 'Do you want to print the Singer Finance Form?', () => {
            const token = localStorage.getItem('accessToken')
            printSingerForm(order.orderId, token)
          })}
        >
          <Printer size={15} />
        </button>
        <button
          className={showPO ? iconBtn : disabledBtn}
          title="Print Purchase Order"
          disabled={!showPO}
          onClick={() => showPO && confirmPrint('Purchase Order', 'Do you want to print the Purchase Order?', () => {
            const token = localStorage.getItem('accessToken')
            printPurchaseOrder(order.orderId, token)
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
            printDeliveryNote(order.orderId, token)
          })}
        >
          <Truck size={15} />
        </button>
        {hasPartial && (
          <button
            className={iconBtnAmber}
            title="Print Partial Invoice"
            onClick={() => confirmPrint('Partial Invoice', 'Do you want to print the partial payment invoice?', () => {
              const token = localStorage.getItem('accessToken')
              printPartialInvoice(order.orderId, token)
            })}
          >
            <Receipt size={15} />
          </button>
        )}
        <button
          className={deleteBtn}
          title="Delete Order"
          onClick={() => confirm(`Delete order ${displayId}? This cannot be undone.`, () => onDelete(order))}
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

function OrdersTable({ orders, onView, onEdit, onDelete }) {
  return (
    <div className="w-full overflow-hidden">
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
              key={order.orderId ?? order.id}
              className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
              }`}
            >
              <td className="px-5 py-3.5 font-semibold text-[#14213d]">{order.id}</td>
              <td className="px-5 py-3.5 text-[#555]">{order.employeeId}</td>
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

export default function OrdersPage() {
  const [view,      setView]      = useState('list')
  const [orders,    setOrders]    = useState([])
  const [viewOrder, setViewOrder] = useState(null)
  const [editOrder, setEditOrder] = useState(null)
  const [limit,      setLimit]      = useState(10)
  const [offset,     setOffset]     = useState(0)
  const [total,      setTotal]      = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const backToList = () => { setEditOrder(null); setView('list'); setRefreshKey(k => k + 1) }

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')
      const data = await getAllOrdersPaginated({ offset, limit, columnName: null, branchIds: [] }, token)
      if (data.status === 200) {
        setOrders(data.data.orders)
        setTotal(Number(data.data.total))
      }
    }
    load()
  }, [offset, limit, refreshKey])

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
        <OrderDetailModal
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
            <h1 className="text-2xl font-semibold text-[#14213d]">Orders</h1>
            <Button onClick={() => setView('form')}>
              <Plus size={15} className="mr-1.5" />
              Add New Order
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-hidden">
            <OrdersTable orders={orders} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
            <PaginationBar
              offset={offset}
              limit={limit}
              total={total}
              onLimitChange={handleLimitChange}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </div>
        </>
      ) : view === 'edit' ? (
        <NewOrderForm
          onBack={backToList}
          initialData={editOrder}
          orderId={editOrder?.orderId}
        />
      ) : (
        <NewOrderForm onBack={backToList} />
      )}
    </div>
  )
}
