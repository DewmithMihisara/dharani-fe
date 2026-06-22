import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export async function getProjectsPaginated(pagination, token = null) {
  return apiPost('/project/all', pagination, token)
}

export async function endProject(id, token = null) {
  return apiPatch(`/project/${id}/end`, {}, token)
}

export async function saveProject(dto, token = null) {
  return apiPost('/project', dto, token)
}

export async function getProjectDeleteSummary(id, token = null) {
  return apiGet(`/project/${id}/delete-summary`, token)
}

export async function deleteProject(id, token = null) {
  return apiDelete(`/project/${id}`, token)
}
