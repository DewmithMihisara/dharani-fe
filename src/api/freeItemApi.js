import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export async function getFreeItemBadgesPaginated(pagination, token = null) {
  return apiPost('/free-items/badges/all', pagination, token)
}

export async function getFreeItemBadgeById(id, token = null) {
  return apiGet(`/free-items/badges/${id}`, token)
}

export async function approveFreeItemBadge(id, token = null) {
  return apiPatch(`/free-items/badges/${id}/approve`, {}, token)
}

export async function endFreeItemBadge(id, token = null) {
  return apiPatch(`/free-items/badges/${id}/end`, {}, token)
}

export async function saveFreeItem(dto, token = null) {
  return apiPost('/free-items/badges/item', dto, token)
}

export async function uploadFreeItemBadge(dto, token = null) {
  return apiPost('/free-items/badges/upload', dto, token)
}

export async function getFreeItemsByBadge(badgeId, pagination, token = null) {
  return apiPost(`/free-items/badges/${badgeId}/items`, pagination, token)
}

export async function deleteFreeItem(id, token = null) {
  return apiDelete(`/free-items/badges/items/${id}`, token)
}

export async function getSuppliers(token = null) {
  return apiGet('/free-items/suppliers', token)
}

export async function saveSupplier(dto, token = null) {
  return apiPost('/free-items/suppliers', dto, token)
}

export async function getApprovedFreeItems(projectId, token = null) {
  return apiGet(`/free-items/approved-items?projectId=${projectId}`, token)
}
