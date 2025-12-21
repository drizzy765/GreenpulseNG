import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getInsights, chatWithAI } from '../api/ai'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import ReactMarkdown from 'react-markdown'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { SkeletonText } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { SparklesIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { isAIError, sanitizeAIResponse, getFriendlyErrorMessage } from '../utils/aiHelpers'

export default function AiCalculator() {
  const navigate = useNavigate()
  const businessId = localStorage.getItem('business_id')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  console.log('DEBUG: AiCalculator render, businessId:', businessId)

  // Fetch existing insights
  useEffect(() => {
    let isMounted = true

    const fetchInsights = async () => {
      if (!businessId) return

      console.log('DEBUG: Fetching insights for businessId:', businessId)
      setInsightsLoading(true)
      try {
        const data = await getInsights(encodeURIComponent(businessId), user?.uid)
        if (!isMounted) return

        console.log('DEBUG: Insights fetched:', JSON.stringify(data, null, 2))
        setInsights(data)

        if (data && data.ai_analysis) {
          // Only set messages if empty to avoid loop
          setMessages(prev => {
            if (prev.length > 0) return prev
            return [{
              role: 'assistant',
              content: String(data.ai_analysis),
              timestamp: new Date(),
            }]
          })
        }

      } catch (error) {
        if (!isMounted) return
        console.error('DEBUG: Insights fetch error:', error)
      } finally {
        if (isMounted) setInsightsLoading(false)
      }
    }

    fetchInsights()

    return () => {
      isMounted = false
    }
  }, [businessId]) // Stable dependency

  // AI Analysis mutation
  const { mutate: askAI, isPending: isThinking } = useMutation({
    mutationFn: async (prompt) => {
      const data = await chatWithAI(prompt)
      return data
    },
    onSuccess: (data) => {
      let response = 'Analysis complete'
      if (data && typeof data.response === 'string') {
        response = data.response
      } else if (data && data.response) {
        response = String(data.response)
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        },
      ])
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get AI response'
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
        },
      ])
      toast.error(errorMessage)
    },
  })

  // Placeholder for handleSend to match original structure
  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || isThinking) return

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    askAI(input)
  }

  const suggestedQuestions = [
    'How can I reduce my electricity emissions?',
    'What are the best practices for waste reduction in Nigeria?',
    'Compare my emissions to industry averages',
    'What are cost-effective ways to go green?',
  ]

  const { isAuthenticated, user } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  if (!isAuthenticated) {
    return (
      <>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onLoginSuccess={() => { }} />
        <Card>
          <div className="card-content text-center py-16">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <SparklesIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Unlock GreenPulse AI</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Sign in to access personalized AI insights, smart recommendations, and save your emissions data permanently.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="primary" onClick={() => setAuthModalOpen(true)}>
                Sign In / Register
              </Button>
              <Button variant="secondary" onClick={() => navigate('/app/dashboard')}>
                Continue as Guest
              </Button>
            </div>
          </div>
        </Card>
      </>
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <SparklesIcon className="w-8 h-8 text-accent-500" />
          GreenPulse AI Suite
        </h1>
        <p className="text-slate-600">
          Get personalized sustainability recommendations powered by AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col border-slate-200">
            <div className="card-content flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="border-b border-slate-200 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Chat with GreenPulse AI
                </h3>
                <p className="text-sm text-slate-600">
                  Ask questions about your emissions and get actionable advice
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.length === 0 && !insightsLoading && (
                  <div className="text-center py-8">
                    <SparklesIcon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">
                      Start a conversation to get AI-powered insights
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInput(q)
                            handleSend({ preventDefault: () => { } })
                          }}
                          className="text-left p-3 text-sm bg-white rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-slate-600"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {insightsLoading && messages.length === 0 && (
                  <div className="space-y-4">
                    <SkeletonText lines={4} />
                    <SkeletonText lines={3} />
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl p-4 ${msg.role === 'user'
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                        }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          {isAIError(msg.content) ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm flex items-center gap-2">
                              <span className="text-xl">🤖</span>
                              <div>
                                <p className="font-medium">AI Service Notice</p>
                                <p className="mt-1">{getFriendlyErrorMessage()}</p>
                              </div>
                            </div>
                          ) : (
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0 text-slate-700">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside mb-2 space-y-1 text-slate-700">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-inside mb-2 space-y-1 text-slate-700">
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
                              {sanitizeAIResponse(msg.content)}
                            </ReactMarkdown>
                          )}
                        </div>
                      ) : (
                        <p className="text-white">{msg.content}</p>
                      )}
                      <p
                        className={`text-xs mt-2 ${msg.role === 'user' ? 'text-primary-100' : 'text-slate-400'
                          }`}
                      >
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-600">
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
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} className="border-t border-slate-200 pt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your emissions..."
                    className="flex-1 input"
                    disabled={isThinking}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!input.trim() || isThinking}
                    loading={isThinking}
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        {/* Quick Insights Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="card-content">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Quick Insights
              </h3>
              {insightsLoading ? (
                <SkeletonText lines={5} />
              ) : insights?.ai_analysis ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0 text-slate-700 text-sm">
                          {children}
                        </p>
                      ),
                    }}
                  >
                    {`${String(insights.ai_analysis).substring(0, 200)}...`}
                  </ReactMarkdown>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => navigate('/insights')}
                  >
                    View Full Analysis
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  No insights available. Add data to get AI recommendations.
                </p>
              )}
            </div>
          </Card>

          <Card className="bg-slate-50">
            <div className="card-content">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">
                Tips
              </h4>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Ask specific questions for better answers</li>
                <li>Request comparisons with industry averages</li>
                <li>Get cost-benefit analysis for interventions</li>
                <li>Ask for Nigerian-specific recommendations</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}