import { useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/Dashboard'
import AddEmissionPage from './pages/AddEmission'
import EmissionsPage from './pages/Emissions'
import AiCalculatorPage from './pages/AiCalculator'
import ForecastPage from './pages/Forecast'
import InsightsPage from './pages/Insights'
import LeaderboardPage from './pages/Leaderboard'
import ReportsPage from './pages/Report'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import LandingPage from './pages/LandingPage'

function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <Sidebar />
        {/* Mobile Sidebar */}
        <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 md:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="add-emission" element={<AddEmissionPage />} />
              <Route path="history" element={<EmissionsPage />} />
              <Route path="ai-calculator" element={<AiCalculatorPage />} />
              <Route path="forecast" element={<ForecastPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/app/*" element={<AppLayout />} />
            {/* Catch all redirect to landing page (or 404) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  )
}
