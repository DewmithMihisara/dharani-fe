import { apiGet, apiDelete, apiPost } from './api'

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

// Stub — Singer Finance Form print API details to be provided
export async function printSingerForm(orderId, token = null) {
  // implementation coming
}
