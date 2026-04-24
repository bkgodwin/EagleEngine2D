import React, { useState, useEffect } from 'react'
import Button from '../Common/Button.jsx'
import './Settings.css'

const STORAGE_KEY = 'eagle_settings'

const DEFAULT_SETTINGS = {
  snapToGrid: true,
  autoSaveInterval: 30,
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Editor')
  const [editorSettings, setEditorSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_SETTINGS
    } catch { return DEFAULT_SETTINGS }
  })
  const [saved, setSaved] = useState(false)

  const saveEditorSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(editorSettings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateSetting = (key, value) => {
    setEditorSettings(prev => ({ ...prev, [key]: value }))
  }

  const TABS = ['Account', 'Editor', 'Display']

  return (
    <div className="settings">
      <div className="settings-header">
        <h1 className="settings-title">⚙️ Settings</h1>
      </div>
      <div className="settings-tabs">
        {TABS.map(tab => (
          <div key={tab} className={`settings-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
      </div>

      {activeTab === 'Account' && (
        <div className="settings-section">
          <div className="settings-section-title">Account Settings</div>
          <div style={{ background: '#0f3460', borderRadius: '8px', padding: '16px', border: '1px solid #2a2a4e' }}>
            <p style={{ color: '#8892b0', fontSize: '14px' }}>
              📧 To change your email address, please contact an administrator.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'Editor' && (
        <div>
          <div className="settings-section">
            <div className="settings-section-title">Editor Preferences</div>
            <div className="form-row">
              <label className="form-label">Grid Size</label>
              <input className="form-input" value="32px (fixed)" readOnly style={{ cursor: 'not-allowed', opacity: 0.6, maxWidth: '200px' }} />
            </div>
            <div className="form-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label className="form-label">Snap to Grid</label>
                  <p style={{ color: '#4a5568', fontSize: '12px', marginTop: '2px' }}>Tiles always snap to grid</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={editorSettings.snapToGrid}
                    onChange={e => updateSetting('snapToGrid', e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div
                    onClick={() => updateSetting('snapToGrid', !editorSettings.snapToGrid)}
                    style={{
                      width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                      background: editorSettings.snapToGrid ? '#e94560' : '#2a2a4e', position: 'relative', transition: '0.3s'
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px', left: editorSettings.snapToGrid ? '23px' : '3px',
                      width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: '0.3s'
                    }} />
                  </div>
                </label>
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Auto-Save Interval</label>
              <select
                className="form-input"
                style={{ maxWidth: '200px' }}
                value={editorSettings.autoSaveInterval}
                onChange={e => updateSetting('autoSaveInterval', parseInt(e.target.value))}
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={120}>120 seconds</option>
              </select>
            </div>
            {saved && <div style={{ color: '#4caf50', fontSize: '13px', marginTop: '8px' }}>✓ Settings saved!</div>}
            <Button size="sm" onClick={saveEditorSettings}>Save Editor Settings</Button>
          </div>
        </div>
      )}

      {activeTab === 'Display' && (
        <div className="settings-section">
          <div className="settings-section-title">Display Preferences</div>
          <div style={{ background: '#0f3460', borderRadius: '8px', padding: '16px', border: '1px solid #2a2a4e' }}>
            <p style={{ color: '#8892b0', fontSize: '14px' }}>
              🌙 Eagle Engine 2D currently uses a dark theme only. Additional themes are planned for a future release.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
