function parseLockoutDate(value) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export function isProgramLocked() {
  const d = parseLockoutDate(import.meta.env.VITE_PROGRAM_LOCKOUT_DATETIME)
  return d !== null && new Date() >= d
}

export function isReportLocked() {
  const d = parseLockoutDate(import.meta.env.VITE_REPORT_LOCKOUT_DATETIME)
  return d !== null && new Date() >= d
}
