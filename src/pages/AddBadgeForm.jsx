import { useState } from 'react'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import FormSection from '../components/FormSection'
import Button from '../components/Button'

function LKR(n) { return `LKR ${Number(n).toLocaleString('en-LK')}` }
function round2(n) { return Math.round(n * 100) / 100 }
function num(v) { return Number(v) || 0 }

const EMPTY = {
  category: '', item: '', model: '', size: '',
  transferPrice: '',
  adminCostValue: '', adminCostPct: '',
  spValue: '',        spPct: '',
  transportValue: '', transportPct: '',
  pricePct: '0',
  m6: '', m12: '', m18: '', m24: '',
}

const base    = 'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors duration-100'
const inp     = `${base} border-[#e5e5e5] bg-white text-[#000] placeholder-[#bbb] focus:border-[#14213d]`
const rdonly  = `${base} border-[#e5e5e5] bg-[#f5f5f5] font-semibold text-[#14213d] cursor-default select-none`
const dis     = `${base} border-[#eee] bg-[#fafafa] text-[#bbb] cursor-not-allowed`

const iconBtn   = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'
const deleteBtn = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-red-600 hover:bg-red-50 cursor-pointer'

const TABLE_HEADERS = [
  'Category','Item','Model','Size',
  'Transfer Price','Admin Cost','S&P','Transport',
  'Total Cost','Price','6M','12M','18M','24M','Actions',
]

function PricingRow({ label, required, children }) {
  return (
    <div className="grid grid-cols-[200px_1fr_1fr] gap-3 items-center py-2.5 border-b border-[#f0f0f0] last:border-0">
      <span className="text-sm font-medium text-[#444]">
        {label}{required && <span className="text-[#fca311] ml-0.5">*</span>}
      </span>
      {children}
    </div>
  )
}

export default function AddBadgeForm({ badge, onBack, onSave }) {
  const [form,      setForm]      = useState(EMPTY)
  const [entries,   setEntries]   = useState(badge?.items ?? [])
  const [editIndex, setEditIndex] = useState(null)

  // ── Computed ─────────────────────────────────────────────────────────────
  const tp        = num(form.transferPrice)
  const adminVal  = num(form.adminCostValue)
  const spVal     = num(form.spValue)
  const transpVal = num(form.transportValue)
  const totalCost = tp + adminVal + spVal + transpVal
  const price     = totalCost * (1 + num(form.pricePct) / 100)
  const enabled   = tp > 0

  // ── Handlers ─────────────────────────────────────────────────────────────
  function setField(key) {
    return e => setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  function handleCostValue(valueKey, pctKey) {
    return e => {
      const val = e.target.value
      setForm(prev => {
        const base = num(prev.transferPrice)
        const pct  = base > 0 ? String(round2(num(val) / base * 100)) : ''
        return { ...prev, [valueKey]: val, [pctKey]: pct }
      })
    }
  }

  function handleCostPct(pctKey, valueKey) {
    return e => {
      const pct = e.target.value
      setForm(prev => {
        const base = num(prev.transferPrice)
        const val  = String(round2(num(pct) / 100 * base))
        return { ...prev, [pctKey]: pct, [valueKey]: val }
      })
    }
  }

  function handleAddItem() {
    const { category, item, model, transferPrice } = form
    if (!category || !item || !model || !transferPrice) {
      alert('Please fill in Category, Item, Model, and Transfer Price.')
      return
    }
    const entry = {
      id:             editIndex !== null ? entries[editIndex].id : crypto.randomUUID(),
      category:       form.category,
      item:           form.item,
      model:          form.model,
      size:           form.size,
      transferPrice:  num(form.transferPrice),
      adminCostValue: num(form.adminCostValue),
      adminCostPct:   num(form.adminCostPct),
      spValue:        num(form.spValue),
      spPct:          num(form.spPct),
      transportValue: num(form.transportValue),
      transportPct:   num(form.transportPct),
      totalCost,
      pricePct:       num(form.pricePct),
      price,
      m6: form.m6, m12: form.m12, m18: form.m18, m24: form.m24,
    }
    if (editIndex !== null) {
      setEntries(prev => prev.map((e, i) => i === editIndex ? entry : e))
    } else {
      setEntries(prev => [...prev, entry])
    }
    setForm(EMPTY)
    setEditIndex(null)
  }

  function handleEdit(i) {
    const e = entries[i]
    setForm({
      category:       e.category,
      item:           e.item,
      model:          e.model,
      size:           e.size,
      transferPrice:  String(e.transferPrice),
      adminCostValue: String(e.adminCostValue),
      adminCostPct:   String(e.adminCostPct),
      spValue:        String(e.spValue),
      spPct:          String(e.spPct),
      transportValue: String(e.transportValue),
      transportPct:   String(e.transportPct),
      pricePct:       String(e.pricePct),
      m6: e.m6, m12: e.m12, m18: e.m18, m24: e.m24,
    })
    setEditIndex(i)
  }

  function handleDelete(i) {
    if (editIndex === i) { setForm(EMPTY); setEditIndex(null) }
    else if (editIndex !== null && i < editIndex) setEditIndex(editIndex - 1)
    setEntries(prev => prev.filter((_, idx) => idx !== i))
  }


  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#14213d] transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Inventory
        </button>
        <span className="text-[#ccc] text-sm">/</span>
        <h1 className="text-xl font-semibold text-[#14213d]">
          {badge ? `Edit Badge ${badge.badgeNumber}` : 'Add Badge'}
        </h1>
      </div>

      {/* ── Section 1: Item Details ── */}
      <FormSection number="1" title="Item Details">
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'category', label: 'Product Category', ph: 'e.g. Dining'          },
            { key: 'item',     label: 'Item',             ph: 'e.g. Dining Table'     },
            { key: 'model',    label: 'Model',            ph: 'e.g. DT-6S-2024'       },
            { key: 'size',     label: 'Size',             ph: 'e.g. L180 × W90 cm', optional: true },
          ].map(({ key, label, ph, optional }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#222]">
                {label}{!optional && <span className="text-[#fca311] ml-0.5">*</span>}
              </label>
              <input value={form[key]} onChange={setField(key)} placeholder={ph} className={inp} />
            </div>
          ))}
        </div>
      </FormSection>

      {/* ── Section 2: Pricing ── */}
      <FormSection number="2" title="Pricing">
        {/* Column headers */}
        <div className="grid grid-cols-[200px_1fr_1fr] gap-3 mb-1">
          <div />
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider">Value (LKR)</p>
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider">% of Transfer Price</p>
        </div>

        <PricingRow label="Transfer Price" required>
          <input
            type="number" min="0"
            value={form.transferPrice} onChange={setField('transferPrice')}
            placeholder="0" className={inp}
          />
          <div />
        </PricingRow>

        {[
          { label: 'Admin Cost',        vk: 'adminCostValue', pk: 'adminCostPct' },
          { label: 'Sales & Promotion', vk: 'spValue',        pk: 'spPct'        },
          { label: 'Transport',         vk: 'transportValue', pk: 'transportPct' },
        ].map(({ label, vk, pk }) => (
          <PricingRow key={vk} label={label}>
            <input
              type="number" min="0"
              value={form[vk]}
              onChange={handleCostValue(vk, pk)}
              placeholder="0"
              disabled={!enabled}
              className={enabled ? inp : dis}
            />
            <div className="flex items-center gap-2">
              <input
                type="number" min="0"
                value={form[pk]}
                onChange={handleCostPct(pk, vk)}
                placeholder="0"
                disabled={!enabled}
                className={`flex-1 ${enabled ? inp : dis}`}
              />
              <span className="text-xs text-[#888] shrink-0">%</span>
            </div>
          </PricingRow>
        ))}

        {/* Total Cost — read-only */}
        <div className="grid grid-cols-[200px_1fr_1fr] gap-3 items-center py-2.5 mt-1 border-t-2 border-[#e5e5e5]">
          <span className="text-sm font-semibold text-[#222]">Total Cost</span>
          <div className={rdonly}>{LKR(totalCost)}</div>
          <div />
        </div>

        {/* Price — read-only value + editable % markup */}
        <div className="grid grid-cols-[200px_1fr_1fr] gap-3 items-center py-2.5">
          <span className="text-sm font-semibold text-[#222]">Price</span>
          <div className={rdonly}>{LKR(price)}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#888] shrink-0">+</span>
            <input
              type="number" min="0"
              value={form.pricePct} onChange={setField('pricePct')}
              placeholder="0" className={`flex-1 ${inp}`}
            />
            <span className="text-xs text-[#888] shrink-0">% markup</span>
          </div>
        </div>
      </FormSection>

      {/* ── Section 3: Installments ── */}
      <FormSection number="3" title="Installments">
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'm6',  label: '6 Month'  },
            { key: 'm12', label: '12 Month' },
            { key: 'm18', label: '18 Month' },
            { key: 'm24', label: '24 Month' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#222]">{label}</label>
              <input
                type="number" min="0"
                value={form[key]} onChange={setField(key)}
                placeholder="0" className={inp}
              />
            </div>
          ))}
        </div>
      </FormSection>

      {/* Add / Update button */}
      <div className="flex justify-end">
        <Button type="button" onClick={handleAddItem}>
          {editIndex !== null ? 'Update Item' : 'Add Item'}
        </Button>
      </div>

      {/* ── Local entries table ── */}
      {entries.length > 0 && (
        <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-x-auto">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="bg-[#14213d] text-white text-left">
                {TABLE_HEADERS.map(h => (
                  <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr
                  key={e.id}
                  className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                    i === editIndex ? 'bg-[#fffbec]' : i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
                  }`}
                >
                  <td className="px-4 py-3 text-[#555]">{e.category}</td>
                  <td className="px-4 py-3 font-semibold text-[#14213d] whitespace-nowrap">{e.item}</td>
                  <td className="px-4 py-3 text-[#555]">{e.model}</td>
                  <td className="px-4 py-3 text-[#555]">{e.size}</td>
                  <td className="px-4 py-3 text-[#444]">{LKR(e.transferPrice)}</td>
                  <td className="px-4 py-3 text-[#444] whitespace-nowrap">
                    {LKR(e.adminCostValue)} <span className="text-xs text-[#999]">({e.adminCostPct}%)</span>
                  </td>
                  <td className="px-4 py-3 text-[#444] whitespace-nowrap">
                    {LKR(e.spValue)} <span className="text-xs text-[#999]">({e.spPct}%)</span>
                  </td>
                  <td className="px-4 py-3 text-[#444] whitespace-nowrap">
                    {LKR(e.transportValue)} <span className="text-xs text-[#999]">({e.transportPct}%)</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR(e.totalCost)}</td>
                  <td className="px-4 py-3 font-semibold text-[#14213d] whitespace-nowrap">
                    {LKR(e.price)} <span className="text-xs font-normal text-[#999]">(+{e.pricePct}%)</span>
                  </td>
                  <td className="px-4 py-3 text-[#555]">{e.m6  || '—'}</td>
                  <td className="px-4 py-3 text-[#555]">{e.m12 || '—'}</td>
                  <td className="px-4 py-3 text-[#555]">{e.m18 || '—'}</td>
                  <td className="px-4 py-3 text-[#555]">{e.m24 || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className={iconBtn}   title="Edit"   onClick={() => handleEdit(i)}><Pencil size={15} /></button>
                      <button className={deleteBtn} title="Delete" onClick={() => handleDelete(i)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pb-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft size={14} className="mr-1.5" />
          Back to Inventory
        </Button>
        <Button
          type="button"
          disabled={entries.length === 0}
          onClick={() => onSave(entries, badge?.id)}
        >
          Save Badge
        </Button>
      </div>

    </div>
  )
}
