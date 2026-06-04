import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export async function saveBadge(dto, token = null) {
  return apiPost('/inventory/badges', dto, token)
}

export async function getBadges(token = null) {
  return apiGet('/inventory/badges', token)
}

export async function getBadgesPaginated(pagination, token = null) {
  return apiPost('/inventory/badges/all', pagination, token)
}

export async function getBadgeById(id, token = null) {
  return apiGet(`/inventory/badges/${id}`, token)
}

export async function approveBadge(id, token = null) {
  return apiPatch(`/inventory/badges/${id}/approve`, {}, token)
}

export async function endBadge(id, token = null) {
  return apiPatch(`/inventory/badges/${id}/end`, {}, token)
}

export async function getCategories(token = null) {
  return apiGet('/inventory/categories', token)
}

export async function getItemsByCategory(categoryId, token = null) {
  return apiGet(`/inventory/items?categoryId=${categoryId}`, token)
}

export async function getModelsByItem(itemId, token = null) {
  return apiGet(`/inventory/models?itemId=${itemId}`, token)
}

export async function getApprovedItems(token = null) {
  return apiGet('/inventory/approved-items', token)
}

export async function saveItem(dto, token = null) {
  return apiPost('/inventory/badges/item', dto, token)
}

export async function getItemsByBadge(badgeId, pagination, token = null) {
  return apiPost(`/inventory/badges/${badgeId}/items`, pagination, token)
}

export async function deleteBadgeItem(id, token = null) {
  return apiDelete(`/inventory/badges/items/${id}`, token)
}
