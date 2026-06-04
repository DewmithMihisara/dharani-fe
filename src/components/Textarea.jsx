export default function Textarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 3,
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
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="w-full px-4 py-2 rounded-lg border border-[#e5e5e5] bg-white text-xs text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100 resize-none"
      />
    </div>
  )
}
