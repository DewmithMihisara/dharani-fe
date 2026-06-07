const variants = {
  approval:     { label: 'Approval Processing', bg: 'bg-[#fca311]/15', text: 'text-[#a06800]' },
  approved:     { label: 'Approved',            bg: 'bg-green-100',    text: 'text-green-700'  },
  not_approved: { label: 'Not Approved',        bg: 'bg-red-100',      text: 'text-red-700'    },
  processing:   { label: 'Order Processing',    bg: 'bg-blue-100',     text: 'text-blue-700'   },
  delivery:     { label: 'On Delivery',         bg: 'bg-orange-100',   text: 'text-orange-700' },
  delivered:    { label: 'Delivered',           bg: 'bg-green-100',    text: 'text-green-700'  },
}

export default function Badge({ variant, label, className = '' }) {
  const v = variants[variant] ?? { label: label ?? variant, bg: 'bg-gray-100', text: 'text-gray-600' }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${v.bg} ${v.text} ${className}`}
    >
      {label ?? v.label}
    </span>
  )
}
