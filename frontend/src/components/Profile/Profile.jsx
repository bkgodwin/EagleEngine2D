import React, { useState, useEffect } from 'react'
import { useAuth } from '../../store/AuthContext.jsx'
import { getMyGames } from '../../api/games.js'
import { listProjects } from '../../api/projects.js'
import { resetUserPassword } from '../../api/admin.js'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatBytes } from '../../utils/helpers.js'
import Button from '../Common/Button.jsx'
import LoadingSpinner from '../Common/LoadingSpinner.jsx'
import './Profile.css'

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    Promise.allSettled([getMyGames(), listProjects()])
      .then(([g, p]) => {
        if (g.status === 'fulfilled') setGames(g.value || [])
        if (p.status === 'fulfilled') setProjects(p.value || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    if (newPassword !== confirmPw) { setPwError('Passwords do not match'); return }
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return }
    setPwLoading(true)
    try {
      await resetUserPassword(user.id, newPassword)
      setPwSuccess('Password changed successfully')
      setNewPassword('')
      setConfirmPw('')
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  if (loading) return <div className="profile"><LoadingSpinner /></div>

  const storageUsed = user?.storage_used || 0
  const storageQuota = user?.storage_quota || 1073741824
  const storagePct = Math.min((storageUsed / storageQuota) * 100, 100)

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-info">
          <div className="avatar">{user?.username?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <div className="profile-name">{user?.username}</div>
            <div className="profile-email">{user?.email}</div>
            <div style={{ color: '#8892b0', fontSize: '13px', marginTop: '4px' }}>
              Member since {formatDate(user?.created_at)}
              {user?.is_admin && <span style={{ marginLeft: '8px', background: '#e94560', color: '#fff', padding: '1px 8px', borderRadius: '12px', fontSize: '11px' }}>Admin</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-title">Storage</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8892b0', fontSize: '13px', marginBottom: '8px' }}>
          <span>{formatBytes(storageUsed)} used</span>
          <span>{formatBytes(storageQuota)} quota</span>
        </div>
        <div className="storage-bar">
          <div className="storage-fill" style={{ width: `${storagePct}%` }} />
        </div>
      </div>

      <div className="profile-section">
        <div className="section-title">My Published Games ({games.length})</div>
        {games.length === 0 ? (
          <p style={{ color: '#8892b0' }}>No published games yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {games.map(game => (
              <div key={game.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#0f3460', borderRadius: '8px' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 500 }}>{game.title}</div>
                  <div style={{ color: '#8892b0', fontSize: '12px' }}>▶ {game.play_count || 0} plays · {formatDate(game.created_at)}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/play/${game.id}`)}>Play</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-section">
        <div className="section-title">My Projects ({projects.length})</div>
        {projects.length === 0 ? (
          <p style={{ color: '#8892b0' }}>No projects yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {projects.map(project => (
              <div key={project.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#0f3460', borderRadius: '8px' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 500 }}>{project.name}</div>
                  <div style={{ color: '#8892b0', fontSize: '12px' }}>Created {formatDate(project.created_at)}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/editor/${project.id}`)}>Edit</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-section">
        <div className="section-title">Change Password</div>
        {pwError && <div style={{ color: '#e94560', marginBottom: '12px', fontSize: '14px' }}>{pwError}</div>}
        {pwSuccess && <div style={{ color: '#4caf50', marginBottom: '12px', fontSize: '14px' }}>{pwSuccess}</div>}
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
          <div>
            <label style={{ color: '#8892b0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{ width: '100%', background: '#0f3460', border: '1px solid #2a2a4e', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontFamily: 'inherit' }}
              placeholder="New password"
            />
          </div>
          <div>
            <label style={{ color: '#8892b0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              style={{ width: '100%', background: '#0f3460', border: '1px solid #2a2a4e', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontFamily: 'inherit' }}
              placeholder="Confirm new password"
            />
          </div>
          <Button type="submit" loading={pwLoading} size="sm">Update Password</Button>
        </form>
      </div>
    </div>
  )
}
