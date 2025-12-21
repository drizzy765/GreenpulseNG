import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { dataService } from '../api/dataService'
import { useAuth } from '../context/AuthContext'
import { getInsights, generateReport } from '../api/ai'
import CountUpModule from 'react-countup'
const CountUp = CountUpModule.default || CountUpModule
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import Card from '../components/ui/Card'
import { SkeletonCard, SkeletonText } from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { isAIError, sanitizeAIResponse, getFriendlyErrorMessage } from '../utils/aiHelpers'

const COLORS = ['#23825b', '#34a374', '#5abf8e', '#d0ad56', '#b6923b', '#9a762f']

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const businessId = localStorage.getItem('business_id')
  const businessName = localStorage.getItem('business_name') || 'Your Business'

  // Fetch dashboard data
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['dashboard', businessId, user?.uid], // Depend on user ID to refetch on login
    queryFn: async () => {
      // Guest Mode or User Mode handled by dataService
      // For guest, businessId might be null, but dataService.getDashboardData handles it via localStore
      return dataService.getDashboardData(businessId || 'guest', user?.uid)
    },
    retry: false,
  })

  // Fetch insights data
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', businessId, user?.uid],
    queryFn: async () => {
      // Insights might be gated or unavailable for guest
      if (!businessId) return null
      try {
        // Insights currently only supported for authenticated users (per prompt requirements?)
        // "Guest users cannot: Use GreenPulse AI"
        if (!user) return null;

        const data = await getInsights(encodeURIComponent(businessId), user.uid)
        return data
      } catch (error) {
        if (error.response?.status === 404) return null
        throw error
      }
    },
    enabled: !!businessId, // Only fetch if we have a business ID
    retry: false,
  })

  // Handle 404 or Empty Data (Guest or New User)
  if (dashboardError?.response?.status === 404 || (!dashboardLoading && !dashboard)) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="card-content text-center py-12">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              No data found
            </h2>
            <p className="text-slate-600 mb-6">
              Start by adding your first emission entry to see your dashboard.
            </p>
            <Button variant="primary" onClick={() => navigate('/app/add-emission')}>
              Add First Entry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Prepare chart data
  const categoryData = dashboard?.by_category?.map((cat) => ({
    name: cat.source_category || 'Unknown',
    value: Math.round(cat.emissions_kgCO2e || 0),
  })) || []

  const totalEmissions = dashboard?.total_emissions || 0
  const greenScore = insights?.green_score || 0
  const scoreColor = greenScore <= 40 ? '#ef4444' : greenScore <= 70 ? '#d0ad56' : '#23825b'
  const badge = greenScore <= 40 ? 'Eco Starter' : greenScore <= 70 ? 'Green Leader' : 'Eco Champion'

  // Download report handler
  const handleDownloadReport = async () => {
    if (!businessId) return
    try {
      // client.js returns response.data directly, but for blob response it might be different?
      // Wait, client.js interceptor returns response.data.
      // If responseType is blob, response.data is the blob.
      // So this should be fine.
      const blob = await generateReport(businessId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `greenpulse_report_${businessId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to download report')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome, {businessName}
        </h1>
        <p className="text-slate-600">Your carbon emissions overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Emissions Card */}
        {dashboardLoading ? (
          <SkeletonCard />
        ) : (
          <Card className="bg-gradient-brand text-white">
            <div className="card-content">
              <p className="text-sm font-medium text-primary-100 mb-2">Total Emissions</p>
              <div className="flex items-baseline gap-2">
                <CountUp
                  end={totalEmissions}
                  duration={2}
                  decimals={0}
                  className="text-4xl font-bold text-white tracking-tight"
                />
                <span className="text-lg text-primary-200">kgCO₂e</span>
              </div>
              <p className="text-xs text-primary-200 mt-2">Lifetime total</p>
            </div>
          </Card>
        )}

        {/* Green Score Card */}
        {insightsLoading ? (
          <SkeletonCard />
        ) : (
          <Card>
            <div className="card-content">
              <p className="text-sm font-medium text-slate-600 mb-2">Green Score</p>
              <div className="flex items-baseline gap-2 mb-3">
                <CountUp
                  end={greenScore}
                  duration={2}
                  decimals={0}
                  className="text-4xl font-bold"
                  style={{ color: scoreColor }}
                />
                <span className="text-lg text-slate-600">/ 100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${greenScore}%`,
                    backgroundColor: scoreColor,
                  }}
                />
              </div>
              <p className="text-sm font-medium" style={{ color: scoreColor }}>
                {badge}
              </p>
            </div>
          </Card>
        )}

        {/* Actions Card */}
        <Card>
          <div className="card-content">
            <p className="text-sm font-medium text-slate-600 mb-4">Quick Actions</p>
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleDownloadReport}
              >
                Download Report
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/app/add-emission')}
              >
                Add Entry
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emissions by Category - Donut Chart */}
        <Card>
          <div className="card-content">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Emissions by Category
            </h3>
            {dashboardLoading ? (
              <div className="h-64 flex items-center justify-center">
                <SkeletonText lines={3} />
              </div>
            ) : categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No category data available
              </div>
            )}
          </div>
        </Card>

        {/* AI Insights Card */}
        <Card className="bg-slate-900 text-white">
          <div className="card-content">
            <h3 className="text-lg font-semibold text-white mb-4">
              AI Analysis
            </h3>

            {insightsLoading ? (
              <SkeletonText lines={5} />
            ) : insights?.ai_analysis ? (
              <div className="prose prose-sm max-w-none">
                {isAIError(insights.ai_analysis) ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <p>{getFriendlyErrorMessage()}</p>
                  </div>
                ) : (
                  <p className="text-slate-300 whitespace-pre-wrap">
                    {sanitizeAIResponse(insights.ai_analysis)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-400">
                No AI insights available. Add more data to get personalized recommendations.
              </p>
            )}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/app/ai-calculator')}
              >
                Get More Insights
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
