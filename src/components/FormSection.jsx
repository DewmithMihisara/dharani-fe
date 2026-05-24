export default function FormSection({ number, title, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center gap-3">
        <span className="w-7 h-7 rounded-lg bg-[#14213d] text-white text-xs font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <h2 className="text-sm font-semibold text-[#14213d] tracking-wide">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
