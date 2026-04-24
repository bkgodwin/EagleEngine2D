import React, { useState } from 'react'
import { useAuth } from '../../store/AuthContext.jsx'
import { Navigate } from 'react-router-dom'
import UserManagement from './UserManagement.jsx'
import ContentModeration from './ContentModeration.jsx'
import SystemSettings from './SystemSettings.jsx'
import './Admin.css'

const TABS = ['Overview', 'Users', 'Games', 'Settings']

export default function Admin() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('Overview')

  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="admin">
      <div className="admin-header">
        <h1 className="admin-title">🔧 Admin Panel</h1>
        <p style={{ color: '#8892b0', marginTop: '8px' }}>Manage users, content, and system settings</p>
      </div>
      <div className="admin-tabs">
        {TABS.map(tab => (
          <div key={tab} className={`admin-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
      </div>
      <div>
        {activeTab === 'Overview' && <SystemSettings overviewOnly />}
        {activeTab === 'Users' && <UserManagement />}
        {activeTab === 'Games' && <ContentModeration />}
        {activeTab === 'Settings' && <SystemSettings />}
      </div>
    </div>
  )
}
