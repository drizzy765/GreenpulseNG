import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { runScenario } from '../api/ai'
import { useAuth } from '../context/AuthContext'
import { SparklesIcon } from '@heroicons/react/24/outline'
import AuthModal from '../components/AuthModal'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import { isAIError, sanitizeAIResponse, getFriendlyErrorMessage } from '../utils/aiHelpers'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { useDebounce } from '../hooks/useDebounce'

export default function Forecast() {
  const businessId = localStorage.getItem('business_id')

  const [scenario, setScenario] = useState({
    waste_reduction: 0,
    solar_percentage: 0,
    transport_reduction: 0,
    commute_reduction: 0,
    source_category: 'all',
  })

  // Debounce scenario changes to avoid excessive API calls
  const debouncedScenario = useDebounce(scenario, 500)

  // Scenario analysis mutation
  const { data: scenarioData, mutate: runScenarioMutation, isPending: isAnalyzing } = useMutation({
    mutationFn: async (scenarioPayload) => {
      if (!businessId) {
        throw new Error('Business ID is required to run scenarios')
      }

      // Use the centralized API function
      const data = await runScenario({
        business_id: businessId,
        ...scenarioPayload
      }, user?.uid)
      return data
    },
    onError: (error) => {
      console.error("Scenario analysis failed:", error);
      const errorMsg = error.response?.data?.detail
        ? (typeof error.response.data.detail === 'object'
          ? JSON.stringify(error.response.data.detail)
          : error.response.data.detail)
        : 'Failed to analyze scenario';
      toast.error(errorMsg);
    },
  })

  // Auto-run scenario when debounced values change
  useEffect(() => {
    if (businessId && debouncedScenario) {
      runScenarioMutation(debouncedScenario)
    }
  }, [debouncedScenario, businessId, runScenarioMutation])

  const updateScenario = (key, value) => {
    setScenario((prev) => ({ ...prev, [key]: value }))
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!scenarioData) return []

    return [
      {
        name: 'Current',
        emissions: scenarioData.before || 0,
        type: 'baseline',
      },
      {
        name: 'Projected',
        emissions: scenarioData.after || 0,
        type: 'projected',
      },
    ]
  }, [scenarioData])

  const savings = scenarioData ? scenarioData.before - scenarioData.after : 0
  const savingsPercent = scenarioData && scenarioData.before > 0
    ? ((savings / scenarioData.before) * 100).toFixed(1)
    : 0

  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onLoginSuccess={() => { }} />
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Interactive Forecasting</h1>
          <p className="text-slate-600">Adjust scenarios to see projected emission reductions</p>
        </div>
        <Card>
          <div className="card-content text-center py-16">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <SparklesIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Unlock AI Forecasting</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Sign in to use our powerful AI forecasting tools and visualize your future emission scenarios.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="primary" onClick={() => setAuthModalOpen(true)}>
                Sign In / Register
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!businessId) {
    return (
      <Card>
        <div className="card-content text-center py-12">
          <p className="text-slate-600 mb-4">Please set up your business first.</p>
          <Button variant="primary" onClick={() => navigate('/register')}>
            Register Business
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Interactive Forecasting</h1>
        <p className="text-slate-600">
          Adjust scenarios to see projected emission reductions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="card-content">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Scenario Parameters
              </h3>

              <div className="space-y-6">
                {/* Waste Reduction */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">
                      Waste Reduction
                    </label>
                    <span className="text-sm font-semibold text-emerald-600">
                      {scenario.waste_reduction}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scenario.waste_reduction}
                    onChange={(e) => updateScenario('waste_reduction', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Solar Percentage */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">
                      Solar Energy %
                    </label>
                    <span className="text-sm font-semibold text-emerald-600">
                      {scenario.solar_percentage}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scenario.solar_percentage}
                    onChange={(e) => updateScenario('solar_percentage', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Transport Reduction */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">
                      Transport Reduction
                    </label>
                    <span className="text-sm font-semibold text-emerald-600">
                      {scenario.transport_reduction}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scenario.transport_reduction}
                    onChange={(e) => updateScenario('transport_reduction', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Commute Reduction */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">
                      Commute Reduction
                    </label>
                    <span className="text-sm font-semibold text-emerald-600">
                      {scenario.commute_reduction}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scenario.commute_reduction}
                    onChange={(e) => updateScenario('commute_reduction', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>

              {isAnalyzing && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Analyzing scenario...
                </div>
              )}
            </div>
          </Card>

          {/* Results Summary */}
          {scenarioData && (
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="card-content">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Projected Impact
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Current Emissions</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {scenarioData.before?.toFixed(0) || 0} kgCO₂e
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Projected Emissions</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {scenarioData.after?.toFixed(0) || 0} kgCO₂e
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-600">Potential Savings</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {savings.toFixed(0)} kgCO₂e ({savingsPercent}%)
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Chart and AI Explanation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <Card>
            <div className="card-content">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Emission Projection
              </h3>
              {isAnalyzing ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="animate-spin h-8 w-8 mx-auto mb-2 text-emerald-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-sm text-slate-600">Analyzing scenario...</p>
                  </div>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorBefore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAfter" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      formatter={(value) => [`${value.toFixed(0)} kgCO₂e`, 'Emissions']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="emissions"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorBefore)"
                      name="Current Emissions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  Adjust the sliders to see projected emissions
                </div>
              )}
            </div>
          </Card>

          {/* AI Explanation */}
          {scenarioData?.explanation && (
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100">
              <div className="card-content">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  AI Analysis
                </h3>
                <div className="prose prose-sm max-w-none">
                  {isAIError(scenarioData.explanation) ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm flex items-center gap-2">
                      <span className="text-xl">🤖</span>
                      <p>{getFriendlyErrorMessage()}</p>
                    </div>
                  ) : (
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {sanitizeAIResponse(scenarioData.explanation)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
