import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me')
      if (response && response.data) {
        setUser(response.data)
      }
    } catch (error) {
      // Only log if it's not a 401 (unauthorized) - those are expected
      if (error?.response?.status !== 401) {
        console.error('Failed to fetch user:', error)
      }
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, role } = response.data
      setToken(access_token)
      localStorage.setItem('token', access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      await fetchUser()
      return { success: true, role }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      const { access_token } = response.data
      setToken(access_token)
      localStorage.setItem('token', access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      await fetchUser()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
        errors: error.response?.data?.errors || [],
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

