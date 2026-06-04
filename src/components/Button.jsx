export default function Button({
  children,
  type = 'button',
  fullWidth = false,
  variant = 'primary',
  disabled = false,
  onClick,
  className = '',
}) {
  const base =
    'inline-flex items-center justify-center py-2 px-5 rounded-lg text-xs font-semibold tracking-wide transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-[#14213d] text-white hover:bg-[#fca311] hover:text-[#14213d]',
    secondary:
      'bg-[#14213d] text-white hover:bg-[#fca311] hover:text-[#14213d]',
    ghost:
      'bg-transparent text-[#14213d] border border-[#14213d] hover:bg-[#14213d] hover:text-white',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}
