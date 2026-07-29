import { Lock, LogOut, X } from 'lucide-react'

export default function LicenseLockDialog({ variant = 'full', onLogout, onClose }) {
  const isFull = variant === 'full'
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0f1f]/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#fca311]/40 via-transparent to-[#fca311]/20 blur-xl" />
        <div className="relative bg-gradient-to-b from-[#14213d] to-[#0d1729] rounded-3xl border border-white/10 shadow-2xl px-8 py-10 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fca311] via-[#ffb84d] to-[#fca311]" />

          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-[#fca311]/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#fca311] to-[#e0900a] flex items-center justify-center shadow-lg">
              <Lock size={30} className="text-[#14213d]" strokeWidth={2.2} />
            </div>
          </div>

          <h2 className="text-white text-xl font-bold tracking-wide mb-2">
            {isFull ? 'Software Locked' : 'Feature Locked'}
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-1">
            {isFull
              ? 'Access to Dharani Ceylon Furnitures has been suspended.'
              : 'The Reports feature has been suspended.'}
          </p>
          <p className="text-white/60 text-sm leading-relaxed mb-7">
            Please complete the pending developer payments to {isFull ? 'unlock the software' : 'unlock this feature'}.
          </p>

          <div className="h-px bg-white/10 mb-6" />

          {isFull ? (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#fca311] text-[#14213d] text-sm font-semibold hover:bg-white transition-colors duration-150 cursor-pointer"
            >
              <LogOut size={16} strokeWidth={2.2} /> Logout
            </button>
          ) : (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#fca311] text-[#14213d] text-sm font-semibold hover:bg-white transition-colors duration-150 cursor-pointer"
            >
              <X size={16} strokeWidth={2.2} /> Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
