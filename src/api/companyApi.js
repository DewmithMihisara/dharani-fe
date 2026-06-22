import { apiDelete, apiGet, apiPost } from './api'

export async function getCompaniesPaginated(pagination, token = null) {
  return apiPost('/company/all', pagination, token)
}

export async function getCompanyOptions(token = null) {
  return apiGet('/company/options', token)
}

export async function saveCompany(dto, token = null) {
  return apiPost('/company', dto, token)
}

export async function getCompanyDeleteSummary(id, token = null) {
  return apiGet(`/company/${id}/delete-summary`, token)
}

export async function deleteCompany(id, token = null) {
  return apiDelete(`/company/${id}`, token)
}
