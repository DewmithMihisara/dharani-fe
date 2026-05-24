import { useState, useEffect } from 'react'

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 17) return 'Good Afternoon'
  if (hour >= 17 && hour < 21) return 'Good Evening'
  return 'Good Night'
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export default function DashboardPage() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="p-8">
      <p className="text-sm text-[#999] mb-2 tracking-wide">
        {formatDate(now)}
      </p>
      <h1 className="text-3xl font-semibold text-[#14213d]">
        {getGreeting(now.getHours())}
      </h1>
      <p className="text-6xl font-light text-[#14213d] mt-6 tracking-tight tabular-nums">
        {formatTime(now)}
      </p>
    </div>
  )
}
