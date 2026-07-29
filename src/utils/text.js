export function capitalizeWords(str) {
  let result = ''
  let atWordStart = true
  for (const ch of str) {
    if (atWordStart && /[a-zA-Z]/.test(ch)) {
      result += ch.toUpperCase()
      atWordStart = false
    } else {
      result += ch
      atWordStart = /\s/.test(ch)
    }
  }
  return result
}

export function buildFullNameWithInitials(surname, otherNames) {
  const initials = otherNames.trim().split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).join(' ')
  return [initials, surname.trim()].filter(Boolean).join(' ')
}
