import client from './client.js'

export async function listProjects() {
  const res = await client.get('/api/projects/')
  return res.data
}

export async function createProject(data) {
  const res = await client.post('/api/projects/', data)
  return res.data
}

export async function getProject(id) {
  const res = await client.get(`/api/projects/${id}`)
  return res.data
}

export async function updateProject(id, data) {
  const res = await client.patch(`/api/projects/${id}`, data)
  return res.data
}

export async function deleteProject(id) {
  const res = await client.delete(`/api/projects/${id}`)
  return res.data
}

export async function exportProject(id) {
  const res = await client.get(`/api/projects/${id}/export`)
  return res.data
}

export async function importProject(data) {
  const res = await client.post('/api/projects/import', data)
  return res.data
}
