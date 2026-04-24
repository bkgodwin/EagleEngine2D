import client from './client.js'

export async function login(username, password) {
  const params = new URLSearchParams({ username, password })
  const res = await client.post('/api/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  return res.data
}

export async function register(data) {
  const res = await client.post('/api/auth/register', data)
  return res.data
}

export async function getMe() {
  const res = await client.get('/api/auth/me')
  return res.data
}
