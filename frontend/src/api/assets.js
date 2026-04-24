import client from './client.js'

export async function listAssets(params = {}) {
  const res = await client.get('/api/assets/', { params })
  return res.data
}

export async function uploadAsset(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post('/api/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function deleteAsset(id) {
  const res = await client.delete(`/api/assets/${id}`)
  return res.data
}
