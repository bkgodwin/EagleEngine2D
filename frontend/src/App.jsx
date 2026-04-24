import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/AuthContext.jsx'
import { EditorProvider } from './store/EditorContext.jsx'
import Layout from './components/Layout/Layout.jsx'
import Login from './components/Auth/Login.jsx'
import Register from './components/Auth/Register.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import Editor from './components/Editor/Editor.jsx'
import GameBrowser from './components/GameBrowser/GameBrowser.jsx'
import GamePlayer from './components/GamePlayer/GamePlayer.jsx'
import Profile from './components/Profile/Profile.jsx'
import Admin from './components/Admin/Admin.jsx'
import Settings from './components/Settings/Settings.jsx'
import Docs from './components/Docs/Docs.jsx'

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f3460', color: '#fff' }}>Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EditorProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/browser" element={<GameBrowser />} />
            <Route path="/play/:gameId" element={<GamePlayer />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/editor" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
            <Route path="/editor/:projectId" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><Admin /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </EditorProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
