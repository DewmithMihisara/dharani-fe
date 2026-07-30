import { useState } from 'react'
import Button from './Button'

const inp = 'w-full px-3 py-2 rounded-lg border border-[#e5e5e5] bg-white text-xs text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100'

export default function AddSupplierDialog({ initialName = '', onClose, onSaved, onSave }) {
  const [name, setName] = useState(initialName)
  const [address, setAddress] = useState('')
  const [contactNo, setContactNo] = useState('')
  const [saving, setSaving] = useState(false)

  const canSave = name.trim() && address.trim() && contactNo.trim() && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      const res = await onSave({ name: name.trim(), address: address.trim(), contactNo: contactNo.trim() })
      if (res.status === 200) {
        onSaved({ id: res.data.supplierId, name: name.trim() })
      } else {
        alert(res.message || 'Failed to save supplier')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg px-6 py-5 w-96">
        <h2 className="text-sm font-semibold text-[#14213d] mb-4">Add New Supplier</h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Supplier Name<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <input value={name} onChange={e => setName(e.target.value)} className={inp} placeholder="e.g. ABC Traders" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Address<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <input value={address} onChange={e => setAddress(e.target.value)} className={inp} placeholder="e.g. No. 12, Main Street, Colombo" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#222]">
              Contact No<span className="text-[#fca311] ml-0.5">*</span>
            </label>
            <input value={contactNo} onChange={e => setContactNo(e.target.value)} className={inp} placeholder="e.g. 0771234567" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] transition-colors duration-100 cursor-pointer"
          >
            Cancel
          </button>
          <Button type="button" disabled={!canSave} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
