import { apiGet, apiPatch, apiPost } from './api'

export async function getDisplayItemsPaginated(pagination, token = null) {
  return apiPost('/display-items/all', pagination, token)
}

export async function saveDisplayItem(dto, token = null) {
  return apiPost('/display-items', dto, token)
}

export async function changeDisplayItemStatus(id, token = null) {
  return apiPatch(`/display-items/${id}/status`, {}, token)
}

export async function getDisplayItemSuppliers(token = null) {
  return apiGet('/display-items/suppliers', token)
}

export async function saveDisplayItemSupplier(dto, token = null) {
  return apiPost('/display-items/suppliers', dto, token)
}

export async function getDisplayItemVoucher(dto, token = null) {
  return apiPost('/display-items/voucher', dto, token)
}
