import { ArrowLeft, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { apiPost } from '../api/api'
import { getApprovedItems } from '../api/retailBadgeApi'
import { getCompanies, getBranchesByCompany } from '../api/orderApi'
import Button from '../components/Button'
import FormSection from '../components/FormSection'
import Input from '../components/Input'
import Select from '../components/Select'
import OrderSavedDialog from '../components/OrderSavedDialog'
import { isValidNic } from '../utils/nic'
import { capitalizeWords, buildFullNameWithInitials } from '../utils/text'

const TITLE_OPTIONS = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Miss', label: 'Miss' },
]

const INITIAL_FORM = {
  title: '', surname: '', otherNames: '', fullNameWithInitials: '', nicNumber: '',
  mobileNumber1: '', mobileNumber2: '',
  permanentAddress1: '', permanentAddress2: '', permanentAddress3: '', permanentAddress4: '',
  isEmployee: false,
  companyId: '', companyName: '', branchId: '', branchName: '', employeeId: '',
}

const HAS_DIGIT = /\d/
const HAS_LETTER = /[a-zA-Z]/

function validate(form) {
  const errs = {}
  ;['surname', 'otherNames', 'fullNameWithInitials'].forEach(k => {
    if (form[k] && HAS_DIGIT.test(form[k])) errs[k] = 'Name cannot contain numbers'
  })
  ;['mobileNumber1', 'mobileNumber2'].forEach(k => {
    if (form[k] && HAS_LETTER.test(form[k])) errs[k] = 'Phone number cannot contain letters'
  })
  if (form.nicNumber && !isValidNic(form.nicNumber)) errs.nicNumber = 'Invalid NIC number'
  return errs
}

function field(form, setForm, key, extra = {}) {
  return { id: key, value: form[key], onChange: e => setForm(f => ({ ...f, [key]: e.target.value })), ...extra }
}

function LKR(n) {
  return `LKR ${Number(n).toLocaleString('en-LK')}`
}

function apiToFormState(data) {
  const s = v => (v == null ? '' : String(v))
  return {
    title: s(data.title),
    surname: s(data.surname),
    otherNames: s(data.otherNames),
    fullNameWithInitials: s(data.fullNameWithInitials),
    nicNumber: s(data.nicNumber),
    mobileNumber1: s(data.mobileNumber1),
    mobileNumber2: s(data.mobileNumber2),
    permanentAddress1: s(data.permanentAddress1),
    permanentAddress2: s(data.permanentAddress2),
    permanentAddress3: s(data.permanentAddress3),
    permanentAddress4: s(data.permanentAddress4),
    isEmployee: !!data.branchId,
    companyId: s(data.companyId),
    companyName: s(data.companyName),
    branchId: s(data.branchId),
    branchName: s(data.branchName),
    employeeId: s(data.employeeId),
  }
}

function buildPayload(form, items, singerItems, id = null) {
  const or = v => v || null
  return {
    id,
    orderDate: new Date().toISOString().split('T')[0],
    employeeId: form.isEmployee ? or(form.employeeId) : null,
    branchId: form.isEmployee && form.branchId ? Number(form.branchId) : null,
    title: form.title,
    surname: form.surname,
    otherNames: form.otherNames,
    fullNameWithInitials: form.fullNameWithInitials,
    nicNumber: form.nicNumber,
    mobileNumber1: form.mobileNumber1,
    mobileNumber2: or(form.mobileNumber2),
    permanentAddress1: form.permanentAddress1,
    permanentAddress2: or(form.permanentAddress2),
    permanentAddress3: or(form.permanentAddress3),
    permanentAddress4: form.permanentAddress4,

    items: items.map(r => ({
      retailModelBadgeId: Number(r.retailModelBadgeId),
      qty: parseInt(r.qty) || 1,
      discountPct: parseFloat(r.discountPct) || null,
      remark: r.remark || null,
    })),

    singerItems: singerItems.map(r => ({
      itemName: r.itemName,
      model: r.model,
      make: r.make || null,
      pricePerItem: parseFloat(r.value) || 0,
      qty: parseInt(r.qty) || 1,
      amount: (parseFloat(r.value) || 0) * (parseInt(r.qty) || 1),
      remark: r.remark || null,
    })),
  }
}

const inputCls = 'w-full px-3 py-1.5 rounded-lg border border-[#e5e5e5] bg-white text-xs text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100'
const selBase = 'w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors duration-100'
const selEnabled = `${selBase} border-[#e5e5e5] bg-white text-[#000] focus:border-[#14213d] cursor-pointer`
const selDis = `${selBase} border-[#e5e5e5] bg-[#fafafa] text-[#bbb] cursor-not-allowed`

function SubGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">{label}</p>
      {children}
    </div>
  )
}

function SectionDivider() {
  return <div className="border-t border-[#f0f0f0]" />
}

function AddressGroup({ label, baseKey, form, setForm, cols = 4 }) {
  const val = n => form[`${baseKey}${n}`] ?? ''
  const onChange = n => e => setForm(prev => ({ ...prev, [`${baseKey}${n}`]: capitalizeWords(e.target.value) }))
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-[#222]">
        {label}
        <span className="text-[10px] text-[#aaa] font-normal ml-2">— 1st &amp; 4th fields are required</span>
      </p>
      <div className={`grid grid-cols-${cols} gap-2`}>
        <input value={val(1)} onChange={onChange(1)} required placeholder="No. & Street Name *" className={inputCls} />
        <input value={val(2)} onChange={onChange(2)} placeholder="Village / Area" className={inputCls} />
        <input value={val(3)} onChange={onChange(3)} placeholder="City / Town" className={inputCls} />
        <input value={val(4)} onChange={onChange(4)} required placeholder="District *" className={inputCls} />
      </div>
    </div>
  )
}

// ── Employment cascade (Company → Branch → Employee ID) ─────────────────────

function EmploymentFields({ form, setForm }) {
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const token = localStorage.getItem('accessToken')

  useEffect(() => {
    getCompanies(token).then(res => setCompanies(res.data?.companies ?? []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!form.companyId) { setBranches([]); return }
    getBranchesByCompany(form.companyId, token).then(res => setBranches(res.data?.branches ?? []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.companyId])

  function handleCompany(e) {
    const id = e.target.value
    const name = companies.find(c => String(c.id) === id)?.name ?? ''
    setForm(f => ({ ...f, companyId: id, companyName: name, branchId: '', branchName: '' }))
  }

  function handleBranch(e) {
    const id = e.target.value
    const name = branches.find(b => String(b.id) === id)?.name ?? ''
    setForm(f => ({ ...f, branchId: id, branchName: name }))
  }

  return (
    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#f0f0f0]">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#222]">Company</label>
        <select value={form.companyId} onChange={handleCompany} className={selEnabled}>
          <option value="">Select company…</option>
          {companies.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#222]">Branch</label>
        <select value={form.branchId} onChange={handleBranch} disabled={!form.companyId}
          className={form.companyId ? selEnabled : selDis}>
          <option value="">Select branch…</option>
          {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
        </select>
      </div>
      <Input
        label="Employee ID"
        value={form.employeeId}
        onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
        placeholder="Emp. number"
      />
    </div>
  )
}

// ── Items (Furniture) — retail badge catalogue, cash-only, no monthly ───────

function RetailItemsGrid({ items, setItems }) {
  const [catalogue, setCatalogue] = useState([])
  const [catalogueError, setCatalogueError] = useState(false)
  const [selCategory, setSelCategory] = useState('')
  const [selItem, setSelItem] = useState('')
  const [selModelId, setSelModelId] = useState('')
  const [selSize, setSelSize] = useState('')
  const [addError, setAddError] = useState('')
  const [selQty, setSelQty] = useState(1)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    getApprovedItems(token).then(res => {
      const list = res.data?.items ?? []
      setCatalogue(list)
      setCatalogueError(list.length === 0)
    })
  }, [])

  const categories = [...new Set(catalogue.map(c => c.category))]
  const filteredItems = [...new Set(catalogue.filter(c => c.category === selCategory).map(c => c.itemName))]
  const filteredModels = [...new Map(
    catalogue
      .filter(c => c.category === selCategory && c.itemName === selItem)
      .map(m => [m.modelId, m])
  ).values()]

  const selectedModelEntries = catalogue.filter(
    c => c.category === selCategory && c.itemName === selItem && c.modelId === Number(selModelId)
  )
  const filteredSizes = selectedModelEntries.map(e => e.size).filter(Boolean)
  const showSizeDropdown = filteredSizes.length > 1

  function handleCategorySelect(e) { setSelCategory(e.target.value); setSelItem(''); setSelModelId(''); setSelSize(''); setAddError('') }
  function handleItemSelect(e) { setSelItem(e.target.value); setSelModelId(''); setSelSize(''); setAddError('') }
  function handleModelSelect(e) { setSelModelId(e.target.value); setSelSize(''); setAddError('') }
  function handleSizeSelect(e) { setSelSize(e.target.value); setAddError('') }

  function handleAdd() {
    let entry
    if (showSizeDropdown) {
      if (!selSize) { setAddError('Please select a size.'); return }
      entry = catalogue.find(c => c.modelId === Number(selModelId) && c.size === selSize)
    } else {
      entry = selectedModelEntries[0]
    }
    if (!entry) { setAddError('Please select a model.'); return }
    if (items.find(i => i.retailModelBadgeId === entry.retailModelBadgeId)) { setAddError('This item is already added.'); return }
    const qty = Math.max(1, parseInt(selQty) || 1)
    setItems(prev => [...prev, { ...entry, qty, discountPct: '', remark: '' }])
    setSelCategory(''); setSelItem(''); setSelModelId(''); setSelSize(''); setSelQty(1); setAddError('')
  }

  function handleDiscountChange(id, value) {
    setItems(prev => prev.map(i => i.retailModelBadgeId === id ? { ...i, discountPct: value } : i))
  }

  function handleRemarkChange(id, text) {
    setItems(prev => prev.map(i => i.retailModelBadgeId === id ? { ...i, remark: text } : i))
  }

  const noCatalogue = catalogueError

  return (
    <div className="flex flex-col gap-4">
      {catalogueError && (
        <p className="text-xs text-red-500">Items not available — no approved retail badge found.</p>
      )}

      <div className={`grid ${showSizeDropdown ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#222]">Category</label>
          <select value={selCategory} onChange={handleCategorySelect} disabled={noCatalogue}
            className={noCatalogue ? selDis : selEnabled}>
            <option value="">Select category…</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#222]">Item</label>
          <select value={selItem} onChange={handleItemSelect} disabled={!selCategory || noCatalogue}
            className={(!selCategory || noCatalogue) ? selDis : selEnabled}>
            <option value="">Select item…</option>
            {filteredItems.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#222]">Model</label>
          <select value={selModelId} onChange={handleModelSelect} disabled={!selItem || noCatalogue}
            className={(!selItem || noCatalogue) ? selDis : selEnabled}>
            <option value="">Select model…</option>
            {filteredModels.map(m => (
              <option key={m.modelId} value={m.modelId}>{m.modelName}</option>
            ))}
          </select>
        </div>
        {showSizeDropdown && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">Size</label>
            <select value={selSize} onChange={handleSizeSelect} className={selEnabled}>
              <option value="">Select size…</option>
              {filteredSizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#222]">Qty</label>
          <input
            type="number"
            value={selQty}
            onChange={e => setSelQty(e.target.value)}
            className="w-16 px-2 py-1.5 rounded-lg border border-[#e5e5e5] bg-white text-xs text-[#000] text-center focus:outline-none focus:border-[#14213d] transition-colors duration-100"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#14213d] text-white text-sm font-medium hover:bg-[#fca311] hover:text-[#14213d] transition-colors duration-150 cursor-pointer whitespace-nowrap self-end"
        >
          <Plus size={15} />
          Add Item
        </button>
        {addError && <p className="text-xs text-red-500 self-end mb-2">{addError}</p>}
      </div>

      {items.length > 0 ? (
        <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f5f5f5] text-[#555] text-left">
                <th className="px-4 py-2.5 font-medium">Item Name</th>
                <th className="px-4 py-2.5 font-medium">Model</th>
                <th className="px-4 py-2.5 font-medium">Value</th>
                <th className="px-4 py-2.5 font-medium text-center w-16">Qty</th>
                <th className="px-4 py-2.5 font-medium text-center w-20">Disc. %</th>
                <th className="px-4 py-2.5 font-medium">Value After Disc.</th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const rowCls = `border-t border-[#ebebeb] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`
                const disc = parseFloat(item.discountPct) || 0
                const valueAfterDisc = disc > 0 ? Math.round(item.price * (1 - disc / 100)) : item.price
                return (
                  <Fragment key={item.retailModelBadgeId}>
                    <tr className={rowCls}>
                      <td className="px-4 py-3 text-[#222] font-medium">{item.itemName}</td>
                      <td className="px-4 py-3 text-[#666]">{item.modelName}{item.size ? ` (${item.size})` : ''}</td>
                      <td className="px-4 py-3 text-[#444]">{LKR(item.price)}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.qty ?? 1}
                          onChange={e => setItems(prev => prev.map(i =>
                            i.retailModelBadgeId === item.retailModelBadgeId ? { ...i, qty: e.target.value } : i
                          ))}
                          onBlur={() => setItems(prev => prev.map(i =>
                            i.retailModelBadgeId === item.retailModelBadgeId ? { ...i, qty: Math.max(1, parseInt(i.qty) || 1) } : i
                          ))}
                          className="w-14 px-2 py-1 text-xs border border-[#e5e5e5] rounded-md text-center focus:outline-none focus:border-[#14213d] bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.discountPct ?? ''}
                          onChange={e => handleDiscountChange(item.retailModelBadgeId, e.target.value)}
                          className="w-16 px-2 py-1 text-xs border border-[#e5e5e5] rounded-md text-center focus:outline-none focus:border-[#14213d] bg-white"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-[#444]">{LKR(valueAfterDisc)}</td>
                      <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR(valueAfterDisc * (parseInt(item.qty) || 1))}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setItems(prev => prev.filter(i => i.retailModelBadgeId !== item.retailModelBadgeId))}
                          className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                    <tr className={rowCls}>
                      <td colSpan={8} className="px-4 pb-3 pt-0">
                        <textarea
                          value={item.remark}
                          onChange={e => handleRemarkChange(item.retailModelBadgeId, e.target.value)}
                          rows={1}
                          placeholder="Remark (optional)"
                          className="w-full px-3 py-1.5 rounded-md border border-[#e5e5e5] bg-[#fafafa] text-xs text-[#555] placeholder-[#ccc] focus:outline-none focus:border-[#14213d] resize-none transition-colors duration-100"
                        />
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
            {items.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-[#e5e5e5] bg-[#f9f9f9]">
                  <td colSpan={6} className="px-4 py-3 text-sm font-medium text-[#555]">Total Value</td>
                  <td className="px-4 py-3 font-bold text-[#14213d]">
                    {LKR(items.reduce((sum, i) => {
                      const disc = parseFloat(i.discountPct) || 0
                      const v = disc > 0 ? Math.round(i.price * (1 - disc / 100)) : i.price
                      return sum + v * (parseInt(i.qty) || 1)
                    }, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <div className="border border-dashed border-[#d8d8d8] rounded-lg py-10 text-center">
          <p className="text-sm text-[#bbb]">No items added yet. Select from dropdowns above.</p>
        </div>
      )}
    </div>
  )
}

// ── Singer Items — cash-only, no monthly ─────────────────────────────────────

function RetailSingerItemsSection({ singerItems, setSingerItems }) {
  const [open, setOpen] = useState(false)
  const [row, setRow] = useState({ itemName: '', model: '', make: '', value: '', qty: '' })
  const [addError, setAddError] = useState('')

  function handleAdd() {
    if (!row.itemName.trim() || !row.model.trim() || !row.value || !row.qty) {
      setAddError('All fields are required.')
      return
    }
    const value = parseFloat(row.value) || 0
    const qty = Math.max(1, parseInt(row.qty) || 1)
    if (value <= 0) { setAddError('Value must be greater than 0.'); return }
    setSingerItems(prev => [...prev, {
      itemName: row.itemName.trim(),
      model: row.model.trim(),
      make: row.make.trim(),
      value,
      qty,
      remark: '',
    }])
    setRow({ itemName: '', model: '', make: '', value: '', qty: '' })
    setAddError('')
  }

  function handleRemove(idx) {
    setSingerItems(prev => prev.filter((_, i) => i !== idx))
  }

  function handleRemarkChange(idx, text) {
    setSingerItems(prev => prev.map((item, i) => i === idx ? { ...item, remark: text } : item))
  }

  function handleQtyChange(idx, val) {
    setSingerItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, qty: Math.max(1, parseInt(val) || 1) } : item
    ))
  }

  const fieldCls = 'w-full px-3 py-1.5 rounded-lg border border-[#e5e5e5] bg-white text-xs text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100'

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#fafafa] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#aaa] uppercase tracking-widest mr-1">3</span>
          <h2 className="text-sm font-semibold text-[#14213d]">Singer Items</h2>
          {singerItems.length > 0 && (
            <span className="text-xs text-[#888]">({singerItems.length} item{singerItems.length !== 1 ? 's' : ''})</span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-[#aaa] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 flex flex-col gap-4 border-t border-[#f0f0f0]">
          <div className="grid grid-cols-5 gap-2 pt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#222]">Item Name</label>
              <input value={row.itemName} onChange={e => setRow(r => ({ ...r, itemName: e.target.value }))} placeholder="Item name" className={fieldCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#222]">Model</label>
              <input value={row.model} onChange={e => setRow(r => ({ ...r, model: e.target.value }))} placeholder="Model" className={fieldCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#222]">Make</label>
              <input value={row.make} onChange={e => setRow(r => ({ ...r, make: e.target.value }))} placeholder="Make" className={fieldCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#222]">Value</label>
              <input type="number" value={row.value} onChange={e => setRow(r => ({ ...r, value: e.target.value }))} placeholder="0.00" className={fieldCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#222]">Qty</label>
              <input type="number" value={row.qty} onChange={e => setRow(r => ({ ...r, qty: e.target.value }))} placeholder="1" className={fieldCls} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#14213d] text-white text-sm font-medium hover:bg-[#fca311] hover:text-[#14213d] transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              <Plus size={15} />
              Add Singer Item
            </button>
            {addError && <p className="text-xs text-red-500">{addError}</p>}
          </div>

          {singerItems.length > 0 && (
            <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f5f5f5] text-[#555] text-left">
                    <th className="px-4 py-2.5 font-medium">Item Name</th>
                    <th className="px-4 py-2.5 font-medium">Model</th>
                    <th className="px-4 py-2.5 font-medium">Make</th>
                    <th className="px-4 py-2.5 font-medium">Value</th>
                    <th className="px-4 py-2.5 font-medium text-center w-16">Qty</th>
                    <th className="px-4 py-2.5 font-medium">Total</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {singerItems.map((item, i) => {
                    const rowCls = `border-t border-[#ebebeb] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`
                    return (
                      <Fragment key={i}>
                        <tr className={rowCls}>
                          <td className="px-4 py-3 text-[#222] font-medium">{item.itemName}</td>
                          <td className="px-4 py-3 text-[#666]">{item.model}</td>
                          <td className="px-4 py-3 text-[#666]">{item.make || '—'}</td>
                          <td className="px-4 py-3 text-[#444]">{LKR(item.value)}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={e => handleQtyChange(i, e.target.value)}
                              className="w-14 px-2 py-1 text-xs border border-[#e5e5e5] rounded-md text-center focus:outline-none focus:border-[#14213d] bg-white"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR((item.value || 0) * (item.qty || 1))}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemove(i)}
                              className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                        <tr className={rowCls}>
                          <td colSpan={7} className="px-4 pb-3 pt-0">
                            <textarea
                              value={item.remark}
                              onChange={e => handleRemarkChange(i, e.target.value)}
                              rows={1}
                              placeholder="Remark (optional)"
                              className="w-full px-3 py-1.5 rounded-md border border-[#e5e5e5] bg-[#fafafa] text-xs text-[#555] placeholder-[#ccc] focus:outline-none focus:border-[#14213d] resize-none transition-colors duration-100"
                            />
                          </td>
                        </tr>
                      </Fragment>
                    )
                  })}
                </tbody>
                {singerItems.length > 1 && (
                  <tfoot>
                    <tr className="border-t-2 border-[#e5e5e5] bg-[#f9f9f9]">
                      <td colSpan={5} className="px-4 py-3 text-sm font-medium text-[#555]">Total</td>
                      <td className="px-4 py-3 font-bold text-[#14213d]">
                        {LKR(singerItems.reduce((sum, i) => sum + (i.value || 0) * (i.qty || 1), 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewRetailOrderForm({ onBack, initialData = null, orderId = null }) {
  const [form, setForm] = useState(initialData ? apiToFormState(initialData) : INITIAL_FORM)
  const [items, setItems] = useState(
    initialData?.items?.map(i => ({
      retailModelBadgeId: i.retailModelBadgeId,
      category: i.category,
      itemName: i.item_name,
      modelName: i.model,
      size: i.size,
      price: Number(i.item_value),
      discountPct: i.discountPct != null ? String(i.discountPct) : '',
      qty: i.qty || 1,
      remark: i.remark || '',
    })) ?? []
  )
  const [singerItems, setSingerItems] = useState(
    initialData?.singerItems?.map(i => ({
      itemName: i.item_name,
      model: i.model,
      make: i.make || '',
      value: Number(i.price_per_item || 0),
      qty: i.qty || 1,
      remark: i.remark || '',
    })) ?? []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [savedOrder, setSavedOrder] = useState(null)

  const f = (key, extra) => {
    const base = field(form, setForm, key, extra)
    return {
      ...base,
      onChange: e => { base.onChange(e); setErrors(p => { const n = { ...p }; delete n[key]; return n }) },
      error: errors[key],
    }
  }

  const phone = key => { const b = f(key); return { ...b, onChange: e => b.onChange({ target: { value: e.target.value.replace(/[^0-9\s+\-]/g, '') } }) } }

  const nameField = key => {
    const b = f(key)
    return {
      ...b,
      onChange: e => {
        const v = capitalizeWords(e.target.value)
        b.onChange({ target: { value: v } })
        setForm(prev => ({
          ...prev,
          fullNameWithInitials: buildFullNameWithInitials(
            key === 'surname' ? v : prev.surname,
            key === 'otherNames' ? v : prev.otherNames,
          ),
        }))
      },
    }
  }

  const cap = key => { const b = f(key); return { ...b, onChange: e => b.onChange({ target: { value: capitalizeWords(e.target.value) } }) } }

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.length === 0 && singerItems.length === 0) { setError('Please add at least one item.'); return }
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setError('Please fix the highlighted fields before submitting.')
      return
    }
    setErrors({})
    setError('')
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const data = await apiPost('/retail-orders', buildPayload(form, items, singerItems, orderId), token)
      if (data.status === 200) {
        if (orderId) {
          onBack()
        } else {
          setSavedOrder({ orderCode: data.data.orderCode, orderId: data.data.orderId })
        }
      } else {
        setError(data.message || 'Failed to save order. Please try again.')
      }
    } catch {
      setError('Unable to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">

      {savedOrder && (
        <OrderSavedDialog
          orderCode={savedOrder.orderCode}
          title="Order saved successfully!"
          message="Retail order placed."
          onClose={onBack}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#14213d] transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Retail
        </button>
        <span className="text-[#ccc] text-sm">/</span>
        <h1 className="text-lg font-semibold text-[#14213d]">{orderId ? 'Update Order' : 'New Retail Order'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* ── Section 1: Customer Details ── */}
        <FormSection number="1" title="Customer Details">
          <div className="flex flex-col gap-3">

            <SubGroup label="Personal Information">
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-5 gap-2">
                  <Select label="Title"                   {...f('title')} options={TITLE_OPTIONS} />
                  <Input label="Surname"                 {...nameField('surname')} placeholder="Surname" />
                  <Input label="Other Names"             {...nameField('otherNames')} placeholder="Other names" />
                  <Input label="NIC Number"              {...f('nicNumber')} placeholder="National ID" />
                  <Input label="Full Name with Initials" {...cap('fullNameWithInitials')} placeholder="e.g. A. B. Perera" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Mobile Number 1" {...phone('mobileNumber1')} type="tel" placeholder="07X XXX XXXX" />
                  <Input label="Mobile Number 2" {...phone('mobileNumber2')} type="tel" placeholder="07X XXX XXXX (optional)" />
                </div>
              </div>
            </SubGroup>

            <SectionDivider />

            <SubGroup label="Address">
              <AddressGroup label="Permanent Address" baseKey="permanentAddress" form={form} setForm={setForm} />
            </SubGroup>

            <SectionDivider />

            <SubGroup label="Employment">
              <label className="flex items-center gap-2 text-xs text-[#222] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isEmployee}
                  onChange={e => setForm(f => ({ ...f, isEmployee: e.target.checked }))}
                  className="w-4 h-4 accent-[#14213d] cursor-pointer"
                />
                Are you an employee?
              </label>
              {form.isEmployee && <EmploymentFields form={form} setForm={setForm} />}
            </SubGroup>

          </div>
        </FormSection>

        {/* ── Section 2: Items Grid ── */}
        <FormSection number="2" title="Items (Furniture)">
          <RetailItemsGrid items={items} setItems={setItems} />
        </FormSection>

        {/* ── Section 3: Singer Items ── */}
        <RetailSingerItemsSection singerItems={singerItems} setSingerItems={setSingerItems} />

        {/* ── Actions ── */}
        <div className="bg-white border border-[#d8d8d8] rounded-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-xs text-[#aaa]">
              All fields marked <span className="text-[#fca311] font-semibold">*</span> are required
            </p>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save Order'}
            </Button>
          </div>
        </div>

      </form>
    </div>
  )
}
