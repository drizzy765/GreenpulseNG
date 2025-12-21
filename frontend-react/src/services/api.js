import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://greenpulsebackend2.onrender.com'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds for AI endpoints
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('user_id')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add user_id to headers if available (for backend compatibility)
    if (userId) {
      config.headers['X-User-ID'] = userId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred'

    // Don't show toast for 404s on dashboard (handled in components)
    if (error.response?.status !== 404) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export { api, API_BASE }