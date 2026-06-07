import { Check } from 'lucide-react'

export default function OrderSavedDialog({ orderCode, onPrint, onClose,
  title = 'Order saved successfully!',
  message = 'Do you want to print the Singer Finance Form?' }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg px-6 py-6 w-96">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
            <Check size={20} className="text-green-600" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#222]">{title}</p>
            <p className="text-xs text-[#aaa] mt-2">Order Code</p>
            <p className="text-base font-bold text-[#14213d] mt-0.5 tracking-wide">{orderCode}</p>
          </div>
        </div>
        <p className="text-xs text-[#888] text-center mb-5">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] transition-colors duration-100 cursor-pointer"
          >
            No
          </button>
          <button
            onClick={onPrint}
            className="px-4 py-2 text-sm rounded-lg bg-[#14213d] text-white hover:bg-[#fca311] hover:text-[#14213d] font-medium transition-colors duration-100 cursor-pointer"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
