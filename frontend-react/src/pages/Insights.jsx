import { useQuery } from '@tanstack/react-query'
import { dataService } from '../api/dataService'
import { getInsights } from '../api/ai'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SparklesIcon } from '@heroicons/react/24/outline'
import AuthModal from '../components/AuthModal'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { SkeletonCard, SkeletonText } from '../components/ui/Skeleton'
import CountUpModule from 'react-countup'
const CountUp = CountUpModule.default || CountUpModule
import { isAIError, sanitizeAIResponse, getFriendlyErrorMessage } from '../utils/aiHelpers'

export default function Insights() {
  const businessId = localStorage.getItem('business_id')
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const { data: insights, isLoading, error, refetch } = useQuery({
    queryKey: ['insights', businessId, user?.uid],
    queryFn: async () => {
      if (!businessId) throw new Error('No business ID')
      try {
        // AI Insights require backend. If guest, we might need to return null or mock score.
        // For now, let's attempt to call it. Backend handles "DevUser" so it might work if we send dummy token?
        // But prompt says "GreenPulse AI features should require login".
        // So for Guest, we should probably return a specialized "Guest" object with calculated score from local data?
        // "Task 3: GreenPulse AI features should require login."
        // "Behavior: If user clicks AI feature while logged out: Show a friendly modal"
        // Insight page IS an AI feature? Or just the text?
        // The green score is key.
        // Let's leave it as is, but handle 401/403 if we add that later.
        // For now, let's just stick to existing implementation but acknowledge we might need to gate the TEXT part.
        const data = await getInsights(encodeURIComponent(businessId), user?.uid)
        return data
      } catch (error) {
        if (error.response?.status === 404) return null
        throw error
      }
    },
    enabled: !!businessId,
    retry: false,
  })

  const badgeFromScore = (s) => s <= 40 ? 'Eco Starter' : s <= 70 ? 'Green Leader' : 'Eco Champion'
  const scoreColor = (s) => s <= 40 ? '#ef4444' : s <= 70 ? '#f59e0b' : '#10b981'
  const greenScore = insights?.green_score || 0
  const sectorAvg = insights?.sector_average || 0
  const diff = greenScore - sectorAvg



  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onLoginSuccess={() => { }} />
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Insights & Analysis</h1>
          <p className="text-slate-600">AI-powered sustainability recommendations</p>
        </div>
        <Card>
          <div className="card-content text-center py-16">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <SparklesIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Unlock AI Insights</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Sign in to get detailed AI analysis, green scores, and personalized sustainability recommendations.
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

  if (error?.response?.status === 404) {
    return (
      <Card>
        <div className="card-content text-center py-12">
          <p className="text-slate-600 mb-4">No insights available. Add data to get AI analysis.</p>
          <Button variant="primary" onClick={() => navigate('/app/add-emission')}>
            Add Data
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Insights & Analysis</h1>
          <p className="text-slate-600">AI-powered sustainability recommendations</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()} loading={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Green Score Card */}
        {isLoading ? (
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
                  style={{ color: scoreColor(greenScore) }}
                />
                <span className="text-lg text-slate-600">/ 100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${greenScore}%`,
                    backgroundColor: scoreColor(greenScore),
                  }}
                />
              </div>
              <p className="text-sm font-medium mb-2" style={{ color: scoreColor(greenScore) }}>
                {badgeFromScore(greenScore)}
              </p>
              <p className="text-xs text-slate-600">
                {diff >= 0
                  ? `${diff.toFixed(0)}% greener than sector average`
                  : `${Math.abs(diff).toFixed(0)}% below sector average`}
              </p>
            </div>
          </Card>
        )}

        {/* Sector Comparison */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <Card>
            <div className="card-content">
              <p className="text-sm font-medium text-slate-600 mb-2">Sector Average</p>
              <div className="flex items-baseline gap-2">
                <CountUp
                  end={sectorAvg}
                  duration={2}
                  decimals={0}
                  className="text-4xl font-bold text-slate-700"
                />
                <span className="text-lg text-slate-600">/ 100</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Industry benchmark</p>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="card-content">
              <p className="text-sm font-medium text-slate-600 mb-2">Performance</p>
              <p className="text-2xl font-bold text-emerald-700">
                {diff >= 0 ? 'Above' : 'Below'} Average
              </p>
              <p className="text-xs text-slate-600 mt-2">
                {Math.abs(diff).toFixed(1)}% difference from sector
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* AI Analysis */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100">
        <div className="card-content">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            AI Analysis & Recommendations
          </h3>

          {/* ... (inside component) */}

          {isLoading ? (
            <SkeletonText lines={8} />
          ) : insights?.ai_analysis ? (
            <div className="prose prose-sm max-w-none">
              {isAIError(insights.ai_analysis) ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="font-medium">AI Service Notice</p>
                    <p className="text-sm mt-1">{getFriendlyErrorMessage()}</p>
                  </div>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0 text-slate-700">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-3 space-y-1 text-slate-700">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-3 space-y-1 text-slate-700">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-slate-700">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-slate-900">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {sanitizeAIResponse(insights.ai_analysis)}
                </ReactMarkdown>
              )}
            </div>
          ) : (
            <p className="text-slate-600">
              No AI analysis available. Add more data to get personalized recommendations.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
