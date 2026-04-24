import React, { useState, useEffect } from 'react'
import { getSettings, updateSettings, toggleRegistration, getStats } from '../../api/admin.js'
import { formatBytes } from '../../utils/helpers.js'
import Button from '../Common/Button.jsx'
import LoadingSpinner from '../Common/LoadingSpinner.jsx'

export default function SystemSettings({ overviewOnly = false }) {
  const [stats, setStats] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    Promise.allSettled([getStats(), getSettings()])
      .then(([s, cfg]) => {
        if (s.status === 'fulfilled') setStats(s.value)
        if (cfg.status === 'fulfilled') setSettings(cfg.value)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      await updateSettings({ registration_enabled: settings.registration_enabled, max_upload_size_bytes: settings.max_upload_size_bytes })
      setSaveMsg('Settings saved!')
    } catch (err) {
      setSaveMsg('Error: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleReg = async () => {
    try {
      const res = await toggleRegistration()
      setSettings(prev => ({ ...prev, registration_enabled: res.registration_enabled }))
    } catch (err) {
      alert('Failed to toggle registration')
    }
  }

  if (loading) return <LoadingSpinner />

  const STAT_ITEMS = [
    { label: 'Total Users', value: stats?.total_users ?? '—' },
    { label: 'Total Projects', value: stats?.total_projects ?? '—' },
    { label: 'Total Games', value: stats?.total_games ?? '—' },
    { label: 'Total Storage', value: stats?.total_storage_used ? formatBytes(stats.total_storage_used) : '—' }
  ]

  return (
    <div>
      <div className="stats-grid">
        {STAT_ITEMS.map(item => (
          <div key={item.label} className="stat-card">
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      {!overviewOnly && settings && (
        <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '24px', border: '1px solid #2a2a4e' }}>
          <h3 style={{ color: '#e94560', marginBottom: '20px' }}>System Configuration</h3>
          {saveMsg && <div style={{ color: saveMsg.startsWith('Error') ? '#e94560' : '#4caf50', marginBottom: '12px', fontSize: '14px' }}>{saveMsg}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#fff', fontSize: '14px' }}>Registration Enabled</div>
                <div style={{ color: '#8892b0', fontSize: '12px' }}>Allow new users to register</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    className="toggle-input"
                    checked={settings.registration_enabled || false}
                    onChange={e => setSettings(prev => ({ ...prev, registration_enabled: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
                <Button size="sm" variant="ghost" onClick={handleToggleReg}>Toggle</Button>
              </div>
            </div>
            <div>
              <label style={{ color: '#8892b0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Max Upload Size (bytes)</label>
              <input
                type="number"
                value={settings.max_upload_size_bytes || 10485760}
                onChange={e => setSettings(prev => ({ ...prev, max_upload_size_bytes: parseInt(e.target.value) }))}
                style={{ width: '100%', background: '#0f3460', border: '1px solid #2a2a4e', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontFamily: 'inherit' }}
              />
              <div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>
                {formatBytes(settings.max_upload_size_bytes || 10485760)}
              </div>
            </div>
            <Button loading={saving} onClick={handleSave}>Save Settings</Button>
          </div>
        </div>
      )}
    </div>
  )
}
