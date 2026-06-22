import { apiDelete, apiGet, apiPost } from './api'

export async function getBranches(token = null) {
  return apiGet('/ref/branches', token)
}

export async function getCompanies(token = null) {
  return apiGet('/ref/companies', token)
}

export async function getBranchesByCompany(companyId, token = null) {
  return apiGet(`/ref/branches?companyId=${companyId}`, token)
}

export async function getProjectsByBranch(branchId = null, token = null, excludeEnded = false) {
  let path = branchId ? `/ref/projects?branchId=${branchId}` : '/ref/projects'
  if (excludeEnded) path += `${branchId ? '&' : '?'}excludeEnded=true`
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

export async function getApprovedOrdersForExport(projectId, token = null) {
  return apiGet(`/orders/export/approved?projectId=${projectId}`, token)
}

export async function getReportData(filters, token = null) {
  return apiPost('/orders/report', filters, token)
}
