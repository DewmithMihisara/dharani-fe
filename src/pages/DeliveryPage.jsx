import { useState, useEffect } from 'react'
import { Plus, Eye, Pencil, Trash2, X } from 'lucide-react'
import Button from '../components/Button'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import NewTripForm from './NewTripForm'
import { getAllTripsPaginated, getTripById, deleteTrip, updateTripStatus } from '../api/deliveryApi'

const STATUS_VARIANT = { ON_DELIVERY: 'delivery', DELIVERED: 'delivered' }
const STATUS_LABELS  = { ON_DELIVERY: 'On Delivery', DELIVERED: 'Delivered' }
const STATUS_TABS    = ['ON_DELIVERY', 'DELIVERED']

const iconBtn     = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'
const disabledBtn = 'p-1.5 rounded-md text-[#d5d5d5] cursor-not-allowed'
const deleteBtn   = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-red-600 hover:bg-red-50 cursor-pointer'

function LKR(n) {
  return `LKR ${Number(n).toLocaleString('en-LK')}`
}

function Field({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">{label}</span>
      <span className="text-sm text-[#222]">{value}</span>
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

function PaginationBar({ offset, limit, total, onLimitChange, onPrev, onNext }) {
  const from  = total === 0 ? 0 : offset + 1
  const to    = Math.min(offset + limit, total)
  const page  = limit > 0 ? Math.floor(offset / limit) + 1 : 1
  const pages = limit > 0 ? Math.ceil(total / limit) : 1
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e5e5] bg-white text-xs text-[#666]">
      <span>{total > 0 ? `Showing ${from}–${to} of ${total} trips` : 'No trips found'}</span>
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
          <button onClick={onPrev} disabled={offset === 0}
            className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">←</button>
          <span className="text-[#444] font-medium">Page {page} of {pages}</span>
          <button onClick={onNext} disabled={offset + limit >= total}
            className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">→</button>
        </div>
      </div>
    </div>
  )
}

function ActionButtons({ trip, onView, onEdit, onDelete }) {
  const [dialog, setDialog] = useState(null)
  const editable = trip.status === 'ON_DELIVERY'
  return (
    <>
      {dialog && (
        <ConfirmDialog message={dialog.message}
          onConfirm={() => { dialog.onConfirm(); setDialog(null) }}
          onCancel={() => setDialog(null)} />
      )}
      <div className="flex items-center gap-0.5 justify-end">
        <button className={iconBtn} title="View Trip" onClick={() => onView(trip)}>
          <Eye size={15} />
        </button>
        <button className={editable ? iconBtn : disabledBtn} title="Edit Trip" disabled={!editable}
          onClick={() => editable && onEdit(trip)}>
          <Pencil size={15} />
        </button>
        <button className={editable ? deleteBtn : disabledBtn}
          title={editable ? 'Delete Trip' : 'Cannot delete a delivered trip'} disabled={!editable}
          onClick={() => editable && setDialog({
            message: `Delete trip ${trip.deliveryCode}? Its orders return to the unassigned list.`,
            onConfirm: () => onDelete(trip),
          })}>
          <Trash2 size={15} />
        </button>
      </div>
    </>
  )
}

function TripsTable({ trips, onView, onEdit, onDelete }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#14213d] text-white text-left">
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Trip No.</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Vehicle Number</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Driver Name</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Total Trip (Km)</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Per Km Rate</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Total Payment</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Status</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip, i) => (
            <tr key={trip.id}
              className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
              <td className="px-5 py-3.5 font-semibold text-[#14213d]">{trip.deliveryCode}</td>
              <td className="px-5 py-3.5 text-[#555]">{trip.vehicleNumber}</td>
              <td className="px-5 py-3.5 text-[#555]">{trip.driverName}</td>
              <td className="px-5 py-3.5 text-[#666]">{trip.totalKm ?? '—'}</td>
              <td className="px-5 py-3.5 text-[#666]">{LKR(trip.perKmRate)}</td>
              <td className="px-5 py-3.5 text-[#666]">{trip.totalPayment != null ? LKR(trip.totalPayment) : '—'}</td>
              <td className="px-5 py-3.5">
                <Badge variant={STATUS_VARIANT[trip.status]} label={STATUS_LABELS[trip.status] ?? trip.status} />
              </td>
              <td className="px-5 py-3.5">
                <ActionButtons trip={trip} onView={onView} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TripDetailModal({ trip, token, onRefresh, onClose }) {
  const [endMeter, setEndMeter] = useState('')
  const [remark, setRemark] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isOpen = trip.status === 'ON_DELIVERY'
  const endNum = parseInt(endMeter, 10)
  const endMeterInvalid = !endMeter || Number.isNaN(endNum) || endNum < trip.startMeter

  async function handleDeliver() {
    if (endMeterInvalid) { setError(`End meter must be at least ${trip.startMeter}.`); return }
    setSaving(true)
    setError('')
    const data = await updateTripStatus(trip.id, { status: 'DELIVERED', endMeter: endNum, remark }, token)
    setSaving(false)
    if (data.status === 200) {
      await onRefresh()
      onClose()
    } else {
      setError(data.message || 'Failed to complete the trip.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#f0f0f0] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
          <div className="sticky top-0 z-10 bg-[#14213d] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-base">{trip.deliveryCode}</span>
              <Badge variant={STATUS_VARIANT[trip.status]} label={STATUS_LABELS[trip.status] ?? trip.status} />
              <span className="text-[#6b7a99] text-xs">{trip.date}</span>
            </div>
            <button onClick={onClose} className="text-[#6b7a99] hover:text-white transition-colors duration-100 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <DetailSection title="Trip Status">
              {isOpen ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">
                        End Meter <span className="text-red-400">*</span>
                      </label>
                      <input type="number" value={endMeter} onChange={e => setEndMeter(e.target.value)}
                        placeholder={`≥ ${trip.startMeter}`}
                        className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#333] focus:outline-none focus:border-[#14213d]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">Remark</label>
                      <input value={remark} onChange={e => setRemark(e.target.value)} placeholder="Optional"
                        className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#333] focus:outline-none focus:border-[#14213d]" />
                    </div>
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <div>
                    <Button onClick={handleDeliver} disabled={saving || endMeterInvalid}>
                      {saving ? 'Saving…' : 'Mark as Delivered'}
                    </Button>
                  </div>
                  <p className="text-[11px] text-[#999]">
                    Marking this trip delivered sets every order on it to Delivered.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[#888] italic">Trip completed — no further changes.</p>
              )}
            </DetailSection>

            <DetailSection title="Trip Details">
              <div className="grid grid-cols-4 gap-x-5 gap-y-2.5">
                <Field label="Vehicle No." value={trip.vehicleNumber} />
                <Field label="Driver Name" value={trip.driverName} />
                <Field label="Start Meter" value={trip.startMeter} />
                <Field label="End Meter" value={trip.endMeter} />
                <Field label="Per Km Rate" value={LKR(trip.perKmRate)} />
                <Field label="Total Km" value={trip.totalKm ?? '—'} />
                <Field label="Total Payment" value={trip.totalPayment != null ? LKR(trip.totalPayment) : '—'} />
              </div>
            </DetailSection>

            <DetailSection title="Orders on this Trip">
              <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f5f5f5] text-[#555] text-left">
                      <th className="px-4 py-2.5 font-medium">Order No.</th>
                      <th className="px-4 py-2.5 font-medium">Customer</th>
                      <th className="px-4 py-2.5 font-medium">NIC No.</th>
                      <th className="px-4 py-2.5 font-medium">Type</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(trip.orders || []).map((o, i) => (
                      <tr key={`${o.type}:${o.orderId}`} className={`border-t border-[#ebebeb] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                        <td className="px-4 py-3 text-[#222] font-medium">{o.orderCode}</td>
                        <td className="px-4 py-3 text-[#666]">{o.customerName}</td>
                        <td className="px-4 py-3 text-[#666]">{o.nicNumber}</td>
                        <td className="px-4 py-3 text-[#666]">{o.type === 'RETAIL' ? 'Retail' : 'Corporate'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_VARIANT[o.status]} label={STATUS_LABELS[o.status] ?? o.status} />
                        </td>
                      </tr>
                    ))}
                    {(trip.orders || []).length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-[#999]">No orders on this trip.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DetailSection>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DeliveryPage() {
  const [view, setView] = useState('list')
  const [trips, setTrips] = useState([])
  const [viewTrip, setViewTrip] = useState(null)
  const [editTrip, setEditTrip] = useState(null)
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusFilter, setStatusFilter] = useState(null)

  const backToList = () => { setEditTrip(null); setView('list'); setRefreshKey(k => k + 1) }

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')
      const data = await getAllTripsPaginated({ offset, limit, status: statusFilter, search: null }, token)
      if (data.status === 200) {
        setTrips(data.data.trips)
        setTotal(Number(data.data.total))
      }
    }
    load()
  }, [offset, limit, refreshKey, statusFilter])

  function handleLimitChange(n) { setLimit(n); setOffset(0) }
  function handlePrev() { setOffset(p => Math.max(0, p - limit)) }
  function handleNext() { setOffset(p => (p + limit < total ? p + limit : p)) }

  async function handleView(trip) {
    const token = localStorage.getItem('accessToken')
    const data = await getTripById(trip.id, token)
    if (data.status === 200) setViewTrip(data.data.trip)
  }
  async function handleEdit(trip) {
    const token = localStorage.getItem('accessToken')
    const data = await getTripById(trip.id, token)
    if (data.status === 200) { setEditTrip(data.data.trip); setView('edit') }
  }
  async function handleDelete(trip) {
    const token = localStorage.getItem('accessToken')
    const data = await deleteTrip(trip.id, token)
    if (data.status === 200) setTrips(prev => prev.filter(t => t.id !== trip.id))
  }
  async function refreshViewTrip() {
    const token = localStorage.getItem('accessToken')
    const data = await getTripById(viewTrip.id, token)
    if (data.status === 200) setViewTrip(data.data.trip)
  }

  return (
    <div className="p-8">
      {viewTrip && (
        <TripDetailModal
          trip={viewTrip}
          token={localStorage.getItem('accessToken')}
          onRefresh={refreshViewTrip}
          onClose={() => { setViewTrip(null); setRefreshKey(k => k + 1) }}
        />
      )}

      {view === 'list' ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-[#14213d]">Delivery Management</h1>
            <Button onClick={() => setView('form')}>
              <Plus size={15} className="mr-1.5" />
              Add New Trip
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <select value={statusFilter ?? ''} onChange={e => { setStatusFilter(e.target.value || null); setOffset(0) }}
              className="border border-[#14213d] rounded-lg px-3 py-2 text-sm text-[#222] focus:outline-none cursor-pointer">
              <option value="">All Statuses</option>
              {STATUS_TABS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-hidden">
            {trips.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-[#999]">No delivery trips yet.</p>
              </div>
            ) : (
              <>
                <TripsTable trips={trips} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
                <PaginationBar offset={offset} limit={limit} total={total}
                  onLimitChange={handleLimitChange} onPrev={handlePrev} onNext={handleNext} />
              </>
            )}
          </div>
        </>
      ) : view === 'edit' ? (
        <NewTripForm onBack={backToList} initialData={editTrip} tripId={editTrip?.id} />
      ) : (
        <NewTripForm onBack={backToList} />
      )}
    </div>
  )
}
