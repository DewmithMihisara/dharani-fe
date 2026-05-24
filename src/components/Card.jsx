export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-[#d8d8d8] ${className}`}>
      {children}
    </div>
  )
}
