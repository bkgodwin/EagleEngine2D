import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext.jsx'
import './Layout.css'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '🏠', exact: true },
  { to: '/editor', label: 'Editor', icon: '🎮' },
  { to: '/browser', label: 'Browse Games', icon: '🕹️' },
  { to: '/profile', label: 'My Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
  { to: '/docs', label: 'Docs', icon: '📚' }
]

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('eagle_sidebar_collapsed') === 'true')

  useEffect(() => {
    localStorage.setItem('eagle_sidebar_collapsed', collapsed)
  }, [collapsed])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">🦅</span>
          {!collapsed && <span className="logo-text">Eagle Engine 2D</span>}
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={collapsed ? 'Admin' : undefined}
            >
              <span className="nav-icon">🔧</span>
              {!collapsed && <span className="nav-label">Admin</span>}
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="user-info">
              <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || '?'}</div>
              <div className="user-details">
                <div className="user-name">{user?.username}</div>
                {isAdmin && <div className="user-role">Admin</div>}
              </div>
            </div>
          )}
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            {collapsed ? '🚪' : '🚪 Logout'}
          </button>
        </div>
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </aside>
      <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        {children}
      </main>
    </div>
  )
}
