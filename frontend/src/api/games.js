import client from './client.js'

export async function listPublicGames(params = {}) {
  const res = await client.get('/api/games/public', { params })
  return res.data
}

export async function getPublicGame(id) {
  const res = await client.get(`/api/games/public/${id}`)
  return res.data
}

export async function publishGame(data) {
  const res = await client.post('/api/games/publish', data)
  return res.data
}

export async function getMyGames() {
  const res = await client.get('/api/games/my')
  return res.data
}

export async function updateGame(id, data) {
  const res = await client.patch(`/api/games/${id}`, data)
  return res.data
}

export async function deleteGame(id) {
  const res = await client.delete(`/api/games/${id}`)
  return res.data
}
