import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://greenpulsebackend2.onrender.com'

const client = axios.create({
    baseURL: API_BASE,
    timeout: 60000, // Increased timeout for AI operations
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        // const userId = localStorage.getItem('user_id') // Deprecated: Backend uses token for user context now (or dev user)

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
client.interceptors.response.use(
    (response) => {
        // Check for logical errors in successful HTTP responses (e.g. AI errors)
        if (response.data && response.data.success === false) {
            const message = response.data.message || 'Operation failed'
            toast.error(message)
            return Promise.reject(new Error(message))
        }

        // Return the data directly for cleaner usage in components
        return response.data
    },
    (error) => {
        const message = error.response?.data?.detail || error.message || 'An error occurred'

        // Don't show toast for 404s on dashboard/insights (handled in components)
        if (error.response?.status !== 404) {
            toast.error(message)
        }

        return Promise.reject(error)
    }
)

export default client
