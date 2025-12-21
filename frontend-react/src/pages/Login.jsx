import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const login = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Auth Mock: Simple login that saves user ID to localStorage
      // In production, this would call the backend auth endpoint
      const userId = username || `user_${Date.now()}`

      localStorage.setItem('user_id', userId)
      localStorage.setItem('token', 'dev-token') // Mock token for backend OAuth2
      localStorage.setItem('username', username || 'Guest User')

      toast.success('Login successful!')
      navigate('/app/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4">
      <div className="card max-w-md w-full">
        <div className="card-content">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-emerald-600 mb-2">
              GreenPulse<span className="text-emerald-800">NG</span>
            </h1>
            <p className="text-slate-600">Sign in to track your carbon emissions</p>
          </div>

          <form onSubmit={login} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
            >
              Sign In
            </Button>

            <p className="text-sm text-center text-slate-500 mt-4">
              Demo mode: Any credentials will work
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}