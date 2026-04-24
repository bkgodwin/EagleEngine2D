import client from './client.js'

export async function listUsers() {
  const res = await client.get('/api/admin/users')
  return res.data
}

export async function updateUser(id, data) {
  const res = await client.patch(`/api/admin/users/${id}`, data)
  return res.data
}

export async function listAllGames() {
  const res = await client.get('/api/admin/games')
  return res.data
}

export async function moderateGame(id, data) {
  const res = await client.patch(`/api/admin/games/${id}`, data)
  return res.data
}

export async function deleteAdminGame(id) {
  const res = await client.delete(`/api/admin/games/${id}`)
  return res.data
}

export async function getStats() {
  const res = await client.get('/api/admin/stats')
  return res.data
}

export async function getSettings() {
  const res = await client.get('/api/admin/settings')
  return res.data
}

export async function updateSettings(data) {
  const res = await client.patch('/api/admin/settings', data)
  return res.data
}

export async function toggleRegistration() {
  const res = await client.post('/api/admin/settings/toggle-registration')
  return res.data
}

export async function resetUserPassword(id, newPassword) {
  const res = await client.post(`/api/users/${id}/reset-password`, { new_password: newPassword })
  return res.data
}
