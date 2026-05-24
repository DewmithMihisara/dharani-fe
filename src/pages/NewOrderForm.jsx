import { useState } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Select from '../components/Select'
import FormSection from '../components/FormSection'
import Button from '../components/Button'

const MOCK_CATALOGUE = {
  'FUR-001':  { item_name: 'Dining Table (6-Seater)', model: 'DT-6S-2024', item_value: 45000 },
  'FUR-002':  { item_name: 'Dining Table (4-Seater)', model: 'DT-4S-2024', item_value: 32000 },
  'FUR-003':  { item_name: 'Coffee Table',            model: 'CT-RND-01',  item_value: 18000 },
  'COUCH-01': { item_name: '3-Seater Sofa',           model: 'SF-3S-LUX',  item_value: 65000 },
  'COUCH-02': { item_name: 'L-Shape Sofa',            model: 'SF-L-LRG',   item_value: 88000 },
  'COUCH-03': { item_name: 'Sofa Set (3+1+1)',        model: 'SF-311-STD', item_value: 78000 },
  'BED-001':  { item_name: 'King Size Bed Frame',     model: 'BF-KNG-01',  item_value: 58000 },
  'BED-002':  { item_name: 'Double Bed Frame',        model: 'BF-DBL-01',  item_value: 42000 },
  'WRD-001':  { item_name: 'Wardrobe 3-Door',         model: 'WD-3D-STD',  item_value: 38000 },
  'WRD-002':  { item_name: 'Wardrobe 4-Door',         model: 'WD-4D-STD',  item_value: 50000 },
}

const DURATION_OPTIONS = [
  { value: '12', label: '12 months' },
  { value: '24', label: '24 months' },
  { value: '36', label: '36 months' },
  { value: '48', label: '48 months' },
  { value: '60', label: '60 months' },
]

const MARITAL_OPTIONS      = [{ value: 'Married', label: 'Married' }, { value: 'Single', label: 'Single' }]
const PAYMENT_OPTIONS      = [{ value: 'salary_deduction', label: 'Salary Deduction' }, { value: 'other', label: 'Other' }]
const RELATIONSHIP_OPTIONS = [
  { value: 'Mother', label: 'Mother' },
  { value: 'Father', label: 'Father' },
  { value: 'Brother', label: 'Brother' },
  { value: 'Sister', label: 'Sister' },
]

const INITIAL_FORM = {
  // Section 1 – Employment
  companyName: '', employeeId: '', employmentStartDate: '', departmentAndDesignation: '',
  // Section 1 – Personal
  fullName: '', nicNumber: '', dateOfBirth: '', maritalStatus: '', nationality: '',
  spouseName: '', spouseContactNumber: '',
  // Section 1 – Contact
  mobileNumber: '', landlineNumber: '', emailAddress: '',
  // Section 1 – Financial
  expectedIncome: '', paymentMethod: '',
  // Section 1 – Address
  nearestPostOffice: '', mainCity: '',
  permanentAddress1: '', permanentAddress2: '', permanentAddress3: '', permanentAddress4: '',
  postalAddress1: '',    postalAddress2: '',    postalAddress3: '',    postalAddress4: '',
  routeDirectionDescription: '',
  // Section 1 – Other
  otherNotes: '',
  // Section 2 – Relative
  relativeFullName: '', relativeRelationship: '', relativeMobileNumber: '',
  relativeLandlineNumber: '', relativeAlternativeNumber: '',
  relativePermanentAddress1: '', relativePermanentAddress2: '', relativePermanentAddress3: '', relativePermanentAddress4: '',
  // Section 3 – Guarantor 1
  g1_employeeId: '', g1_fullName: '', g1_nicNumber: '', g1_mobileNumber: '', g1_landlineNumber: '',
  g1_nearestPostOffice: '', g1_nearestMainCity: '',
  g1_permanentAddress1: '', g1_permanentAddress2: '', g1_permanentAddress3: '', g1_permanentAddress4: '',
  g1_postalAddress1: '',    g1_postalAddress2: '',    g1_postalAddress3: '',    g1_postalAddress4: '',
  // Section 3 – Guarantor 2
  g2_employeeId: '', g2_fullName: '', g2_nicNumber: '', g2_mobileNumber: '', g2_landlineNumber: '',
  g2_nearestPostOffice: '', g2_nearestMainCity: '',
  g2_permanentAddress1: '', g2_permanentAddress2: '', g2_permanentAddress3: '', g2_permanentAddress4: '',
  g2_postalAddress1: '',    g2_postalAddress2: '',    g2_postalAddress3: '',    g2_postalAddress4: '',
}

function field(form, setForm, key, extra = {}) {
  return { id: key, value: form[key], onChange: e => setForm(f => ({ ...f, [key]: e.target.value })), ...extra }
}

function LKR(n) {
  return `LKR ${Number(n).toLocaleString('en-LK')}`
}

const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100'

function SubGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-[#aaa] uppercase tracking-widest">{label}</p>
      {children}
    </div>
  )
}

function SectionDivider() {
  return <div className="border-t border-[#f0f0f0]" />
}

// Renders a 2×2 grid of 4 address inputs. Fields 1 and 4 are required.
function AddressGroup({ label, baseKey, form, setForm }) {
  const val = n => form[`${baseKey}${n}`] ?? ''
  const onChange = n => e => setForm(prev => ({ ...prev, [`${baseKey}${n}`]: e.target.value }))
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-[#222]">
        {label}
        <span className="text-xs text-[#aaa] font-normal ml-2">— 1st &amp; 4th fields are required</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <input value={val(1)} onChange={onChange(1)} required placeholder="No. & Street Name *" className={inputCls} />
        <input value={val(2)} onChange={onChange(2)} placeholder="Village / Area"               className={inputCls} />
        <input value={val(3)} onChange={onChange(3)} placeholder="City / Town"                  className={inputCls} />
        <input value={val(4)} onChange={onChange(4)} required placeholder="District *"          className={inputCls} />
      </div>
    </div>
  )
}

// ── Items Grid ─────────────────────────────────────────────────────────────
function ItemsGrid({ items, setItems }) {
  const [searchCode, setSearchCode] = useState('')
  const [searchError, setSearchError] = useState('')

  function handleAdd() {
    const code = searchCode.trim().toUpperCase()
    if (!code) return
    if (items.find(i => i.code === code)) { setSearchError('This item is already added.'); return }
    const found = MOCK_CATALOGUE[code]
    if (!found) { setSearchError(`Item code "${code}" not found.`); return }
    setItems(prev => [...prev, { code, ...found, duration_months: 24 }])
    setSearchCode('')
    setSearchError('')
  }

  function handleDurationChange(code, months) {
    setItems(prev => prev.map(i => i.code === code ? { ...i, duration_months: Number(months) } : i))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#222]">Item Code</label>
        <div className="flex gap-2">
          <input
            value={searchCode}
            onChange={e => { setSearchCode(e.target.value); setSearchError('') }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. FUR-001, COUCH-02"
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#14213d] text-white text-sm font-medium hover:bg-[#fca311] hover:text-[#14213d] transition-colors duration-150 cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} />
            Add Item
          </button>
        </div>
        {searchError
          ? <p className="text-xs text-red-500">{searchError}</p>
          : <p className="text-xs text-[#bbb]">Available codes: {Object.keys(MOCK_CATALOGUE).join(', ')}</p>
        }
      </div>

      {items.length > 0 ? (
        <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f5f5f5] text-[#555] text-left">
                <th className="px-4 py-2.5 font-medium">Item Name</th>
                <th className="px-4 py-2.5 font-medium">Model</th>
                <th className="px-4 py-2.5 font-medium">Value</th>
                <th className="px-4 py-2.5 font-medium">Duration</th>
                <th className="px-4 py-2.5 font-medium">Monthly</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const monthly = Math.ceil(item.item_value / item.duration_months)
                return (
                  <tr key={item.code} className={`border-t border-[#ebebeb] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                    <td className="px-4 py-3 text-[#222] font-medium">{item.item_name}</td>
                    <td className="px-4 py-3 text-[#666]">{item.model}</td>
                    <td className="px-4 py-3 text-[#444]">{LKR(item.item_value)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.duration_months}
                        onChange={e => handleDurationChange(item.code, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#e5e5e5] text-sm text-[#000] bg-white focus:outline-none focus:border-[#14213d] cursor-pointer"
                      >
                        {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#14213d]">{LKR(monthly)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setItems(prev => prev.filter(i => i.code !== item.code))}
                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {items.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-[#e5e5e5] bg-[#f9f9f9]">
                  <td colSpan={4} className="px-4 py-3 text-sm font-medium text-[#555]">Total Monthly Installment</td>
                  <td className="px-4 py-3 font-bold text-[#14213d]">
                    {LKR(items.reduce((sum, i) => sum + Math.ceil(i.item_value / i.duration_months), 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <div className="border border-dashed border-[#d8d8d8] rounded-lg py-10 text-center">
          <p className="text-sm text-[#bbb]">No items added yet. Search by item code above.</p>
        </div>
      )}
    </div>
  )
}

// ── Guarantor block (reused for G1 + G2) ──────────────────────────────────
function GuarantorFields({ prefix, form, setForm }) {
  const f = (key, extra) => field(form, setForm, `${prefix}_${key}`, extra)
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <Input label="Employee ID" {...f('employeeId')} placeholder="Emp ID" />
        <Input label="Full Name"   {...f('fullName')}   placeholder="Full name with surname" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label="NIC Number"    {...f('nicNumber')}      placeholder="NIC" />
        <Input label="Mobile Number" {...f('mobileNumber')}   type="tel" placeholder="07X XXX XXXX" />
        <Input label="Landline"      {...f('landlineNumber')} type="tel" placeholder="0XX XXX XXXX" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nearest Post Office" {...f('nearestPostOffice')} placeholder="Post office name" />
        <Input label="Nearest Main City"   {...f('nearestMainCity')}   placeholder="Nearest city" />
      </div>
      <AddressGroup label="Permanent Address" baseKey={`${prefix}_permanentAddress`} form={form} setForm={setForm} />
      <AddressGroup label="Postal Address"    baseKey={`${prefix}_postalAddress`}    form={form} setForm={setForm} />
    </div>
  )
}

// ── Main form ──────────────────────────────────────────────────────────────
export default function NewOrderForm({ onBack }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [items, setItems] = useState([])

  const f = (key, extra) => field(form, setForm, key, extra)

  function handleSubmit(e) {
    e.preventDefault()
    console.log({ form, items })
    alert('Order saved (mock — backend coming in Phase 2)')
    onBack()
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">

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
        <h1 className="text-xl font-semibold text-[#14213d]">New Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* ── Section 1: Customer Details ── */}
        <FormSection number="1" title="Customer Details">
          <div className="flex flex-col gap-5">

            <SubGroup label="Employment">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Company / Employer"       {...f('companyName')}              placeholder="e.g. MAS Holdings" className="col-span-2" />
                <Input label="Employee ID"              {...f('employeeId')}               placeholder="Emp. number" />
                <Input label="Department & Designation" {...f('departmentAndDesignation')} placeholder="Dept — Designation" className="col-span-2" />
                <Input label="Employment Start Date"    {...f('employmentStartDate')}      type="date" />
              </div>
            </SubGroup>

            <SectionDivider />

            <SubGroup label="Personal Information">
              <div className="grid grid-cols-3 gap-4">
                <Input  label="Full Name (with surname)" {...f('fullName')}      placeholder="Full legal name" className="col-span-2" />
                <Input  label="NIC Number"               {...f('nicNumber')}     placeholder="National ID" />
                <Input  label="Date of Birth"            {...f('dateOfBirth')}   type="date" />
                <Select label="Marital Status"           {...f('maritalStatus')} options={MARITAL_OPTIONS} />
                <Input  label="Nationality"              {...f('nationality')}   placeholder="e.g. Sri Lankan" />
                {form.maritalStatus === 'Married' && (
                  <>
                    <Input label="Spouse Name"           {...f('spouseName')}          placeholder="Spouse full name" className="col-span-2" />
                    <Input label="Spouse Contact Number" {...f('spouseContactNumber')} type="tel" placeholder="07X XXX XXXX" />
                  </>
                )}
              </div>
            </SubGroup>

            <SectionDivider />

            <SubGroup label="Contact Details">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Mobile Number"   {...f('mobileNumber')}  type="tel"   placeholder="07X XXX XXXX" />
                <Input label="Landline Number" {...f('landlineNumber')} type="tel"  placeholder="0XX XXX XXXX" />
                <Input label="Email Address"   {...f('emailAddress')}  type="email" placeholder="example@email.com" />
              </div>
            </SubGroup>

            <SectionDivider />

            <SubGroup label="Financial">
              <div className="grid grid-cols-2 gap-4">
                <Input  label="Expected Monthly Income (LKR)" {...f('expectedIncome')} type="number" placeholder="Gross monthly salary" />
                <Select label="Payment Method"                {...f('paymentMethod')}  options={PAYMENT_OPTIONS} />
              </div>
            </SubGroup>

            <SectionDivider />

            <SubGroup label="Address">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nearest Post Office" {...f('nearestPostOffice')} placeholder="Post office name" />
                  <Input label="Main City"           {...f('mainCity')}          placeholder="Nearest main city" />
                </div>
                <AddressGroup label="Permanent Address" baseKey="permanentAddress" form={form} setForm={setForm} />
                <AddressGroup label="Postal Address"    baseKey="postalAddress"    form={form} setForm={setForm} />
                <Textarea label="Route / Directions to Home" {...f('routeDirectionDescription')} placeholder="How to reach the delivery location" rows={2} />
              </div>
            </SubGroup>

            <SectionDivider />

            <SubGroup label="Other">
              <Textarea label="Special Notes" {...f('otherNotes')} placeholder="Any additional information or remarks" rows={3} />
            </SubGroup>

          </div>
        </FormSection>

        {/* ── Section 2: Relative Details ── */}
        <FormSection number="2" title="Relative Details (Parent / Sibling)">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Input  label="Full Name"    {...f('relativeFullName')}     placeholder="Full name with surname" className="col-span-2" />
              <Select label="Relationship" {...f('relativeRelationship')} options={RELATIONSHIP_OPTIONS} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Mobile Number"      {...f('relativeMobileNumber')}      type="tel" placeholder="07X XXX XXXX" />
              <Input label="Landline Number"    {...f('relativeLandlineNumber')}    type="tel" placeholder="0XX XXX XXXX" />
              <Input label="Alternative Number" {...f('relativeAlternativeNumber')} type="tel" placeholder="Any other contact" />
            </div>
            <AddressGroup label="Permanent Address" baseKey="relativePermanentAddress" form={form} setForm={setForm} />
          </div>
        </FormSection>

        {/* ── Section 3: Guarantor Details ── */}
        <FormSection number="3" title="Guarantor Details">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-[#fca311] uppercase tracking-widest mb-4">Guarantor 01</p>
              <GuarantorFields prefix="g1" form={form} setForm={setForm} />
            </div>
            <div className="border-t border-[#e5e5e5] pt-6">
              <p className="text-xs font-semibold text-[#fca311] uppercase tracking-widest mb-4">Guarantor 02</p>
              <GuarantorFields prefix="g2" form={form} setForm={setForm} />
            </div>
          </div>
        </FormSection>

        {/* ── Section 4: Items Grid ── */}
        <FormSection number="4" title="Items (Furniture)">
          <ItemsGrid items={items} setItems={setItems} />
        </FormSection>

        {/* ── Actions ── */}
        <div className="bg-white border border-[#d8d8d8] rounded-xl px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-[#aaa]">
            All fields marked <span className="text-[#fca311] font-semibold">*</span> are required
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={onBack}>Cancel</Button>
            <Button type="submit">Save Order</Button>
          </div>
        </div>

      </form>
    </div>
  )
}
