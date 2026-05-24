export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#222]">
          {label}
          {required && <span className="text-[#fca311] ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-4 py-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100"
      />
    </div>
  )
}
