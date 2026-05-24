export default function Logo({ showText = true, size = 'md', dark = false }) {
  const sizes = {
    sm: { box: 'w-10 h-10 rounded-lg', letter: 'text-lg', title: 'text-base', sub: 'text-xs' },
    md: { box: 'w-14 h-14 rounded-xl', letter: 'text-2xl', title: 'text-lg', sub: 'text-sm' },
    lg: { box: 'w-18 h-18 rounded-2xl', letter: 'text-3xl', title: 'text-xl', sub: 'text-sm' },
  }
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center">
      <div className={`${s.box} bg-[#fca311] flex items-center justify-center ${showText ? 'mb-4' : ''}`}>
        <span className={`${s.letter} font-bold text-[#14213d]`}>D</span>
      </div>
      {showText && (
        <>
          <h1 className={`${s.title} font-semibold leading-tight ${dark ? 'text-white' : 'text-[#14213d]'}`}>
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
