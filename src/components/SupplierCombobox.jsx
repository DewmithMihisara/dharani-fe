import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'

export default function SupplierCombobox({ value, options, onChange, onAddNew, placeholder, disabled, className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes((value ?? '').toLowerCase())
  )
  const showAddNew = !disabled && (value ?? '').trim() !== '' && filtered.length === 0

  return (
    <div ref={ref} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          value={value ?? ''}
          onChange={e => { onChange(e.target.value, null); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
        {open && !disabled && filtered.length > 0 && (
          <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#e5e5e5] rounded-lg shadow-md max-h-52 overflow-y-auto text-sm">
            {filtered.map(o => (
              <li
                key={o.id}
                onMouseDown={() => { onChange(o.label, o.id); setOpen(false) }}
                className="px-3 py-2 cursor-pointer hover:bg-[#f0f0f0] text-[#14213d] flex items-center gap-2"
              >
                <span>{o.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {showAddNew && (
        <button
          type="button"
          onClick={() => onAddNew(value)}
          title="Add new supplier"
          className="shrink-0 p-2 rounded-lg border border-[#14213d] text-[#14213d] hover:bg-[#14213d] hover:text-white transition-colors duration-100 cursor-pointer"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  )
}
