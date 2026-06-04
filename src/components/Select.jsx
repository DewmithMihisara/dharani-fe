export default function Select({
  label,
  id,
  value,
  onChange,
  options = [],
  required = false,
  placeholder = 'Select...',
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[#222]">
          {label}
          {required && <span className="text-[#fca311] ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 rounded-lg border border-[#e5e5e5] bg-white text-xs text-[#000] focus:outline-none focus:border-[#14213d] transition-colors duration-100 cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
