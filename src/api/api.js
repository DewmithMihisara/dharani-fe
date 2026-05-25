const API_BASE = import.meta.env.VITE_API_BASE

export async function apiPost(path, body, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function apiGet(path, token = null) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { headers })
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
  return res.json()
}

export async function apiDelete(path, token = null) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers })
  return res.json()
}
