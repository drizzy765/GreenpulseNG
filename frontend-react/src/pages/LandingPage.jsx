import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRightIcon, ChartBarIcon, SparklesIcon, TruckIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200/50 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1">
        <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4 text-primary-600">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
)

const TargetAudienceItem = ({ text }) => (
    <li className="flex items-center gap-3 text-slate-700">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
        </div>
        <span className="text-lg">{text}</span>
    </li>
)

export default function LandingPage() {
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const [isLoginMode, setIsLoginMode] = useState(true)
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    const openLogin = () => {
        if (isAuthenticated) {
            navigate('/app/dashboard')
        } else {
            setIsLoginMode(true)
            setAuthModalOpen(true)
        }
    }

    const openRegister = () => {
        if (isAuthenticated) {
            navigate('/app/dashboard')
        } else {
            setIsLoginMode(false)
            setAuthModalOpen(true)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                onLoginSuccess={() => navigate('/app/dashboard')}
                defaultIsLogin={isLoginMode}
            />

            {/* Navbar */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                            GreenPulse<span className="text-primary-700">NG</span>
                        </span>
                    </div>
                    <div>
                        <button
                            onClick={openLogin}
                            className="px-5 py-2.5 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                        >
                            {isAuthenticated ? 'Dashboard' : 'Log In'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 font-medium text-sm mb-8 animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                    </span>
                    Built for Nigeria 🇳🇬
                </div>

                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                    Understand Your Business <br className="hidden md:block" />
                    <span className="bg-gradient-brand bg-clip-text text-transparent">
                        Emissions — Simply
                    </span>
                </h1>

                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Track fuel, electricity, transport, and waste emissions using Nigerian-specific data.
                    The smartest way to manage your carbon footprint.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={openRegister}
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary-600 text-white font-semibold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 hover:scale-105 flex items-center justify-center gap-2"
                    >
                        Get Started
                        <ArrowRightIcon className="w-5 h-5" />
                    </button>
                    <a
                        href="#features"
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-700 font-semibold text-lg border border-slate-200 hover:bg-slate-50 transition-all hover:border-slate-300"
                    >
                        Learn More
                    </a>
                </div>
            </section>

            {/* Product Preview */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
                <div className="relative rounded-2xl bg-slate-900/5 p-4 md:p-12 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />

                    {/* Dashboard Preview Placeholder */}
                    <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-200 bg-white aspect-[16/9] flex items-center justify-center group">
                        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center text-slate-400">
                            {/* In a real app we'd put an <img> here */}
                            <div className="text-center p-8">
                                <ChartBarIcon className="w-24 h-24 mx-auto mb-4 text-emerald-200" />
                                <p className="text-2xl font-medium text-slate-400">Interactive Dashboard View</p>
                            </div>
                        </div>

                        {/* Floating Elements for "Wow" factor */}
                        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-700" />
                        <div className="absolute -top-10 -left-10 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl group-hover:bg-teal-500/30 transition-all duration-700" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Powerful tools designed specifically for the Nigerian business landscape.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={TruckIcon}
                            title="Smart Emission Entry"
                            description="Easily log diesel usage, generator hours, transportation, and waste using local units and factors."
                        />
                        <FeatureCard
                            icon={SparklesIcon}
                            title="AI-Powered Insights"
                            description="Get intelligent recommendations to reduce your footprint and save costs, powered by advanced AI."
                        />
                        <FeatureCard
                            icon={ChartBarIcon}
                            title="Real-time Reporting"
                            description="Generate comprehensive reports for stakeholders, tracked against local sustainability standards."
                        />
                    </div>
                </div>
            </section>

            {/* Who It's For */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">
                                Designed for Modern <br />
                                <span className="text-emerald-600">Nigerian Businesses</span>
                            </h2>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                Whether you're running a small startup or managing ESG for a large corporation,
                                GreenPulseNG scales to meet your sustainability tracking needs.
                            </p>
                            <ul className="space-y-4">
                                <TargetAudienceItem text="Small & Medium Enterprises (SMEs)" />
                                <TargetAudienceItem text="Sustainability Consultants" />
                                <TargetAudienceItem text="NGOs & Green Initiatives" />
                                <TargetAudienceItem text="ESG Compliance Teams" />
                            </ul>
                        </div>

                        {/* Visual for Audience */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-teal-100 rounded-2xl transform rotate-3" />
                            <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                                <UserGroupIcon className="w-16 h-16 text-emerald-500 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Join the Movement</h3>
                                <p className="text-slate-600 mb-8">
                                    Join hundreds of businesses tracking their impact and building a greener future for Nigeria.
                                </p>
                                <div className="flex -space-x-4">
                                    {/* Avatar placeholders */}
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white ring-2 ring-slate-50 flex items-center justify-center text-xs font-medium text-slate-500">
                                            U{i}
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white ring-2 ring-slate-50 flex items-center justify-center text-xs font-bold text-emerald-600">
                                        +100
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 py-12 text-slate-400">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-white mb-2">
                            GreenPulse<span className="text-emerald-500">NG</span>
                        </h3>
                        <p className="text-sm">Empowering Nigerian businesses to go green.</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            Built for Nigeria <span className="text-lg">🇳🇬</span>
                        </span>
                        <div className="flex gap-4 border-l border-slate-700 pl-6">
                            <a
                                href="https://x.com/GreenpulseNG"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium"
                            >
                                Twitter
                            </a>
                            <a
                                href="https://www.linkedin.com/company/greenpulseng/?viewAsMember=true"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium"
                            >
                                LinkedIn
                            </a>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={openLogin} className="hover:text-white transition-colors">Login</button>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
