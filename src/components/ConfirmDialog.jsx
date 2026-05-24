export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg px-6 py-5 w-80">
        <p className="text-sm text-[#222] mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] transition-colors duration-100 cursor-pointer">
            No
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-[#14213d] text-white hover:bg-[#fca311] hover:text-[#14213d] font-medium transition-colors duration-100 cursor-pointer">
            Yes
          </button>
        </div>
      </div>
    </div>
  )
}
