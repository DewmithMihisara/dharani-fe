import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { deleteFreeItem, getFreeItemsByBadge, getSuppliers, saveFreeItem, saveSupplier } from '../api/freeItemApi'
import Button from '../components/Button'
import FormSection from '../components/FormSection'
import ProjectPicker from '../components/ProjectPicker'
import SupplierCombobox from '../components/SupplierCombobox'
import AddSupplierDialog from '../components/AddSupplierDialog'
import { capitalizeWords } from '../utils/text'

function LKR(n) {
  return `LKR ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
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
  category: '', item: '', model: '', size: '', name: '',
  price: '',
  freeItemId: null,
  supplierId: null, supplierName: '',
}

const base = 'w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors duration-100'
const inp = `${base} border-[#e5e5e5] bg-white text-[#000] placeholder-[#bbb] focus:border-[#14213d]`

const iconBtn = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-[#14213d] hover:bg-[#f0f0f0] cursor-pointer'
const deleteBtn = 'p-1.5 rounded-md transition-colors duration-100 text-[#999] hover:text-red-600 hover:bg-red-50 cursor-pointer'

const TABLE_HEADERS = ['Category', 'Item', 'Model', 'Size', 'Name', 'Supplier', 'Price', 'Actions']

function apiEntryToForm(e) {
  return {
    category: e.productCategory ?? '',
    item: e.item ?? '',
    model: e.model ?? '',
    size: e.size ?? '',
    name: e.name ?? '',
    price: String(e.price ?? ''),
    freeItemId: e.freeItemId ?? null,
    supplierId: e.supplierId ?? null,
    supplierName: e.supplierName ?? '',
  }
}

export default function AddFreeItemBadgeForm({ badge, initialContext = null, onBack, onSave }) {
  const [form, setForm] = useState(EMPTY)
  const [ctx, setCtx] = useState(initialContext ?? { companyId: null, companyName: '', branchId: null, branchName: '', projectId: null, projectName: '' })
  const [editItemId, setEditItemId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [supplierOptions, setSupplierOptions] = useState([])
  const [addSupplierPrefill, setAddSupplierPrefill] = useState(null)

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
      const res = await getFreeItemsByBadge(badgeId, { offset, limit }, token)
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

  function loadSuppliers() {
    getSuppliers(token).then(res => {
      if (res.status === 200)
        setSupplierOptions((res.data.suppliers ?? []).map(s => ({ id: s.id, label: s.name })))
    })
  }

  useEffect(() => { loadSuppliers() }, [])

  const totalPages = Math.max(1, Math.ceil(itemsTotal / itemsLimit))
  const currentPage = Math.floor(itemsOffset / itemsLimit) + 1
  const fromItem = itemsTotal === 0 ? 0 : itemsOffset + 1
  const toItem = Math.min(itemsOffset + itemsLimit, itemsTotal)

  function setField(key) {
    return e => setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  function handlePrice(e) {
    setForm(prev => ({ ...prev, price: parseInput(e.target.value) }))
  }

  function handleSupplierChange(value, id) {
    setForm(prev => ({ ...prev, supplierName: value, supplierId: id ?? null }))
  }

  function handleAddNewSupplier(typedText) {
    setAddSupplierPrefill(typedText || '')
  }

  function handleSupplierSaved(supplier) {
    setForm(prev => ({ ...prev, supplierName: supplier.name, supplierId: supplier.id }))
    setSupplierOptions(prev => [...prev, { id: supplier.id, label: supplier.name }])
    setAddSupplierPrefill(null)
  }

  async function handleAddItem() {
    const { category, item, model, price, supplierId } = form
    if (!currentBadgeId && !ctx.projectId) {
      alert('Please select Company, Branch, and Project first.')
      return
    }
    if (!category || !item || !model || !price) {
      alert('Please fill in Product Category, Item, Model, and Price.')
      return
    }
    if (!supplierId) {
      alert('Please select an existing supplier, or add a new one using the + button.')
      return
    }
    setSaving(true)
    try {
      const dto = {
        badgeId: currentBadgeId,
        projectId: ctx.projectId,
        item: {
          id: editItemId,
          freeItemId: form.freeItemId ?? null,
          productCategory: form.category,
          item: form.item,
          model: form.model,
          size: form.size || null,
          name: form.name || null,
          price: num(form.price),
          supplierId: form.supplierId,
        },
      }
      const res = await saveFreeItem(dto, token)
      if (res.status === 200) {
        if (!currentBadgeId) setCurrentBadgeId(res.data.badgeId)
        setForm(EMPTY)
        setEditItemId(null)
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
  }

  async function handleDelete(itemId) {
    const res = await deleteFreeItem(itemId, token)
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
          Free Items
        </button>
        <span className="text-[#ccc] text-sm">/</span>
        <h1 className="text-lg font-semibold text-[#14213d]">
          {badge ? `Edit Free Item Badge ${badge.freeItemBadgeNumber}` : 'Add Free Item Badge'}
        </h1>
      </div>

      {/* ── Badge Location ── */}
      {!badge && (
        <FormSection number="0" title="Badge Location">
          <ProjectPicker value={ctx} onChange={setCtx} disabled={!!currentBadgeId} excludeEndedProjects />
          {!!currentBadgeId && (
            <p className="text-[11px] text-[#999] mt-2">Location is locked once the badge has items.</p>
          )}
        </FormSection>
      )}

      {/* ── Section 1: Item Details ── */}
      <FormSection number="1" title="Item Details">
        <div className="grid grid-cols-5 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Product Category<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <input
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: capitalizeWords(e.target.value) }))}
              placeholder="e.g. Kitchenware"
              className={inp}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Item<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <input
              value={form.item}
              onChange={e => setForm(prev => ({ ...prev, item: capitalizeWords(e.target.value) }))}
              placeholder="e.g. Cooking Pot"
              className={inp}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Model<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <input
              value={form.model}
              onChange={e => setForm(prev => ({ ...prev, model: e.target.value.toUpperCase() }))}
              placeholder="e.g. CP-5L"
              className={inp}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">Size <span className="text-[#999] font-normal">(optional)</span></label>
            <input
              value={form.size}
              onChange={setField('size')}
              placeholder="e.g. 5L"
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

      {/* ── Sections 2 & 3: Price + Supplier ── */}
      <div className="grid grid-cols-2 gap-4">
        <FormSection number="2" title="Price">
          <div className="flex flex-col gap-1.5 max-w-xs">
            <label className="text-sm font-medium text-[#222]">
              Price (LKR)<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={fmtInput(form.price)}
              onChange={handlePrice}
              placeholder="0"
              className={inp}
            />
          </div>
        </FormSection>

        <FormSection number="3" title="Supplier">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Supplier<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <SupplierCombobox
              value={form.supplierName}
              options={supplierOptions}
              onChange={handleSupplierChange}
              onAddNew={handleAddNewSupplier}
              placeholder="Search supplier…"
              className={inp}
            />
          </div>
        </FormSection>
      </div>

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
                    <td className="px-4 py-3 text-[#555]">{e.productCategory}</td>
                    <td className="px-4 py-3 font-semibold text-[#14213d] whitespace-nowrap">{e.item}</td>
                    <td className="px-4 py-3 text-[#555]">{e.model}</td>
                    <td className="px-4 py-3 text-[#555]">{e.size}</td>
                    <td className="px-4 py-3 text-[#555]">{e.name || '—'}</td>
                    <td className="px-4 py-3 text-[#555]">{e.supplierName}</td>
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

      {addSupplierPrefill !== null && (
        <AddSupplierDialog
          initialName={addSupplierPrefill}
          onClose={() => setAddSupplierPrefill(null)}
          onSaved={handleSupplierSaved}
          onSave={dto => saveSupplier(dto, token)}
        />
      )}

    </div>
  )
}
