import { apiGet, apiPost } from './api'

export async function getDisplayItemsPaginated(pagination, token = null) {
  return apiPost('/display-items/all', pagination, token)
}

export async function saveDisplayItem(dto, token = null) {
  return apiPost('/display-items', dto, token)
}

export async function getDisplayItemsBySupplier(supplierId, token = null) {
  return apiGet(`/display-items/by-supplier?supplierId=${supplierId}`, token)
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
