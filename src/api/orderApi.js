import { apiDelete, apiGet, apiPost } from './api'

export async function getBranches(token = null) {
  return apiGet('/ref/branches', token)
}

export async function getProjectsByBranch(branchId = null, token = null) {
  const path = branchId ? `/ref/projects?branchId=${branchId}` : '/ref/projects'
  return apiGet(path, token)
}

export async function getAllOrders(token = null) {
  return apiGet('/orders', token)
}

export async function getAllOrdersPaginated(pagination, token = null) {
  return apiPost('/orders/all', pagination, token)
}

export async function getOrderById(id, token = null) {
  return apiGet('/orders/' + id, token)
}

export async function deleteOrder(id, token = null) {
  return apiDelete('/orders/' + id, token)
}

export async function updateOrderStatus(orderId, body, token = null) {
  return apiPost(`/orders/${orderId}/status`, body, token)
}

export async function savePartialPayments(orderId, body, token = null) {
  return apiPost(`/orders/${orderId}/partial-payments`, body, token)
}

export async function getApprovedOrdersForExport(token = null) {
  return apiGet('/orders/export/approved', token)
}

export async function getReportData(filters, token = null) {
  return apiPost('/orders/report', filters, token)
}
