const API_BASE = import.meta.env.VITE_API_BASE

function handleAuthExpiry(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return true
  }
  return false
}

export async function apiPost(path, body, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (handleAuthExpiry(res)) return { message: 'Session expired', status: res.status, data: null }
  return res.json()
}

export async function apiGet(path, token = null) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { headers })
  if (handleAuthExpiry(res)) return { message: 'Session expired', status: res.status, data: null }
  return res.json()
}

export async function apiPatch(path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: body ? JSON.stringify(body) : null,
  })
  if (handleAuthExpiry(res)) return { message: 'Session expired', status: res.status, data: null }
  return res.json()
}

export async function apiDelete(path, token = null) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers })
  if (handleAuthExpiry(res)) return { message: 'Session expired', status: res.status, data: null }
  return res.json()
}
