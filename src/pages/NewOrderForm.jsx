import { useState, useEffect, Fragment } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Select from '../components/Select'
import FormSection from '../components/FormSection'
import Button from '../components/Button'
import OrderSavedDialog from '../components/OrderSavedDialog'
import { apiPost } from '../api/api'
import { printSingerForm, getBranches, getProjectsByBranch } from '../api/orderApi'
import { getApprovedItems } from '../api/inventoryApi'
import Combobox from '../components/Combobox'

const DURATION_OPTIONS = [
  { value: '6',  label: '6 months'  },
  { value: '12', label: '12 months' },
  { value: '18', label: '18 months' },
  { value: '24', label: '24 months' },
]

const MARITAL_OPTIONS = [{ value: 'Married', label: 'Married' }, { value: 'Single', label: 'Single' }]

const TITLE_OPTIONS = [
  { value: 'Mr',   label: 'Mr'   },
  { value: 'Mrs',  label: 'Mrs'  },
  { value: 'Ms',   label: 'Ms'   },
  { value: 'Miss', label: 'Miss' },
]

const INITIAL_FORM = {
  // Project
  projectId: '',
  // Section 1 – Employment
  companyName: '', employeeId: '', employmentStartDate: '', departmentAndDesignation: '',
  // Section 1 – Personal
  title: '', surname: '', otherNames: '', fullNameWithInitials: '',
  nicNumber: '', dateOfBirth: '', maritalStatus: '',
  spouseName: '', spouseContactNumber: '',
  // Section 1 – Contact
  mobileNumber: '', landlineNumber: '',
  // Section 1 – Address
  permanentAddress1: '', permanentAddress2: '', permanentAddress3: '', permanentAddress4: '',
  hasPostalAddress: false,
  postalAddress1: '',    postalAddress2: '',    postalAddress3: '',    postalAddress4: '',
  // Section 2 – Guarantor 1
  g1_employeeId: '', g1_title: '', g1_surname: '', g1_otherNames: '', g1_fullNameWithInitials: '',
  g1_nicNumber: '', g1_mobileNumber: '', g1_landlineNumber: '',
  g1_permanentAddress1: '', g1_permanentAddress2: '', g1_permanentAddress3: '', g1_permanentAddress4: '',
  // Section 2 – Guarantor 2
  g2_employeeId: '', g2_title: '', g2_surname: '', g2_otherNames: '', g2_fullNameWithInitials: '',
  g2_nicNumber: '', g2_mobileNumber: '', g2_landlineNumber: '',
  g2_permanentAddress1: '', g2_permanentAddress2: '', g2_permanentAddress3: '', g2_permanentAddress4: '',
}

const HAS_DIGIT  = /\d/
const HAS_LETTER = /[a-zA-Z]/

function validate(form) {
  const errs = {}

  const nameKeys = [
    'surname', 'otherNames', 'fullNameWithInitials', 'spouseName',
    'g1_surname', 'g1_otherNames', 'g1_fullNameWithInitials',
    'g2_surname', 'g2_otherNames', 'g2_fullNameWithInitials',
  ]
  nameKeys.forEach(k => { if (form[k] && HAS_DIGIT.test(form[k])) errs[k] = 'Name cannot contain numbers' })

  const phoneKeys = [
    'mobileNumber', 'landlineNumber', 'spouseContactNumber',
    'g1_mobileNumber', 'g1_landlineNumber',
    'g2_mobileNumber', 'g2_landlineNumber',
  ]
  phoneKeys.forEach(k => { if (form[k] && HAS_LETTER.test(form[k])) errs[k] = 'Phone number cannot contain letters' })

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
    projectId: s(data.projectId),
    companyName: s(data.companyName),
    employeeId: s(data.employeeId),
    employmentStartDate: s(data.employmentStartDate),
    departmentAndDesignation: s(data.departmentAndDesignation),
    title: s(data.title),
    surname: s(data.surname),
    otherNames: s(data.otherNames),
    fullNameWithInitials: s(data.fullNameWithInitials),
    nicNumber: s(data.nicNumber),
    dateOfBirth: s(data.dateOfBirth),
    maritalStatus: s(data.maritalStatus),
    spouseName: s(data.spouseName),
    spouseContactNumber: s(data.spouseContactNumber),
    mobileNumber: s(data.mobileNumber),
    landlineNumber: s(data.landlineNumber),
    permanentAddress1: s(data.permanentAddress1),
    permanentAddress2: s(data.permanentAddress2),
    permanentAddress3: s(data.permanentAddress3),
    permanentAddress4: s(data.permanentAddress4),
    hasPostalAddress: !!(data.postalAddress1),
    postalAddress1: s(data.postalAddress1),
    postalAddress2: s(data.postalAddress2),
    postalAddress3: s(data.postalAddress3),
    postalAddress4: s(data.postalAddress4),
    g1_employeeId: s(data.g1_employeeId),
    g1_title: s(data.g1_title),
    g1_surname: s(data.g1_surname),
    g1_otherNames: s(data.g1_otherNames),
    g1_fullNameWithInitials: s(data.g1_fullNameWithInitials),
    g1_nicNumber: s(data.g1_nicNumber),
    g1_mobileNumber: s(data.g1_mobileNumber),
    g1_landlineNumber: s(data.g1_landlineNumber),
    g1_permanentAddress1: s(data.g1_permanentAddress1),
    g1_permanentAddress2: s(data.g1_permanentAddress2),
    g1_permanentAddress3: s(data.g1_permanentAddress3),
    g1_permanentAddress4: s(data.g1_permanentAddress4),
    g2_employeeId: s(data.g2_employeeId),
    g2_title: s(data.g2_title),
    g2_surname: s(data.g2_surname),
    g2_otherNames: s(data.g2_otherNames),
    g2_fullNameWithInitials: s(data.g2_fullNameWithInitials),
    g2_nicNumber: s(data.g2_nicNumber),
    g2_mobileNumber: s(data.g2_mobileNumber),
    g2_landlineNumber: s(data.g2_landlineNumber),
    g2_permanentAddress1: s(data.g2_permanentAddress1),
    g2_permanentAddress2: s(data.g2_permanentAddress2),
    g2_permanentAddress3: s(data.g2_permanentAddress3),
    g2_permanentAddress4: s(data.g2_permanentAddress4),
  }
}

function buildPayload(form, items, id = null) {
  const or = v => v || null
  return {
    id: id,
    projectId: Number(form.projectId),
    orderDate: new Date().toISOString().split('T')[0],

    employeeId: form.employeeId,
    companyName: form.companyName,
    employmentStartDate: form.employmentStartDate,
    departmentAndDesignation: form.departmentAndDesignation,
    title: form.title,
    surname: form.surname,
    otherNames: form.otherNames,
    fullNameWithInitials: form.fullNameWithInitials,
    nicNumber: form.nicNumber,
    dateOfBirth: form.dateOfBirth,
    maritalStatus: form.maritalStatus,
    spouseName: or(form.spouseName),
    spouseContactNumber: or(form.spouseContactNumber),
    mobileNumber: form.mobileNumber,
    landlineNumber: or(form.landlineNumber),
    permanentAddress1: form.permanentAddress1,
    permanentAddress2: or(form.permanentAddress2),
    permanentAddress3: or(form.permanentAddress3),
    permanentAddress4: form.permanentAddress4,
    postalAddress1: form.hasPostalAddress ? form.postalAddress1 : null,
    postalAddress2: form.hasPostalAddress ? or(form.postalAddress2) : null,
    postalAddress3: form.hasPostalAddress ? or(form.postalAddress3) : null,
    postalAddress4: form.hasPostalAddress ? form.postalAddress4 : null,

    guarantors: [
      {
        guarantorEmployeeId: form.g1_employeeId,
        title: form.g1_title,
        surname: form.g1_surname,
        otherNames: form.g1_otherNames,
        fullNameWithInitials: form.g1_fullNameWithInitials,
        nicNumber: form.g1_nicNumber,
        mobileNumber: form.g1_mobileNumber,
        landlineNumber: or(form.g1_landlineNumber),
        permanentAddress1: form.g1_permanentAddress1,
        permanentAddress2: or(form.g1_permanentAddress2),
        permanentAddress3: or(form.g1_permanentAddress3),
        permanentAddress4: form.g1_permanentAddress4,
      },
      {
        guarantorEmployeeId: form.g2_employeeId,
        title: form.g2_title,
        surname: form.g2_surname,
        otherNames: form.g2_otherNames,
        fullNameWithInitials: form.g2_fullNameWithInitials,
        nicNumber: form.g2_nicNumber,
        mobileNumber: form.g2_mobileNumber,
        landlineNumber: or(form.g2_landlineNumber),
        permanentAddress1: form.g2_permanentAddress1,
        permanentAddress2: or(form.g2_permanentAddress2),
        permanentAddress3: or(form.g2_permanentAddress3),
        permanentAddress4: form.g2_permanentAddress4,
      },
    ],

    items: items.map(i => ({
      modelBadgeId: i.modelBadgeId,
      durationMonths: i.duration_months,
      remark: i.remark || null,
    })),
  }
}

const inputCls = 'w-full px-3 py-1.5 rounded-lg border border-[#e5e5e5] bg-white text-xs text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100'

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
  const onChange = n => e => setForm(prev => ({ ...prev, [`${baseKey}${n}`]: e.target.value }))
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-[#222]">
        {label}
        <span className="text-[10px] text-[#aaa] font-normal ml-2">— 1st &amp; 4th fields are required</span>
      </p>
      <div className={`grid grid-cols-${cols} gap-2`}>
        <input value={val(1)} onChange={onChange(1)} required placeholder="No. & Street Name *" className={inputCls} />
        <input value={val(2)} onChange={onChange(2)} placeholder="Village / Area"               className={inputCls} />
        <input value={val(3)} onChange={onChange(3)} placeholder="City / Town"                  className={inputCls} />
        <input value={val(4)} onChange={onChange(4)} required placeholder="District *"          className={inputCls} />
      </div>
    </div>
  )
}

function ItemsGrid({ items, setItems }) {
  const [catalogue,      setCatalogue]      = useState([])
  const [catalogueError, setCatalogueError] = useState(false)
  const [selCategory,    setSelCategory]    = useState('')
  const [selItem,        setSelItem]        = useState('')
  const [selModelId,     setSelModelId]     = useState('')
  const [selSize,        setSelSize]        = useState('')
  const [addError,       setAddError]       = useState('')
  const [sharedDuration, setSharedDuration] = useState(24)

  useEffect(() => {
    if (items.length > 0 && items[0].duration_months) setSharedDuration(items[0].duration_months)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    getApprovedItems(token).then(res => {
      const list = res.data?.items ?? []
      setCatalogue(list)
      setCatalogueError(list.length === 0)
    })
  }, [])

  useEffect(() => {
    if (catalogue.length === 0) return
    setItems(prev => prev.map(i => {
      if (i.monthly_rental != null) return i
      const entry = catalogue.find(c => c.modelBadgeId === i.modelBadgeId)
      if (!entry) return i
      return {
        ...i,
        month6: entry.month6, month12: entry.month12,
        month18: entry.month18, month24: entry.month24,
        monthly_rental: entry['month' + i.duration_months] ?? 0,
      }
    }))
  }, [catalogue])

  const categories     = [...new Set(catalogue.map(c => c.category))]
  const filteredItems  = [...new Set(catalogue.filter(c => c.category === selCategory).map(c => c.itemName))]
  const filteredModels = [...new Map(
    catalogue
      .filter(c => c.category === selCategory && c.itemName === selItem)
      .map(m => [m.modelId, m])
  ).values()]

  const selectedModelEntries = catalogue.filter(
    c => c.category === selCategory && c.itemName === selItem && c.modelId === Number(selModelId)
  )
  const filteredSizes    = selectedModelEntries.map(e => e.size).filter(Boolean)
  const showSizeDropdown = filteredSizes.length > 1

  function handleCategorySelect(e) { setSelCategory(e.target.value); setSelItem(''); setSelModelId(''); setSelSize(''); setAddError('') }
  function handleItemSelect(e)     { setSelItem(e.target.value); setSelModelId(''); setSelSize(''); setAddError('') }
  function handleModelSelect(e)    { setSelModelId(e.target.value); setSelSize(''); setAddError('') }
  function handleSizeSelect(e)     { setSelSize(e.target.value); setAddError('') }

  function handleAdd() {
    let entry
    if (showSizeDropdown) {
      if (!selSize) { setAddError('Please select a size.'); return }
      entry = catalogue.find(c => c.modelId === Number(selModelId) && c.size === selSize)
    } else {
      entry = selectedModelEntries[0]
    }
    if (!entry) { setAddError('Please select a model.'); return }
    if (items.find(i => i.modelBadgeId === entry.modelBadgeId)) { setAddError('This item is already added.'); return }
    setItems(prev => [...prev, {
      ...entry,
      duration_months: sharedDuration,
      monthly_rental: entry['month' + sharedDuration] ?? 0,
      remark: '',
    }])
    setSelCategory(''); setSelItem(''); setSelModelId(''); setSelSize(''); setAddError('')
  }

  function handleDurationChange(months) {
    const num = Number(months)
    setSharedDuration(num)
    setItems(prev => prev.map(i => ({
      ...i,
      duration_months: num,
      monthly_rental: i['month' + num] ?? 0,
    })))
  }

  function handleRemarkChange(modelBadgeId, text) {
    setItems(prev => prev.map(i => i.modelBadgeId === modelBadgeId ? { ...i, remark: text } : i))
  }

  const selBase    = 'w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors duration-100'
  const selEnabled = `${selBase} border-[#e5e5e5] bg-white text-[#000] focus:border-[#14213d] cursor-pointer`
  const selDis     = `${selBase} border-[#e5e5e5] bg-[#fafafa] text-[#bbb] cursor-not-allowed`

  return (
    <div className="flex flex-col gap-4">
      {catalogueError && (
        <p className="text-xs text-red-500">Items not available — no approved badge found.</p>
      )}

      <div className={`grid ${showSizeDropdown ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#222]">Category</label>
          <select value={selCategory} onChange={handleCategorySelect} disabled={catalogueError}
            className={catalogueError ? selDis : selEnabled}>
            <option value="">Select category…</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#222]">Item</label>
          <select value={selItem} onChange={handleItemSelect} disabled={!selCategory || catalogueError}
            className={(!selCategory || catalogueError) ? selDis : selEnabled}>
            <option value="">Select item…</option>
            {filteredItems.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#222]">Model</label>
          <select value={selModelId} onChange={handleModelSelect} disabled={!selItem || catalogueError}
            className={(!selItem || catalogueError) ? selDis : selEnabled}>
            <option value="">Select model…</option>
            {filteredModels.map(m => (
              <option key={m.modelId} value={m.modelId}>{m.modelName}</option>
            ))}
          </select>
        </div>
        {showSizeDropdown && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">Size</label>
            <select value={selSize} onChange={handleSizeSelect}
              className={selEnabled}>
              <option value="">Select size…</option>
              {filteredSizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#14213d] text-white text-sm font-medium hover:bg-[#fca311] hover:text-[#14213d] transition-colors duration-150 cursor-pointer whitespace-nowrap"
        >
          <Plus size={15} />
          Add Item
        </button>
        {addError && <p className="text-xs text-red-500">{addError}</p>}
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#555] font-medium">Duration (all items):</span>
            <select
              value={sharedDuration}
              onChange={e => handleDurationChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-[#e5e5e5] text-xs text-[#000] bg-white focus:outline-none focus:border-[#14213d] cursor-pointer"
            >
              {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f5f5f5] text-[#555] text-left">
                <th className="px-4 py-2.5 font-medium">Item Name</th>
                <th className="px-4 py-2.5 font-medium">Model</th>
                <th className="px-4 py-2.5 font-medium">Value</th>
                <th className="px-4 py-2.5 font-medium">Monthly</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const rowCls = `border-t border-[#ebebeb] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`
                return (
                  <Fragment key={item.modelBadgeId}>
                    <tr className={rowCls}>
                      <td className="px-4 py-3 text-[#222] font-medium">{item.itemName}</td>
                      <td className="px-4 py-3 text-[#666]">{item.modelName}{item.size ? ` (${item.size})` : ''}</td>
                      <td className="px-4 py-3 text-[#444]">{LKR(item.price)}</td>
                      <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR(item.monthly_rental ?? 0)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setItems(prev => prev.filter(i => i.modelBadgeId !== item.modelBadgeId))}
                          className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                    <tr className={rowCls}>
                      <td colSpan={5} className="px-4 pb-3 pt-0">
                        <textarea
                          value={item.remark}
                          onChange={e => handleRemarkChange(item.modelBadgeId, e.target.value)}
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
                  <td colSpan={3} className="px-4 py-3 text-sm font-medium text-[#555]">Total Monthly Installment</td>
                  <td className="px-4 py-3 font-bold text-[#14213d]">
                    {LKR(items.reduce((sum, i) => sum + (i.monthly_rental ?? 0), 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-[#d8d8d8] rounded-lg py-10 text-center">
          <p className="text-sm text-[#bbb]">No items added yet. Select from dropdowns above.</p>
        </div>
      )}
    </div>
  )
}

function GuarantorFields({ prefix, form, setForm, errors = {}, setErrors, addressCols = 4 }) {
  const f = (key, extra) => {
    const fullKey = `${prefix}_${key}`
    const base = field(form, setForm, fullKey, extra)
    return {
      ...base,
      onChange: e => { base.onChange(e); setErrors(p => { const n = { ...p }; delete n[fullKey]; return n }) },
      error: errors[fullKey],
    }
  }
  const phone = key => { const b = f(key); return { ...b, onChange: e => b.onChange({ target: { value: e.target.value.replace(/[^0-9\s+\-]/g, '') } }) } }
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2">
        <Select label="Title"       {...f('title')}      options={TITLE_OPTIONS} />
        <Input  label="Employee ID" {...f('employeeId')} placeholder="Emp ID" className="col-span-3" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input label="Surname"                 {...f('surname')}              placeholder="Surname" />
        <Input label="Other Names"             {...f('otherNames')}           placeholder="Other names" />
        <Input label="Full Name with Initials" {...f('fullNameWithInitials')} placeholder="e.g. A. B. Perera" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input label="NIC Number"    {...f('nicNumber')}          placeholder="NIC" />
        <Input label="Mobile Number" {...phone('mobileNumber')}   type="tel" placeholder="07X XXX XXXX" />
        <Input label="Landline"      {...phone('landlineNumber')} type="tel" placeholder="0XX XXX XXXX" />
      </div>
      <AddressGroup label="Permanent Address" baseKey={`${prefix}_permanentAddress`} form={form} setForm={setForm} cols={addressCols} />
    </div>
  )
}

export default function NewOrderForm({ onBack, initialData = null, orderId = null }) {
  const [form, setForm] = useState(initialData ? apiToFormState(initialData) : INITIAL_FORM)
  const [items, setItems] = useState(
    initialData?.items
      ? initialData.items.map(i => {
          const dur = i.duration_months || i.durationMonths || 24
          return {
            modelBadgeId:    i.modelBadgeId,
            modelId:         i.modelId,
            category:        i.category,
            itemName:        i.itemName || i.item_name,
            modelName:       i.modelName || i.model,
            size:            i.size,
            price:           Number(i.price || i.item_value),
            duration_months: dur,
            month6:          i.month6,
            month12:         i.month12,
            month18:         i.month18,
            month24:         i.month24,
            monthly_rental:  i['month' + dur] ?? undefined,
            remark:          i.remark || '',
          }
        })
      : []
  )
  const [branches,         setBranches]         = useState([])
  const [branchProjects,   setBranchProjects]   = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [savedOrder, setSavedOrder] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    getBranches(token).then(res => setBranches(res.data?.branches ?? []))
    getProjectsByBranch(null, token).then(res => setBranchProjects(res.data?.projects ?? []))
  }, [])

  useEffect(() => {
    if (selectedBranchId == null) return
    const token = localStorage.getItem('accessToken')
    getProjectsByBranch(selectedBranchId, token).then(res =>
      setBranchProjects(res.data?.projects ?? [])
    )
  }, [selectedBranchId])

  const f = (key, extra) => {
    const base = field(form, setForm, key, extra)
    return {
      ...base,
      onChange: e => { base.onChange(e); setErrors(p => { const n = { ...p }; delete n[key]; return n }) },
      error: errors[key],
    }
  }

  const phone = key => { const b = f(key); return { ...b, onChange: e => b.onChange({ target: { value: e.target.value.replace(/[^0-9\s+\-]/g, '') } }) } }

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.length === 0) { setError('Please add at least one item.'); return }
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
      const data = await apiPost('/orders', buildPayload(form, items, orderId), token)
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
          onPrint={() => printSingerForm(savedOrder.orderId, localStorage.getItem('accessToken'))}
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
          Orders
        </button>
        <span className="text-[#ccc] text-sm">/</span>
        <h1 className="text-lg font-semibold text-[#14213d]">{orderId ? 'Update Order' : 'New Order'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* ── Section 1: Customer Details ── */}
        <FormSection number="1" title="Customer Details">
          <div className="flex flex-col gap-3">

            <SubGroup label="Employment">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#222]">Company / Employer</label>
                  <Combobox
                    value={form.companyName}
                    options={branches.map(b => ({ id: b.id, label: b.name }))}
                    onChange={(label, id) => {
                      setForm(f => ({ ...f, companyName: label, projectId: '' }))
                      setSelectedBranchId(id)
                    }}
                    placeholder="Search company…"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e5e5e5] bg-white text-xs text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#222]">Project</label>
                  <select
                    value={form.projectId}
                    onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                    required
                    disabled={!form.companyName}
                    className={!form.companyName
                      ? "w-full px-3 py-1.5 rounded-lg border border-[#e5e5e5] bg-[#fafafa] text-xs text-[#bbb] cursor-not-allowed"
                      : "w-full px-3 py-1.5 rounded-lg border border-[#e5e5e5] bg-white text-xs text-[#000] focus:outline-none focus:border-[#14213d] transition-colors duration-100 cursor-pointer"
                    }
                  >
                    <option value="">Select project…</option>
                    {branchProjects.map(p => (
                      <option key={p.id} value={String(p.id)}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <Input label="Employee ID"              {...f('employeeId')}              placeholder="Emp. number" />
                <Input label="Department & Designation" {...f('departmentAndDesignation')} placeholder="Dept — Designation" className="col-span-3" />
                <Input label="Employment Start Date"    {...f('employmentStartDate')}     type="date" />
              </div>
            </SubGroup>

            <SectionDivider />

            <SubGroup label="Personal Information">
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-5 gap-2">
                  <Select label="Title"                   {...f('title')}                options={TITLE_OPTIONS} />
                  <Input  label="Surname"                 {...f('surname')}              placeholder="Surname" />
                  <Input  label="Other Names"             {...f('otherNames')}           placeholder="Other names" />
                  <Input  label="NIC Number"              {...f('nicNumber')}            placeholder="National ID" />
                  <Input  label="Full Name with Initials" {...f('fullNameWithInitials')} placeholder="e.g. A. B. Perera" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Input  label="Date of Birth"  {...f('dateOfBirth')}          type="date" />
                  <Input  label="Mobile Number"  {...phone('mobileNumber')}     type="tel" placeholder="07X XXX XXXX" />
                  <Input  label="Landline Number" {...phone('landlineNumber')}  type="tel" placeholder="0XX XXX XXXX" />
                  <Select label="Marital Status" {...f('maritalStatus')}        options={MARITAL_OPTIONS} />
                </div>
                {form.maritalStatus === 'Married' && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input label="Spouse Name"           {...f('spouseName')}              placeholder="Spouse full name" className="col-span-2" />
                    <Input label="Spouse Contact Number" {...phone('spouseContactNumber')} type="tel" placeholder="07X XXX XXXX" />
                  </div>
                )}
              </div>
            </SubGroup>

            <SectionDivider />

            <SubGroup label="Address">
              <div className="flex flex-col gap-3">
                <AddressGroup label="Permanent Address" baseKey="permanentAddress" form={form} setForm={setForm} />
                <label className="flex items-center gap-2 text-xs text-[#222] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasPostalAddress}
                    onChange={e => setForm(f => ({ ...f, hasPostalAddress: e.target.checked }))}
                    className="w-4 h-4 accent-[#14213d] cursor-pointer"
                  />
                  Add Postal Address
                </label>
                {form.hasPostalAddress && (
                  <AddressGroup label="Postal Address" baseKey="postalAddress" form={form} setForm={setForm} />
                )}
              </div>
            </SubGroup>

          </div>
        </FormSection>

        {/* ── Section 2: Guarantor Details ── */}
        <FormSection number="2" title="Guarantor Details">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-[#fca311] uppercase tracking-widest mb-3">Guarantor 01</p>
              <GuarantorFields prefix="g1" form={form} setForm={setForm} errors={errors} setErrors={setErrors} addressCols={2} />
            </div>
            <div className="border-l border-[#e5e5e5] pl-4">
              <p className="text-[10px] font-semibold text-[#fca311] uppercase tracking-widest mb-3">Guarantor 02</p>
              <GuarantorFields prefix="g2" form={form} setForm={setForm} errors={errors} setErrors={setErrors} addressCols={2} />
            </div>
          </div>
        </FormSection>

        {/* ── Section 3: Items Grid ── */}
        <FormSection number="3" title="Items (Furniture)">
          <ItemsGrid items={items} setItems={setItems} />
        </FormSection>

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
