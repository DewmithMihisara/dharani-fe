import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import FormSection from '../components/FormSection'
import { getCandidateOrders, saveTrip } from '../api/deliveryApi'
import { capitalizeWords } from '../utils/text'

// Vehicle number: uppercase letters, digits, hyphen, single spaces only.
function cleanVehicleNumber(v) {
  return v.toUpperCase().replace(/[^A-Z0-9 -]/g, '').replace(/\s{2,}/g, ' ').replace(/^\s+/, '')
}
// Start meter: digits only (no decimal point, no exponent).
function cleanMeter(v) {
  return v.replace(/\D/g, '')
}
// Per km rate: decimal number only — digits and a single dot.
function cleanRate(v) {
  const s = v.replace(/[^0-9.]/g, '')
  const i = s.indexOf('.')
  return i === -1 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '')
}

export default function NewTripForm({ onBack, initialData = null, tripId = null }) {
  const [vehicleNumber, setVehicleNumber] = useState(initialData?.vehicleNumber ?? '')
  const [driverName, setDriverName]       = useState(initialData?.driverName ?? '')
  const [startMeter, setStartMeter]       = useState(initialData ? String(initialData.startMeter) : '')
  const [perKmRate, setPerKmRate]         = useState(initialData ? String(initialData.perKmRate) : '')
  const [candidates, setCandidates]       = useState([])
  const [selected, setSelected] = useState(
    () => new Set((initialData?.orders ?? []).map(o => `${o.type}:${o.orderId}`))
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    getCandidateOrders(token).then(res => {
      if (res.status === 200) setCandidates(res.data.orders ?? [])
    })
  }, [])

  // Existing members are already assigned, so the candidate endpoint omits them —
  // merge them in so they can be unchecked on edit.
  const rows = useMemo(() => {
    const map = new Map(candidates.map(c => [`${c.type}:${c.orderId}`, c]))
    ;(initialData?.orders ?? []).forEach(o => {
      const k = `${o.type}:${o.orderId}`
      if (!map.has(k)) {
        map.set(k, {
          type: o.type, orderId: o.orderId, orderCode: o.orderCode,
          customerName: o.customerName, nicNumber: o.nicNumber, status: o.status, date: o.date,
        })
      }
    })
    return [...map.values()]
  }, [candidates, initialData])

  const allChecked = rows.length > 0 && rows.every(r => selected.has(`${r.type}:${r.orderId}`))

  function toggle(key) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  function toggleAll() {
    setSelected(prev => {
      if (rows.every(r => prev.has(`${r.type}:${r.orderId}`))) return new Set()
      return new Set(rows.map(r => `${r.type}:${r.orderId}`))
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!vehicleNumber.trim() || !driverName.trim() || !startMeter || !perKmRate) {
      setError('All trip fields are required.')
      return
    }
    if (!/^\d+$/.test(startMeter)) { setError('Start meter must be a whole number.'); return }
    if (!/^\d+(\.\d+)?$/.test(perKmRate) || Number(perKmRate) <= 0) {
      setError('Per km rate must be a decimal number greater than zero.'); return
    }
    if (selected.size === 0) { setError('Select at least one order for this trip.'); return }

    setError('')
    setLoading(true)
    const token = localStorage.getItem('accessToken')
    const payload = {
      id: tripId ?? null,
      vehicleNumber: vehicleNumber.trim(),
      driverName: driverName.trim(),
      startMeter: parseInt(startMeter, 10),
      perKmRate: parseFloat(perKmRate),
      orders: [...selected].map(k => {
        const [type, id] = k.split(':')
        return { type, orderId: Number(id) }
      }),
    }
    const data = await saveTrip(payload, token)
    setLoading(false)
    if (data.status === 200) onBack()
    else setError(data.message || 'Failed to save the trip.')
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#14213d] transition-colors cursor-pointer">
          <ArrowLeft size={15} />
          Delivery Management
        </button>
        <span className="text-[#ccc] text-sm">/</span>
        <h1 className="text-lg font-semibold text-[#14213d]">{tripId ? 'Update Trip' : 'New Delivery Trip'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FormSection number="1" title="Vehicle & Driver">
          <div className="grid grid-cols-4 gap-3">
            <Input label="Vehicle Number" required value={vehicleNumber}
              onChange={e => setVehicleNumber(cleanVehicleNumber(e.target.value))} placeholder="e.g. WP CAB-1234" />
            <Input label="Driver Name" required value={driverName}
              onChange={e => setDriverName(capitalizeWords(e.target.value))} placeholder="Driver full name" />
            <Input label="Start Meter" required value={startMeter}
              onChange={e => setStartMeter(cleanMeter(e.target.value))} placeholder="e.g. 12450" />
            <Input label="Per Km Rate (LKR)" required value={perKmRate}
              onChange={e => setPerKmRate(cleanRate(e.target.value))} placeholder="e.g. 85.00" />
          </div>
        </FormSection>

        <FormSection number="2" title="Orders to Deliver">
          {rows.length === 0 ? (
            <div className="border border-dashed border-[#d8d8d8] rounded-lg py-10 text-center">
              <p className="text-sm text-[#bbb]">No orders are currently on delivery.</p>
            </div>
          ) : (
            <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f5f5f5] text-[#555] text-left">
                    <th className="px-4 py-2.5 w-10">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll} className="cursor-pointer" />
                    </th>
                    <th className="px-4 py-2.5 font-medium">Order No.</th>
                    <th className="px-4 py-2.5 font-medium">Customer</th>
                    <th className="px-4 py-2.5 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const key = `${r.type}:${r.orderId}`
                    return (
                      <tr key={key} className={`border-t border-[#ebebeb] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(key)} onChange={() => toggle(key)} className="cursor-pointer" />
                        </td>
                        <td className="px-4 py-3 text-[#222] font-medium">{r.orderCode}</td>
                        <td className="px-4 py-3 text-[#666]">{r.customerName}</td>
                        <td className="px-4 py-3 text-[#666]">{r.type === 'RETAIL' ? 'Retail' : 'Corporate'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-[#999] mt-2">{selected.size} order{selected.size === 1 ? '' : 's'} selected.</p>
        </FormSection>

        <div className="bg-white border border-[#d8d8d8] rounded-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-xs text-[#aaa]">All fields marked <span className="text-[#fca311] font-semibold">*</span> are required</p>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Trip'}</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
