import { createContext, useState, useEffect } from 'react'
import api from '../api/api.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Page reload ke baad cookie khud chalti hai — usi se /me se user la lo
  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Login: backend httpOnly cookie set karta hai, JS ko token milta hi nahi
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const me = await api.get('/auth/me')
    setUser(me.data.data.user)
    return data
  }

  // Logout: backend cookie clear karta hai
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // cookie expire ho chuki ho to bhi user logout kar do
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}