import { useState, useEffect, useRef } from 'react'

export default function Combobox({ value, options, onChange, placeholder, disabled, className }) {
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

  return (
    <div ref={ref} className="relative">
      <input
        value={value ?? ''}
        onChange={e => { onChange(e.target.value, null, null); setOpen(true) }}
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
              onMouseDown={() => { onChange(o.label, o.id, o.size ?? null); setOpen(false) }}
              className="px-3 py-2 cursor-pointer hover:bg-[#f0f0f0] text-[#14213d] flex items-center gap-2"
            >
              <span>{o.label}</span>
              {o.sub && <span className="text-xs text-[#999]">{o.sub}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
