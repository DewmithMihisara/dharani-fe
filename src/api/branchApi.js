import { apiDelete, apiGet, apiPost } from './api'

export async function getBranchesPaginated(pagination, token = null) {
  return apiPost('/branch/all', pagination, token)
}

export async function saveBranch(dto, token = null) {
  return apiPost('/branch', dto, token)
}

export async function getBranchDeleteSummary(id, token = null) {
  return apiGet(`/branch/${id}/delete-summary`, token)
}

export async function deleteBranch(id, token = null) {
  return apiDelete(`/branch/${id}`, token)
}
