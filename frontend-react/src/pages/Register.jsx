import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import toast from 'react-hot-toast'

const businessTypes = [
  'Bakery', 'Restaurant', 'Supermarket', 'Pharmacy', 'FuelStation',
  'SmallShop', 'ISP', 'Hardware Store', 'Consulting', 'Gym',
  'Call Center', 'E-Commerce', 'Solar Installer', 'Real Estate',
  'Insurance Broker', 'Art Gallery', 'Laundromat', 'Software Dev',
  'Law Firm', 'Logistics Hub', 'Advertising Agency',
  'Veterinary Clinic', 'Data Center'
]

export default function Register() {
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const signup = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const businessId = (crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

      localStorage.setItem('business_id', businessId)
      localStorage.setItem('business_name', businessName)
      localStorage.setItem('business_type', businessType)
      localStorage.setItem('token', 'dev-token')

      toast.success('Business registered successfully!')
      navigate('/app/dashboard')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4">
      <Card className="max-w-md w-full">
        <div className="card-content">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-emerald-600 mb-2">
              Register Your Business
            </h1>
            <p className="text-slate-600">
              Get started tracking your carbon emissions
            </p>
          </div>

          <form onSubmit={signup} className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-1">
                Business Name *
              </label>
              <input
                id="businessName"
                type="text"
                className="input"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                required
              />
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-slate-700 mb-1">
                Business Type *
              </label>
              <select
                id="businessType"
                className="input"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                required
              >
                <option value="">Select business type</option>
                {businessTypes.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
              disabled={!businessName || !businessType}
            >
              Create Account
            </Button>

            <p className="text-sm text-center text-slate-500 mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </Card>
    </div>
  )
}