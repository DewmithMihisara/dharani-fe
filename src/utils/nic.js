// NIC day-of-year is always encoded against a fixed 29-day February,
// even for births in non-leap years — so decoding must not adjust for the actual year.
const DAYS_IN_YEAR = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function doyToMonthDay(doy) {
  let month = 0
  let remaining = doy
  for (; month < 12; month++) {
    if (remaining <= DAYS_IN_YEAR[month]) break
    remaining -= DAYS_IN_YEAR[month]
  }
  if (month >= 12 || remaining < 1) return null
  return { month: month + 1, day: remaining }
}

export function extractNicInfo(nicRaw) {
  if (!nicRaw) return null
  const nic = nicRaw.trim().toUpperCase()
  let digits, year
  if (/^\d{9}[VX]$/.test(nic)) {
    digits = nic.slice(0, 9)
    year = 1900 + parseInt(digits.slice(0, 2), 10)
  } else if (/^\d{12}$/.test(nic)) {
    digits = nic
    year = parseInt(digits.slice(0, 4), 10)
  } else {
    return null
  }
  const doyRaw = digits.length === 9 ? parseInt(digits.slice(2, 5), 10) : parseInt(digits.slice(4, 7), 10)
  let gender, doy
  if (doyRaw > 500) { gender = 'Female'; doy = doyRaw - 500 } else { gender = 'Male'; doy = doyRaw }
  if (doy < 1 || doy > 366) return null
  const md = doyToMonthDay(doy)
  if (!md) return null
  const mm = String(md.month).padStart(2, '0')
  const dd = String(md.day).padStart(2, '0')
  return { dateOfBirth: `${year}-${mm}-${dd}`, gender }
}

export function isValidNic(nicRaw) {
  return extractNicInfo(nicRaw) !== null
}
