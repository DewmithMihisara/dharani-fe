import logoImg from '../assets/logo.png'

export default function Logo({ showText = true, size = 'md', dark = false }) {
  const sizes = {
    sm: { img: 'w-10 h-10', title: 'text-base', sub: 'text-xs' },
    md: { img: 'w-16 h-16', title: 'text-lg',  sub: 'text-sm' },
    lg: { img: 'w-20 h-20', title: 'text-xl',  sub: 'text-sm' },
  }
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center">
      <img
        src={logoImg}
        alt="Dharani Ceylon Furnitures"
        className={`${s.img} object-contain ${showText ? 'mb-4' : ''}`}
      />
      {showText && (
        <>
          <h1 className={`${s.title} font-semibold leading-tight text-center ${dark ? 'text-white' : 'text-[#14213d]'}`}>
            Dharani Ceylon Furnitures
          </h1>
          <p className={`${s.sub} mt-1 ${dark ? 'text-white/50' : 'text-[#888]'}`}>
            Management System
          </p>
        </>
      )}
    </div>
  )
}
