import { apiDelete, apiGet, apiPost } from './api'

export async function getAllTripsPaginated(pagination, token = null) {
  return apiPost('/deliveries/all', pagination, token)
}

export async function getTripById(id, token = null) {
  return apiGet('/deliveries/' + id, token)
}

export async function getCandidateOrders(token = null) {
  return apiGet('/deliveries/candidate-orders', token)
}

export async function saveTrip(body, token = null) {
  return apiPost('/deliveries', body, token)
}

export async function updateTripStatus(id, body, token = null) {
  return apiPost(`/deliveries/${id}/status`, body, token)
}

export async function deleteTrip(id, token = null) {
  return apiDelete('/deliveries/' + id, token)
}
