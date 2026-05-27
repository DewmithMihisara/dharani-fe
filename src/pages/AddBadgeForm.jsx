import { useState, useEffect } from 'react'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import FormSection from '../components/FormSection'
import Button from '../components/Button'
import { saveBadge, getCategories, getItemsByCategory, getModelsByItem } from '../api/inventoryApi'
import Combobox from '../components/Combobox'

function LKR(n) { return `LKR ${Number(n).toLocaleString('en-LK')}` }
function round2(n) { return Math.round(n * 100) / 100 }
function num(v) { return Number(v) || 0 }

const EMPTY = {
  category: '', item: '', model: '', modelId: null, size: '',
  transferPrice: '',
  adminCostValue: '', adminCostPct: '',
  spValue: '',        spPct: '',
  transportValue: '', transportPct: '',
  taxPct: '0',       taxValue: '',
  pricePct: '',      price: '',
  m6: '', m12: '', m18: '', m24: '',
  m6Pct: '18.562', m12Pct: '10.146', m18Pct: '7.374', m24Pct: '6.011',
}

const base   = 'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors duration-100'
const inp    = `${base} border-[#e5e5e5] bg-white text-[#000] placeholder-[#bbb] focus:border-[#14213d]`
const rdonly = `${base} border-[#e5e5e5] bg-[#f5f5f5] font-semibold text-[#14213d] cursor-default select-none`
const dis    = `${base} border-[#eee] bg-[#fafafa] text-[#bbb] cursor-not-allowed`

const iconBtn   = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'
const deleteBtn = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-red-600 hover:bg-red-50 cursor-pointer'

const TABLE_HEADERS = [
  'Category','Item','Model','Size',
  'Transfer Price','Admin Cost','S&P','Transport',
  'Total Cost','Tax%','Price','6M','12M','18M','24M','Actions',
]

const PAGE_SIZE = 25

function calcPrice(prev, overrides = {}) {
  const f  = { ...prev, ...overrides }
  const tc = num(f.transferPrice) + num(f.adminCostValue) + num(f.spValue) + num(f.transportValue)
  return String(round2(tc * (1 + num(f.pricePct) / 100)))
}

function recalcAll(next) {
  const price    = calcPrice(next)
  const taxVal   = round2(num(price) * num(next.taxPct) / 100)
  const taxValue = taxVal > 0 ? String(taxVal) : ''
  const pvat     = round2(num(price) + taxVal)
  return { ...next, price, taxValue, ...calcInstallments(String(pvat), next) }
}

function calcInstallments(priceStr, pcts) {
  const p = num(priceStr)
  if (p <= 0) return { m6: '', m12: '', m18: '', m24: '' }
  return {
    m6:  String(Math.ceil(p * num(pcts.m6Pct)  / 100)),
    m12: String(Math.ceil(p * num(pcts.m12Pct) / 100)),
    m18: String(Math.ceil(p * num(pcts.m18Pct) / 100)),
    m24: String(Math.ceil(p * num(pcts.m24Pct) / 100)),
  }
}

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

function apiEntryToForm(e) {
  const priceVal = num(e.price)
  const taxAmt   = num(e.taxValue)
  const pvat     = priceVal + taxAmt
  const tc       = num(e.transferPrice) + num(e.adminCost) + num(e.salesAndPromotion) + num(e.transport)
  const pricePct = tc > 0 && priceVal > 0 ? String(round2((priceVal / tc - 1) * 100)) : ''
  return {
    category:       e.category      ?? '',
    item:           e.itemName      ?? '',
    model:          e.modelName     ?? '',
    modelId:        e.modelId       ?? null,
    size:           e.size          ?? '',
    transferPrice:  String(e.transferPrice  ?? ''),
    adminCostValue: String(e.adminCost      ?? ''),
    adminCostPct:   String(e.adminCostPct   ?? ''),
    spValue:        String(e.salesAndPromotion      ?? ''),
    spPct:          String(e.salesAndPromotionPct   ?? ''),
    transportValue: String(e.transport      ?? ''),
    transportPct:   String(e.transportPct   ?? ''),
    taxPct:         String(e.taxPct  ?? '0'),
    taxValue:       String(taxAmt),
    pricePct,
    price:          String(priceVal),
    m6:  String(e.month6  ?? ''),
    m12: String(e.month12 ?? ''),
    m18: String(e.month18 ?? ''),
    m24: String(e.month24 ?? ''),
    m6Pct:  pvat > 0 && e.month6  ? String(round2(num(e.month6)  / pvat * 100)) : '18.562',
    m12Pct: pvat > 0 && e.month12 ? String(round2(num(e.month12) / pvat * 100)) : '10.146',
    m18Pct: pvat > 0 && e.month18 ? String(round2(num(e.month18) / pvat * 100)) : '7.374',
    m24Pct: pvat > 0 && e.month24 ? String(round2(num(e.month24) / pvat * 100)) : '6.011',
  }
}

export default function AddBadgeForm({ badge, onBack, onSave }) {
  const [form,      setForm]      = useState(EMPTY)
  const [entries,   setEntries]   = useState(() => {
    if (!badge?.items) return []
    return badge.items.map(i => ({
      id:             i.id ?? crypto.randomUUID(),
      category:       i.category,
      item:           i.itemName,
      model:          i.modelName,
      size:           i.size,
      transferPrice:  Number(i.transferPrice  ?? 0),
      adminCostValue: Number(i.adminCost      ?? 0),
      adminCostPct:   Number(i.adminCostPct   ?? 0),
      spValue:        Number(i.salesAndPromotion    ?? 0),
      spPct:          Number(i.salesAndPromotionPct ?? 0),
      transportValue: Number(i.transport      ?? 0),
      transportPct:   Number(i.transportPct   ?? 0),
      totalCost:      Number(i.totalCost      ?? 0),
      taxPct:         Number(i.taxPct   ?? 0),
      taxValue:       Number(i.taxValue ?? 0),
      price:          Number(i.price   ?? 0) - Number(i.taxValue ?? 0),
      m6:  i.month6  ?? '', m12: i.month12 ?? '',
      m18: i.month18 ?? '', m24: i.month24 ?? '',
    }))
  })
  const [editIndex,       setEditIndex]       = useState(null)
  const [tablePage,       setTablePage]       = useState(0)
  const [saving,          setSaving]          = useState(false)
  const [categoryOptions, setCategoryOptions] = useState([])
  const [itemOptions,     setItemOptions]     = useState([])
  const [modelOptions,    setModelOptions]    = useState([])
  const [selectedCatId,   setSelectedCatId]   = useState(null)
  const [selectedItemId,  setSelectedItemId]  = useState(null)

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))

  useEffect(() => {
    if (tablePage >= totalPages) setTablePage(Math.max(0, totalPages - 1))
  }, [entries.length, totalPages])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    getCategories(token).then(res => {
      if (res.status === 200)
        setCategoryOptions((res.data.categories ?? []).map(c => ({ id: c.id, label: c.name })))
    })
  }, [])

  // ── Computed ─────────────────────────────────────────────────────────────
  const tp        = num(form.transferPrice)
  const adminVal  = num(form.adminCostValue)
  const spVal     = num(form.spValue)
  const transpVal = num(form.transportValue)
  const totalCost = tp + adminVal + spVal + transpVal
  const enabled = tp > 0

  const visibleEntries = entries.slice(tablePage * PAGE_SIZE, (tablePage + 1) * PAGE_SIZE)

  // ── Handlers ─────────────────────────────────────────────────────────────
  function setField(key) {
    return e => setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  function handleTransferPrice(e) {
    const val = e.target.value
    setForm(prev => recalcAll({ ...prev, transferPrice: val }))
  }

  function handleCostValue(valueKey, pctKey) {
    return e => {
      const val = e.target.value
      setForm(prev => {
        const base = num(prev.transferPrice)
        const pct  = base > 0 ? String(round2(num(val) / base * 100)) : ''
        return recalcAll({ ...prev, [valueKey]: val, [pctKey]: pct })
      })
    }
  }

  function handleCostPct(pctKey, valueKey) {
    return e => {
      const pct = e.target.value
      setForm(prev => {
        const base = num(prev.transferPrice)
        const val  = String(round2(num(pct) / 100 * base))
        return recalcAll({ ...prev, [pctKey]: pct, [valueKey]: val })
      })
    }
  }

  function handleTaxPct(e) {
    const pct = e.target.value
    setForm(prev => {
      const taxVal   = round2(num(prev.price) * num(pct) / 100)
      const taxValue = taxVal > 0 ? String(taxVal) : ''
      const next     = { ...prev, taxPct: pct, taxValue }
      const pvat     = round2(num(prev.price) + taxVal)
      return { ...next, ...calcInstallments(String(pvat), next) }
    })
  }

  function handleTaxValue(e) {
    const val = e.target.value
    setForm(prev => {
      const pct  = num(prev.price) > 0 ? String(round2(num(val) / num(prev.price) * 100)) : '0'
      const next = { ...prev, taxValue: val, taxPct: pct }
      const pvat = round2(num(prev.price) + num(val))
      return { ...next, ...calcInstallments(String(pvat), next) }
    })
  }

  function handlePricePct(e) {
    const pct = e.target.value
    setForm(prev => recalcAll({ ...prev, pricePct: pct }))
  }

  function handlePrice(e) {
    const val = e.target.value
    setForm(prev => {
      const tc       = num(prev.transferPrice) + num(prev.adminCostValue) + num(prev.spValue) + num(prev.transportValue)
      const pct      = tc > 0 ? String(round2((num(val) / tc - 1) * 100)) : ''
      const taxVal   = round2(num(val) * num(prev.taxPct) / 100)
      const taxValue = taxVal > 0 ? String(taxVal) : ''
      const next     = { ...prev, price: val, pricePct: pct, taxValue }
      const pvat     = round2(num(val) + taxVal)
      return { ...next, ...calcInstallments(String(pvat), next) }
    })
  }

  function handleInstPct(pctKey, valueKey) {
    return e => {
      const pct = e.target.value
      setForm(prev => {
        const pvat = num(prev.price) + num(prev.taxValue)
        const val  = pvat > 0 ? String(Math.ceil(pvat * num(pct) / 100)) : ''
        return { ...prev, [pctKey]: pct, [valueKey]: val }
      })
    }
  }

  function handleInstValue(valueKey, pctKey) {
    return e => {
      const val = e.target.value
      setForm(prev => {
        const pvat = num(prev.price) + num(prev.taxValue)
        const pct  = pvat > 0 ? String(round2(num(val) / pvat * 100)) : ''
        return { ...prev, [valueKey]: val, [pctKey]: pct }
      })
    }
  }

  function handleCategoryChange(value, id) {
    setForm(prev => ({ ...prev, category: value, item: '', model: '', modelId: null }))
    setSelectedCatId(id)
    setSelectedItemId(null)
    setItemOptions([])
    setModelOptions([])
    if (id) {
      const token = localStorage.getItem('accessToken')
      getItemsByCategory(id, token).then(res => {
        if (res.status === 200)
          setItemOptions((res.data.items ?? []).map(i => ({ id: i.id, label: i.name })))
      })
    }
  }

  function handleItemChange(value, id) {
    setForm(prev => ({ ...prev, item: value, model: '', modelId: null }))
    setSelectedItemId(id)
    setModelOptions([])
    if (id) {
      const token = localStorage.getItem('accessToken')
      getModelsByItem(id, token).then(res => {
        if (res.status === 200)
          setModelOptions((res.data.models ?? []).map(m => ({
            id: m.id, label: m.name, sub: m.size || undefined, size: m.size || null,
          })))
      })
    }
  }

  function handleModelChange(value, id, size) {
    setForm(prev => ({ ...prev, model: value, modelId: id ?? null, ...(size ? { size } : {}) }))
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
      modelId:        form.modelId ?? null,
      size:           form.size,
      transferPrice:  num(form.transferPrice),
      adminCostValue: num(form.adminCostValue),
      adminCostPct:   num(form.adminCostPct),
      spValue:        num(form.spValue),
      spPct:          num(form.spPct),
      transportValue: num(form.transportValue),
      transportPct:   num(form.transportPct),
      totalCost,
      taxPct:         num(form.taxPct),
      taxValue:       num(form.taxValue),
      price:          num(form.price),
      m6: form.m6, m12: form.m12, m18: form.m18, m24: form.m24,
    }
    if (editIndex !== null) {
      setEntries(prev => prev.map((e, i) => i === editIndex ? entry : e))
    } else {
      setEntries(prev => [...prev, entry])
    }
    setForm(EMPTY)
    setEditIndex(null)
    setSelectedCatId(null)
    setSelectedItemId(null)
    setItemOptions([])
    setModelOptions([])
  }

  function handleEdit(globalIndex) {
    const e = entries[globalIndex]
    setForm(apiEntryToForm({
      ...e,
      adminCost:            e.adminCostValue,
      salesAndPromotion:    e.spValue,
      salesAndPromotionPct: e.spPct,
      transport:            e.transportValue,
      month6: e.m6, month12: e.m12, month18: e.m18, month24: e.m24,
    }))
    setEditIndex(globalIndex)
    setSelectedCatId(null)
    setSelectedItemId(null)
    setItemOptions([])
    setModelOptions([])
  }

  function handleDelete(globalIndex) {
    if (editIndex === globalIndex) { setForm(EMPTY); setEditIndex(null) }
    else if (editIndex !== null && globalIndex < editIndex) setEditIndex(editIndex - 1)
    setEntries(prev => prev.filter((_, idx) => idx !== globalIndex))
  }

  async function handleSaveBadge() {
    if (entries.length === 0) return
    setSaving(true)
    try {
      const token = localStorage.getItem('accessToken')
      const payload = {
        id: badge?.id ?? null,
        items: entries.map(e => ({
          id:                   typeof e.id === 'number' ? e.id : null,
          modelId:              e.modelId ?? null,
          category:             e.category,
          itemName:             e.item,
          modelName:            e.model,
          size:                 e.size,
          transferPrice:        e.transferPrice,
          adminCost:            e.adminCostValue,
          adminCostPct:         e.adminCostPct,
          salesAndPromotion:    e.spValue,
          salesAndPromotionPct: e.spPct,
          transport:            e.transportValue,
          transportPct:         e.transportPct,
          totalCost:            e.totalCost,
          taxPct:               e.taxPct,
          taxValue:             e.taxValue,
          price:                round2(e.price + e.taxValue),
          month6:  e.m6  || null,
          month12: e.m12 || null,
          month18: e.m18 || null,
          month24: e.m24 || null,
        })),
      }
      const res = await saveBadge(payload, token)
      if (res.status === 200) {
        onSave()
      } else {
        alert(res.message || 'Failed to save badge')
      }
    } finally {
      setSaving(false)
    }
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
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Product Category<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <Combobox
              value={form.category}
              options={categoryOptions}
              onChange={handleCategoryChange}
              placeholder="e.g. Dining"
              className={inp}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Item<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <Combobox
              value={form.item}
              options={itemOptions}
              onChange={handleItemChange}
              placeholder="e.g. Dining Table"
              disabled={!form.category}
              className={form.category ? inp : dis}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Model<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <Combobox
              value={form.model}
              options={modelOptions}
              onChange={handleModelChange}
              placeholder="e.g. DT-6S-2024"
              disabled={!form.item}
              className={form.item ? inp : dis}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">Size</label>
            <input
              value={form.size}
              onChange={setField('size')}
              placeholder="e.g. L180 × W90 cm"
              className={inp}
            />
          </div>
        </div>
      </FormSection>

      {/* ── Section 2: Pricing ── */}
      <FormSection number="2" title="Pricing">
        <div className="grid grid-cols-[200px_1fr_1fr] gap-3 mb-1">
          <div />
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider">Value (LKR)</p>
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider">% of Transfer Price</p>
        </div>

        <PricingRow label="Transfer Price" required>
          <input
            type="number" min="0"
            value={form.transferPrice} onChange={handleTransferPrice}
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

        {/* Price — TotalCost × (1 + markup%) */}
        <PricingRow label="Price">
          <input
            type="number" min="0"
            value={form.price}
            onChange={handlePrice}
            placeholder="0"
            disabled={!enabled}
            className={enabled ? inp : dis}
          />
          <div className="flex items-center gap-2">
            <input
              type="number" min="0"
              value={form.pricePct}
              onChange={handlePricePct}
              placeholder="0"
              disabled={!enabled}
              className={`flex-1 ${enabled ? inp : dis}`}
            />
            <span className="text-xs text-[#888] shrink-0">%</span>
          </div>
        </PricingRow>

        {/* VAT — value + %, synced against Price */}
        <PricingRow label="VAT">
          <input
            type="number" min="0"
            value={form.taxValue}
            onChange={handleTaxValue}
            placeholder="0"
            disabled={!enabled}
            className={enabled ? inp : dis}
          />
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" max="99"
              value={form.taxPct}
              onChange={handleTaxPct}
              placeholder="0"
              disabled={!enabled}
              className={`flex-1 ${enabled ? inp : dis}`}
            />
            <span className="text-xs text-[#888] shrink-0">%</span>
          </div>
        </PricingRow>

        {/* Price with VAT — read-only, stored to DB */}
        <div className="grid grid-cols-[200px_1fr_1fr] gap-3 items-center py-2.5 mt-1 border-t-2 border-[#e5e5e5]">
          <span className="text-sm font-semibold text-[#222]">Price with VAT</span>
          <div className={rdonly}>{LKR(round2(num(form.price) + num(form.taxValue)))}</div>
          <div />
        </div>
      </FormSection>

      {/* ── Section 3: Installments ── */}
      <FormSection number="3" title="Installments">
        <div className="grid grid-cols-[200px_1fr_1fr] gap-3 mb-1">
          <div />
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider">Value (LKR)</p>
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider">% of Price with VAT</p>
        </div>
        {[
          { label: '6 Month',  vk: 'm6',  pk: 'm6Pct'  },
          { label: '12 Month', vk: 'm12', pk: 'm12Pct' },
          { label: '18 Month', vk: 'm18', pk: 'm18Pct' },
          { label: '24 Month', vk: 'm24', pk: 'm24Pct' },
        ].map(({ label, vk, pk }) => (
          <PricingRow key={vk} label={label}>
            <input
              type="number" min="0"
              value={form[vk]}
              onChange={handleInstValue(vk, pk)}
              placeholder="0"
              disabled={!enabled}
              className={enabled ? inp : dis}
            />
            <div className="flex items-center gap-2">
              <input
                type="number" min="0"
                value={form[pk]}
                onChange={handleInstPct(pk, vk)}
                placeholder="0"
                disabled={!enabled}
                className={`flex-1 ${enabled ? inp : dis}`}
              />
              <span className="text-xs text-[#888] shrink-0">%</span>
            </div>
          </PricingRow>
        ))}
      </FormSection>

      {/* Add / Update button */}
      <div className="flex justify-end">
        <Button type="button" onClick={handleAddItem}>
          {editIndex !== null ? 'Update Item' : 'Add Item'}
        </Button>
      </div>

      {/* ── Entries table ── */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-0 bg-white rounded-xl border border-[#d8d8d8] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-sm">
              <thead>
                <tr className="bg-[#14213d] text-white text-left">
                  {TABLE_HEADERS.map(h => (
                    <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((e, pageIdx) => {
                  const globalIndex = tablePage * PAGE_SIZE + pageIdx
                  return (
                    <tr
                      key={e.id}
                      className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                        globalIndex === editIndex ? 'bg-[#fffbec]' : pageIdx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
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
                      <td className="px-4 py-3 text-[#444]">{e.taxPct}%</td>
                      <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR(round2(e.price + e.taxValue))}</td>
                      <td className="px-4 py-3 text-[#555]">{e.m6  || '—'}</td>
                      <td className="px-4 py-3 text-[#555]">{e.m12 || '—'}</td>
                      <td className="px-4 py-3 text-[#555]">{e.m18 || '—'}</td>
                      <td className="px-4 py-3 text-[#555]">{e.m24 || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className={iconBtn}   title="Edit"   onClick={() => handleEdit(globalIndex)}><Pencil size={15} /></button>
                          <button className={deleteBtn} title="Delete" onClick={() => handleDelete(globalIndex)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e5e5] bg-white text-xs text-[#666]">
              <span>
                Showing {tablePage * PAGE_SIZE + 1}–{Math.min((tablePage + 1) * PAGE_SIZE, entries.length)} of {entries.length} items
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTablePage(p => Math.max(0, p - 1))}
                  disabled={tablePage === 0}
                  className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >←</button>
                <span className="text-[#444] font-medium">Page {tablePage + 1} of {totalPages}</span>
                <button
                  onClick={() => setTablePage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={tablePage >= totalPages - 1}
                  className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >→</button>
              </div>
            </div>
          )}
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
          disabled={entries.length === 0 || saving}
          onClick={handleSaveBadge}
        >
          {saving ? 'Saving…' : 'Save Badge'}
        </Button>
      </div>

    </div>
  )
}
