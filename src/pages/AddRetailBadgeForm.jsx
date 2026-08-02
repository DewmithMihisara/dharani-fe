import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getCategories, getItemsByCategory, getModelsByItem } from '../api/inventoryApi'
import { deleteBadgeItem, getItemsByBadge, saveItem } from '../api/retailBadgeApi'
import Button from '../components/Button'
import Combobox from '../components/Combobox'
import FormSection from '../components/FormSection'
import { capitalizeWords } from '../utils/text'

function LKR(n) {
  return `LKR ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function round2(n) { return Math.round(n * 100) / 100 }
function num(v) { return Number(v) || 0 }

function fmtInput(v) {
  if (v === '' || v == null) return ''
  const [int, dec] = String(v).split('.')
  const n = parseInt(int || '0', 10)
  if (isNaN(n)) return v
  const formatted = n.toLocaleString('en-LK')
  return dec !== undefined ? `${formatted}.${dec}` : formatted
}

function parseInput(v) {
  const raw = String(v).replace(/,/g, '').replace(/[^0-9.]/g, '')
  const dot = raw.indexOf('.')
  return dot !== -1 ? raw.slice(0, dot + 3) : raw
}

const EMPTY = {
  category: '', item: '', model: '', modelId: null, size: '', name: '',
  transferPrice: '',
  adminCostValue: '', adminCostPct: '',
  spValue: '', spPct: '',
  transportValue: '', transportPct: '',
  taxPct: '18', taxValue: '',
  pricePct: '', price: '',
}

const base = 'w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors duration-100'
const inp = `${base} border-[#e5e5e5] bg-white text-[#000] placeholder-[#bbb] focus:border-[#14213d]`
const rdonly = `${base} border-[#e5e5e5] bg-[#f5f5f5] font-semibold text-[#14213d] cursor-default select-none`
const dis = `${base} border-[#eee] bg-[#fafafa] text-[#bbb] cursor-not-allowed`

const iconBtn = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'
const deleteBtn = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-red-600 hover:bg-red-50 cursor-pointer'

const TABLE_HEADERS = [
  'Category', 'Item', 'Model', 'Name', 'Size',
  'Transfer Price', 'Admin Cost', 'S&P', 'Transport',
  'Total Cost', 'Tax%', 'Price', 'Actions',
]

function calcPrice(prev, overrides = {}) {
  const f = { ...prev, ...overrides }
  const tc = num(f.transferPrice) + num(f.adminCostValue) + num(f.spValue) + num(f.transportValue)
  const pct = num(f.pricePct)
  if (pct >= 100) return String(tc)
  return String(round2(tc / (1 - pct / 100)))
}

function recalcAll(next) {
  const price = calcPrice(next)
  const taxVal = round2(num(price) * num(next.taxPct) / 100)
  const taxValue = taxVal > 0 ? String(taxVal) : ''
  return { ...next, price, taxValue }
}

function PricingRowSm({ label, required, children }) {
  return (
    <div className="grid grid-cols-[86px_1fr_50px] gap-1.5 items-center py-1 border-b border-[#f0f0f0] last:border-0">
      <span className="text-xs font-medium text-[#444] truncate">
        {label}{required && <span className="text-[#fca311] ml-0.5">*</span>}
      </span>
      {children}
    </div>
  )
}

function CompactSection({ number, title, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#d8d8d8]">
      <div className="px-4 py-2 border-b border-[#e5e5e5] flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-[#14213d] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <h2 className="text-xs font-semibold text-[#14213d] tracking-wide">{title}</h2>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

function apiEntryToForm(e) {
  const taxAmt = num(e.taxValue)
  const pvat = num(e.price)                    // stored as price_before_vat + tax
  const priceVal = round2(pvat - taxAmt)           // price before VAT (what form.price holds)
  const tc = num(e.transferPrice) + num(e.adminCost) + num(e.salesAndPromotion) + num(e.transport)
  const pricePct = tc > 0 && priceVal > tc ? String(round2((1 - tc / priceVal) * 100)) : ''
  return {
    category: e.category ?? '',
    item: e.itemName ?? '',
    model: e.modelName ?? '',
    modelId: e.modelId ?? null,
    size: e.size ?? '',
    name: e.name ?? '',
    transferPrice: String(e.transferPrice ?? ''),
    adminCostValue: String(e.adminCost ?? ''),
    adminCostPct: String(e.adminCostPct ?? ''),
    spValue: String(e.salesAndPromotion ?? ''),
    spPct: String(e.salesAndPromotionPct ?? ''),
    transportValue: String(e.transport ?? ''),
    transportPct: String(e.transportPct ?? ''),
    taxPct: String(e.taxPct ?? '0'),
    taxValue: String(taxAmt),
    pricePct,
    price: String(priceVal),
  }
}

export default function AddRetailBadgeForm({ badge, onBack, onSave }) {
  const [form, setForm] = useState(EMPTY)
  const [editItemId, setEditItemId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState([])
  const [itemOptions, setItemOptions] = useState([])
  const [modelOptions, setModelOptions] = useState([])

  // Server-driven items table state
  const [currentBadgeId, setCurrentBadgeId] = useState(badge?.id ?? null)
  const [items, setItems] = useState([])
  const [itemsTotal, setItemsTotal] = useState(0)
  const [itemsOffset, setItemsOffset] = useState(0)
  const [itemsLimit, setItemsLimit] = useState(10)
  const [itemsLoading, setItemsLoading] = useState(false)

  const token = localStorage.getItem('accessToken')

  const loadItems = useCallback(async (badgeId, offset, limit) => {
    if (!badgeId) { setItems([]); setItemsTotal(0); return }
    setItemsLoading(true)
    try {
      const res = await getItemsByBadge(badgeId, { offset, limit }, token)
      if (res.status === 200) {
        setItems(res.data.items ?? [])
        setItemsTotal(res.data.total ?? 0)
      }
    } finally {
      setItemsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadItems(currentBadgeId, itemsOffset, itemsLimit)
  }, [currentBadgeId, itemsOffset, itemsLimit, loadItems])

  useEffect(() => {
    getCategories(token).then(res => {
      if (res.status === 200)
        setCategoryOptions((res.data.categories ?? []).map(c => ({ id: c.id, label: c.name })))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Computed ─────────────────────────────────────────────────────────────
  const tp = num(form.transferPrice)
  const adminVal = num(form.adminCostValue)
  const spVal = num(form.spValue)
  const transpVal = num(form.transportValue)
  const totalCost = tp + adminVal + spVal + transpVal
  const enabled = tp > 0

  const totalPages = Math.max(1, Math.ceil(itemsTotal / itemsLimit))
  const currentPage = Math.floor(itemsOffset / itemsLimit) + 1
  const fromItem = itemsTotal === 0 ? 0 : itemsOffset + 1
  const toItem = Math.min(itemsOffset + itemsLimit, itemsTotal)

  // ── Handlers ─────────────────────────────────────────────────────────────
  function setField(key) {
    return e => setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  function handleTransferPrice(e) {
    const val = parseInput(e.target.value)
    setForm(prev => {
      const base = num(val)
      const adminCostValue = prev.adminCostPct ? String(round2(num(prev.adminCostPct) / 100 * base)) : ''
      const spValue = prev.spPct ? String(round2(num(prev.spPct) / 100 * base)) : ''
      const transportValue = prev.transportPct ? String(round2(num(prev.transportPct) / 100 * base)) : ''
      return recalcAll({ ...prev, transferPrice: val, adminCostValue, spValue, transportValue })
    })
  }

  function handleCostValue(valueKey, pctKey) {
    return e => {
      const val = parseInput(e.target.value)
      setForm(prev => {
        const base = num(prev.transferPrice)
        const pct = base > 0 ? String(round2(num(val) / base * 100)) : ''
        return recalcAll({ ...prev, [valueKey]: val, [pctKey]: pct })
      })
    }
  }

  function handleCostPct(pctKey, valueKey) {
    return e => {
      const pct = e.target.value
      setForm(prev => {
        const base = num(prev.transferPrice)
        const val = String(round2(num(pct) / 100 * base))
        return recalcAll({ ...prev, [pctKey]: pct, [valueKey]: val })
      })
    }
  }

  function handleTaxPct(e) {
    const pct = e.target.value
    setForm(prev => {
      const taxVal = round2(num(prev.price) * num(pct) / 100)
      const taxValue = taxVal > 0 ? String(taxVal) : ''
      return { ...prev, taxPct: pct, taxValue }
    })
  }

  function handleTaxValue(e) {
    const val = parseInput(e.target.value)
    setForm(prev => {
      const pct = num(prev.price) > 0 ? String(round2(num(val) / num(prev.price) * 100)) : '0'
      return { ...prev, taxValue: val, taxPct: pct }
    })
  }

  function handlePricePct(e) {
    const pct = e.target.value
    setForm(prev => recalcAll({ ...prev, pricePct: pct }))
  }

  function handlePrice(e) {
    const val = parseInput(e.target.value)
    setForm(prev => {
      const tc = num(prev.transferPrice) + num(prev.adminCostValue) + num(prev.spValue) + num(prev.transportValue)
      const pct = tc > 0 && num(val) > tc ? String(round2((1 - tc / num(val)) * 100)) : ''
      const taxVal = round2(num(val) * num(prev.taxPct) / 100)
      const taxValue = taxVal > 0 ? String(taxVal) : ''
      return { ...prev, price: val, pricePct: pct, taxValue }
    })
  }

  function handleCategoryChange(value, id) {
    const v = capitalizeWords(value)
    setForm(prev => ({ ...prev, category: v, item: '', model: '', modelId: null }))
    setItemOptions([])
    setModelOptions([])
    if (id) {
      getItemsByCategory(id, token).then(res => {
        if (res.status === 200)
          setItemOptions((res.data.items ?? []).map(i => ({ id: i.id, label: i.name })))
      })
    }
  }

  function handleItemChange(value, id) {
    const v = capitalizeWords(value)
    setForm(prev => ({ ...prev, item: v, model: '', modelId: null }))
    setModelOptions([])
    if (id) {
      getModelsByItem(id, token).then(res => {
        if (res.status === 200)
          setModelOptions((res.data.models ?? []).map(m => ({
            id: m.id, label: m.name, sub: m.size || undefined, size: m.size || null,
          })))
      })
    }
  }

  function handleModelChange(value, id, size) {
    setForm(prev => ({ ...prev, model: value.toUpperCase(), modelId: id ?? null, ...(size ? { size } : {}) }))
  }

  async function handleAddItem() {
    const { category, item, model, transferPrice } = form
    if (!category || !item || !model || !transferPrice) {
      alert('Please fill in Category, Item, Model, and Transfer Price.')
      return
    }
    setSaving(true)
    try {
      const dto = {
        badgeId: currentBadgeId,
        item: {
          id: editItemId,
          modelId: form.modelId ?? null,
          name: form.name || null,
          category: form.category,
          itemName: form.item,
          modelName: form.model,
          size: form.size,
          transferPrice: num(form.transferPrice),
          adminCost: num(form.adminCostValue),
          adminCostPct: num(form.adminCostPct),
          salesAndPromotion: num(form.spValue),
          salesAndPromotionPct: num(form.spPct),
          transport: num(form.transportValue),
          transportPct: num(form.transportPct),
          totalCost,
          taxPct: num(form.taxPct),
          taxValue: num(form.taxValue),
          price: round2(num(form.price) + num(form.taxValue)),
        },
      }
      const res = await saveItem(dto, token)
      if (res.status === 200) {
        if (!currentBadgeId) setCurrentBadgeId(res.data.badgeId)
        setForm(EMPTY)
        setEditItemId(null)
        setItemOptions([])
        setModelOptions([])
        const bid = currentBadgeId ?? res.data.badgeId
        loadItems(bid, itemsOffset, itemsLimit)
      } else {
        alert(res.message || 'Failed to save item')
      }
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(item) {
    setEditItemId(item.id)
    setForm(apiEntryToForm(item))
    setItemOptions([])
    setModelOptions([])
  }

  async function handleDelete(itemId) {
    const res = await deleteBadgeItem(itemId, token)
    if (res.status === 200) {
      if (editItemId === itemId) { setForm(EMPTY); setEditItemId(null) }
      const newTotal = itemsTotal - 1
      const maxOffset = Math.max(0, Math.floor((newTotal - 1) / itemsLimit) * itemsLimit)
      const safeOffset = Math.min(itemsOffset, maxOffset)
      if (safeOffset !== itemsOffset) {
        setItemsOffset(safeOffset)
      } else {
        loadItems(currentBadgeId, itemsOffset, itemsLimit)
      }
    } else {
      alert(res.message || 'Failed to delete item')
    }
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#14213d] transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Retail Items
        </button>
        <span className="text-[#ccc] text-sm">/</span>
        <h1 className="text-lg font-semibold text-[#14213d]">
          {badge ? `Edit Badge ${badge.badgeNumber}` : 'Add Retail Badge'}
        </h1>
      </div>

      {/* ── Section 1: Item Details ── */}
      <FormSection number="1" title="Item Details">
        <div className="grid grid-cols-5 gap-3">
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

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">Name <span className="text-[#999] font-normal">(optional)</span></label>
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: capitalizeWords(e.target.value) }))}
              placeholder="Custom item name"
              className={inp}
            />
          </div>
        </div>
      </FormSection>

      {/* ── Section 2: Pricing ── */}
      <CompactSection number="2" title="Pricing">
        <div className="grid grid-cols-2 divide-x divide-[#e5e5e5]">

          {/* LEFT — input costs */}
          <div className="pr-4">
            <div className="grid grid-cols-[86px_1fr_50px] gap-1.5 mb-1">
              <div />
              <p className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">Value (LKR)</p>
              <p className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">%</p>
            </div>

            <PricingRowSm label="Transfer Price" required>
              <input
                type="text"
                value={fmtInput(form.transferPrice)} onChange={handleTransferPrice}
                placeholder="0" className={inp}
              />
              <div />
            </PricingRowSm>

            {[
              { label: 'Admin Cost', vk: 'adminCostValue', pk: 'adminCostPct' },
              { label: 'S&P', vk: 'spValue', pk: 'spPct' },
              { label: 'Transport', vk: 'transportValue', pk: 'transportPct' },
            ].map(({ label, vk, pk }) => (
              <PricingRowSm key={vk} label={label}>
                <input
                  type="text"
                  value={fmtInput(form[vk])}
                  onChange={handleCostValue(vk, pk)}
                  placeholder="0"
                  disabled={!enabled}
                  className={enabled ? inp : dis}
                />
                <input
                  type="number" min="0"
                  value={form[pk]}
                  onChange={handleCostPct(pk, vk)}
                  placeholder="0"
                  disabled={!enabled}
                  className={enabled ? inp : dis}
                />
              </PricingRowSm>
            ))}
          </div>

          {/* RIGHT — calculated totals */}
          <div className="pl-4">
            <div className="grid grid-cols-[86px_1fr_50px] gap-1.5 mb-1">
              <div />
              <p className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">Value (LKR)</p>
              <p className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">%</p>
            </div>

            {/* Total Cost — read-only */}
            <div className="grid grid-cols-[86px_1fr_50px] gap-1.5 items-center py-1 border-b border-[#f0f0f0]">
              <span className="text-xs font-semibold text-[#222]">Total Cost</span>
              <div className={rdonly}>{LKR(totalCost)}</div>
              <div />
            </div>

            <PricingRowSm label="Price">
              <input
                type="text"
                value={fmtInput(form.price)}
                onChange={handlePrice}
                placeholder="0"
                disabled={!enabled}
                className={enabled ? inp : dis}
              />
              <input
                type="number" min="0"
                value={form.pricePct}
                onChange={handlePricePct}
                placeholder="0"
                disabled={!enabled}
                className={enabled ? inp : dis}
              />
            </PricingRowSm>

            <PricingRowSm label="VAT">
              <input
                type="text"
                value={fmtInput(form.taxValue)}
                onChange={handleTaxValue}
                placeholder="0"
                disabled={!enabled}
                className={enabled ? inp : dis}
              />
              <input
                type="number" min="0" max="99"
                value={form.taxPct}
                onChange={handleTaxPct}
                placeholder="0"
                disabled={!enabled}
                className={enabled ? inp : dis}
              />
            </PricingRowSm>

            {/* Price with VAT — read-only, this is the final retail sell price */}
            <div className="grid grid-cols-[86px_1fr_50px] gap-1.5 items-center py-1 mt-1 border-t-2 border-[#e5e5e5]">
              <span className="text-xs font-semibold text-[#222]">Price with VAT</span>
              <div className={rdonly}>{LKR(round2(num(form.price) + num(form.taxValue)))}</div>
              <div />
            </div>
          </div>

        </div>
      </CompactSection>

      {/* Add / Update button */}
      <div className="flex justify-end">
        <Button type="button" onClick={handleAddItem} disabled={saving}>
          {saving ? 'Saving…' : editItemId !== null ? 'Update Item' : 'Add Item'}
        </Button>
      </div>

      {/* ── Items table (API-driven) ── */}
      {(itemsTotal > 0 || itemsLoading) && (
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
                {itemsLoading ? (
                  <tr>
                    <td colSpan={TABLE_HEADERS.length} className="px-4 py-6 text-center text-sm text-[#bbb]">
                      Loading…
                    </td>
                  </tr>
                ) : items.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${e.id === editItemId ? 'bg-[#fffbec]' : i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
                      }`}
                  >
                    <td className="px-4 py-3 text-[#555]">{e.category}</td>
                    <td className="px-4 py-3 font-semibold text-[#14213d] whitespace-nowrap">{e.itemName}</td>
                    <td className="px-4 py-3 text-[#555]">{e.modelName}</td>
                    <td className="px-4 py-3 text-[#555]">{e.name || '—'}</td>
                    <td className="px-4 py-3 text-[#555]">{e.size}</td>
                    <td className="px-4 py-3 text-[#444]">{LKR(e.transferPrice)}</td>
                    <td className="px-4 py-3 text-[#444] whitespace-nowrap">
                      {LKR(e.adminCost)} <span className="text-xs text-[#999]">({e.adminCostPct}%)</span>
                    </td>
                    <td className="px-4 py-3 text-[#444] whitespace-nowrap">
                      {LKR(e.salesAndPromotion)} <span className="text-xs text-[#999]">({e.salesAndPromotionPct}%)</span>
                    </td>
                    <td className="px-4 py-3 text-[#444] whitespace-nowrap">
                      {LKR(e.transport)} <span className="text-xs text-[#999]">({e.transportPct}%)</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR(e.totalCost)}</td>
                    <td className="px-4 py-3 text-[#444]">{e.taxPct}%</td>
                    <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR(e.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className={iconBtn} title="Edit" onClick={() => handleEdit(e)}><Pencil size={15} /></button>
                        <button className={deleteBtn} title="Delete" onClick={() => handleDelete(e.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e5e5] bg-white text-xs text-[#666]">
            <span>
              {itemsTotal === 0 ? 'No items' : `Showing ${fromItem}–${toItem} of ${itemsTotal} item${itemsTotal !== 1 ? 's' : ''}`}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[#888]">Rows per page:</span>
                <select
                  value={itemsLimit}
                  onChange={e => { setItemsLimit(Number(e.target.value)); setItemsOffset(0) }}
                  className="border border-[#e5e5e5] rounded-md px-2 py-1 text-xs text-[#444] bg-white focus:outline-none focus:border-[#14213d] cursor-pointer"
                >
                  {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setItemsOffset(o => Math.max(0, o - itemsLimit))}
                  disabled={itemsOffset === 0}
                  className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >←</button>
                <span className="text-[#444] font-medium">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setItemsOffset(o => o + itemsLimit)}
                  disabled={currentPage >= totalPages}
                  className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >→</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
