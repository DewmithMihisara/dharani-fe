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
  error,
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[#222]">
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
        className={`w-full px-4 py-2 rounded-lg border ${error ? 'border-red-400 focus:border-red-500' : 'border-[#e5e5e5] focus:border-[#14213d]'} bg-white text-xs text-[#000] placeholder-[#bbb] focus:outline-none transition-colors duration-100`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
