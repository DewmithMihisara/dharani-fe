import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export async function getAllOrdersPaginated(pagination, token = null) {
  return apiPost('/retail-orders/all', pagination, token)
}

export async function getOrderById(id, token = null) {
  return apiGet('/retail-orders/' + id, token)
}

export async function deleteOrder(id, token = null) {
  return apiDelete('/retail-orders/' + id, token)
}

export async function updateOrderStatus(orderId, body, token = null) {
  return apiPost(`/retail-orders/${orderId}/status`, body, token)
}

export async function printPo(orderId, token = null) {
  return apiPatch(`/retail-orders/${orderId}/print-po`, {}, token)
}

export async function getRetailReportData(filters, token = null) {
  return apiPost('/retail-orders/report', filters, token)
}
