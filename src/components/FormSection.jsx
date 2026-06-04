export default function FormSection({ number, title, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#d8d8d8]">
      <div className="px-5 py-3 border-b border-[#e5e5e5] flex items-center gap-3">
        <span className="w-6 h-6 rounded-lg bg-[#14213d] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <h2 className="text-xs font-semibold text-[#14213d] tracking-wide">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
