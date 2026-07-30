import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getItemsByCategory, getModelsByItem, getCategories } from '../api/inventoryApi'
import { getDisplayItemSuppliers, saveDisplayItem, saveDisplayItemSupplier } from '../api/displayItemApi'
import Button from '../components/Button'
import Combobox from '../components/Combobox'
import FormSection from '../components/FormSection'
import SupplierCombobox from '../components/SupplierCombobox'
import AddSupplierDialog from '../components/AddSupplierDialog'
import { capitalizeWords } from '../utils/text'

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
  price: '', qty: '1',
  supplierId: null, supplierName: '',
}

const base = 'w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors duration-100'
const inp = `${base} border-[#e5e5e5] bg-white text-[#000] placeholder-[#bbb] focus:border-[#14213d]`
const dis = `${base} border-[#eee] bg-[#fafafa] text-[#bbb] cursor-not-allowed`

export default function AddDisplayItemForm({ onBack }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState([])
  const [itemOptions, setItemOptions] = useState([])
  const [modelOptions, setModelOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [addSupplierPrefill, setAddSupplierPrefill] = useState(null)

  const token = localStorage.getItem('accessToken')

  useEffect(() => {
    getCategories(token).then(res => {
      if (res.status === 200)
        setCategoryOptions((res.data.categories ?? []).map(c => ({ id: c.id, label: c.name })))
    })
    getDisplayItemSuppliers(token).then(res => {
      if (res.status === 200)
        setSupplierOptions((res.data.suppliers ?? []).map(s => ({ id: s.id, label: s.name })))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  function handlePrice(e) {
    setForm(prev => ({ ...prev, price: parseInput(e.target.value) }))
  }

  function handleQty(e) {
    const v = e.target.value.replace(/[^0-9]/g, '')
    setForm(prev => ({ ...prev, qty: v }))
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

  async function handleSave() {
    const { category, item, model, price, qty, supplierId } = form
    if (!category || !item || !model || !price) {
      alert('Please fill in Product Category, Item, Model, and Price.')
      return
    }
    if (!qty || num(qty) < 1) {
      alert('Please enter a valid Qty.')
      return
    }
    if (!supplierId) {
      alert('Please select an existing supplier, or add a new one using the + button.')
      return
    }
    setSaving(true)
    try {
      const dto = {
        id: null,
        modelId: form.modelId ?? null,
        category: form.category,
        itemName: form.item,
        modelName: form.model,
        size: form.size || null,
        name: form.name || null,
        price: num(form.price),
        qty: parseInt(form.qty, 10) || 1,
        supplierId: form.supplierId,
      }
      const res = await saveDisplayItem(dto, token)
      if (res.status === 200) {
        onBack()
      } else {
        alert(res.message || 'Failed to save item')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#14213d] transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Display Items
        </button>
        <span className="text-[#ccc] text-sm">/</span>
        <h1 className="text-lg font-semibold text-[#14213d]">Add Item</h1>
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
            <label className="text-sm font-medium text-[#222]">Size <span className="text-[#999] font-normal">(optional)</span></label>
            <input
              value={form.size}
              onChange={e => setForm(prev => ({ ...prev, size: e.target.value }))}
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

      {/* ── Section 2: Price ── */}
      <FormSection number="2" title="Price">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Price per Item (LKR)<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={fmtInput(form.price)}
              onChange={handlePrice}
              placeholder="0"
              className={inp}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Qty<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={form.qty}
              onChange={handleQty}
              placeholder="1"
              className={inp}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">Total Price (LKR)</label>
            <input
              type="text"
              value={fmtInput((num(form.price) * num(form.qty)) || 0)}
              disabled
              className={dis}
            />
          </div>
        </div>
      </FormSection>

      {/* ── Section 3: Supplier ── */}
      <FormSection number="3" title="Supplier">
        <div className="flex flex-col gap-1.5 max-w-sm">
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

      {/* ── Actions ── */}
      <div className="bg-white border border-[#d8d8d8] rounded-xl px-6 py-4 flex items-center justify-between">
        <p className="text-xs text-[#aaa]">
          All fields marked <span className="text-[#fca311] font-semibold">*</span> are required
        </p>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={onBack} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {addSupplierPrefill !== null && (
        <AddSupplierDialog
          initialName={addSupplierPrefill}
          onClose={() => setAddSupplierPrefill(null)}
          onSaved={handleSupplierSaved}
          onSave={dto => saveDisplayItemSupplier(dto, token)}
        />
      )}

    </div>
  )
}
