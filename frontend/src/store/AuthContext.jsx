import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('eagle_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('eagle_token')
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = useCallback(async (username, password) => {
    const params = new URLSearchParams({ username, password })
    const res = await axios.post('/api/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    const { access_token, user: userData } = res.data
    localStorage.setItem('eagle_token', access_token)
    setToken(access_token)
    setUser(userData)
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('eagle_token')
    setToken(null)
    setUser(null)
  }, [])

  const register = useCallback(async (username, email, password) => {
    const res = await axios.post('/api/auth/register', { username, email, password })
    return res.data
  }, [])

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!(token && user),
    isAdmin: !!(user?.is_admin),
    login,
    logout,
    register
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
