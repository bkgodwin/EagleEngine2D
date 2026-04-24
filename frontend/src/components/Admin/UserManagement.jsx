import React, { useState, useEffect } from 'react'
import { listUsers, updateUser, resetUserPassword } from '../../api/admin.js'
import Button from '../Common/Button.jsx'
import Modal from '../Common/Modal.jsx'
import LoadingSpinner from '../Common/LoadingSpinner.jsx'
import { formatDate, formatBytes } from '../../utils/helpers.js'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [resetModal, setResetModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

  useEffect(() => {
    listUsers()
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleToggleActive = async (user) => {
    try {
      const updated = await updateUser(user.id, { is_active: !user.is_active })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: updated.is_active } : u))
    } catch (err) {
      alert('Failed to update user')
    }
  }

  const handleToggleAdmin = async (user) => {
    if (!window.confirm(`${user.is_admin ? 'Remove' : 'Grant'} admin for ${user.username}?`)) return
    try {
      const updated = await updateUser(user.id, { is_admin: !user.is_admin })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: updated.is_admin } : u))
    } catch (err) {
      alert('Failed to update user')
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setResetError('Min 6 characters'); return }
    setResetLoading(true)
    setResetError('')
    try {
      await resetUserPassword(resetModal.id, newPassword)
      setResetModal(null)
      setNewPassword('')
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <input
        style={{ width: '100%', maxWidth: '300px', background: '#0f3460', border: '1px solid #2a2a4e', color: '#fff', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', fontFamily: 'inherit' }}
        placeholder="Search users..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th><th>Email</th><th>Active</th><th>Admin</th>
              <th>Storage</th><th>Joined</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ color: '#fff' }}>{u.username}</td>
                <td style={{ color: '#8892b0' }}>{u.email}</td>
                <td><span style={{ color: u.is_active ? '#4caf50' : '#e94560' }}>{u.is_active ? '✓' : '✗'}</span></td>
                <td><span style={{ color: u.is_admin ? '#e94560' : '#8892b0' }}>{u.is_admin ? '⭐' : '—'}</span></td>
                <td style={{ color: '#8892b0', fontSize: '12px' }}>{formatBytes(u.storage_used || 0)}</td>
                <td style={{ color: '#8892b0', fontSize: '12px' }}>{formatDate(u.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <Button size="sm" variant={u.is_active ? 'danger' : 'secondary'} onClick={() => handleToggleActive(u)}>
                      {u.is_active ? 'Ban' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleToggleAdmin(u)}>
                      {u.is_admin ? 'Demote' : 'Promote'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setResetModal(u); setNewPassword(''); setResetError('') }}>
                      🔑 Pwd
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!resetModal}
        onClose={() => setResetModal(null)}
        title={`Reset Password — ${resetModal?.username}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetModal(null)}>Cancel</Button>
            <Button loading={resetLoading} onClick={handleResetPassword}>Reset</Button>
          </>
        }
      >
        {resetError && <div style={{ color: '#e94560', marginBottom: '12px', fontSize: '14px' }}>{resetError}</div>}
        <label style={{ color: '#8892b0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          style={{ width: '100%', background: '#0f3460', border: '1px solid #2a2a4e', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontFamily: 'inherit' }}
          placeholder="Min 6 characters"
          autoFocus
        />
      </Modal>
    </div>
  )
}
