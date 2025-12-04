import axios from 'axios'

// Use environment variable or default to relative path (proxy will handle it)
const apiBaseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export default api

