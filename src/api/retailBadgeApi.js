import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export async function getBadgesPaginated(pagination, token = null) {
  return apiPost('/retail-items/badges/all', pagination, token)
}

export async function getBadgeById(id, token = null) {
  return apiGet(`/retail-items/badges/${id}`, token)
}

export async function approveBadge(id, token = null) {
  return apiPatch(`/retail-items/badges/${id}/approve`, {}, token)
}

export async function endBadge(id, token = null) {
  return apiPatch(`/retail-items/badges/${id}/end`, {}, token)
}

export async function getApprovedItems(token = null) {
  return apiGet('/retail-items/approved-items', token)
}

export async function saveItem(dto, token = null) {
  return apiPost('/retail-items/badges/item', dto, token)
}

export async function uploadBadge(dto, token = null) {
  return apiPost('/retail-items/badges/upload', dto, token)
}

export async function getItemsByBadge(badgeId, pagination, token = null) {
  return apiPost(`/retail-items/badges/${badgeId}/items`, pagination, token)
}

export async function deleteBadgeItem(id, token = null) {
  return apiDelete(`/retail-items/badges/items/${id}`, token)
}
