import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRightIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'
import dashboardIsHero from '../assets/dashboard-hero.png'
import featureEntry from '../assets/feature-entry.png'
import featureInsights from '../assets/feature-insights.png'
import featureReports from '../assets/feature-reports.png'

const FeatureCard = ({ image, title, description }) => (
    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-2 group">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <img src={image} alt={title} className="w-12 h-12 object-contain drop-shadow-sm" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
)

const TargetAudienceItem = ({ text }) => (
    <li className="flex items-center gap-4 text-slate-700 font-medium">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center ring-4 ring-emerald-50">
            <span className="w-3 h-3 bg-emerald-500 rounded-full" />
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
        <div className="min-h-screen bg-[#F8FAFC] font-sans overflow-x-hidden">
            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                onLoginSuccess={() => navigate('/app/dashboard')}
                defaultIsLogin={isLoginMode}
            />

            {/* Navbar */}
            <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl border-b border-white z-50 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                            <span className="text-white font-bold text-lg">G</span>
                        </div>
                        <span className="text-2xl font-bold text-slate-900 tracking-tight">
                            GreenPulse<span className="text-emerald-600">NG</span>
                        </span>
                    </div>
                    <div>
                        <button
                            onClick={openLogin}
                            className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-medium hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 active:scale-95"
                        >
                            {isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                    <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px]" />
                    <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px]" />
                </div>

                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-emerald-100 text-emerald-800 font-semibold text-sm mb-10 shadow-lg shadow-emerald-500/5 animate-fade-in-up hover:scale-105 transition-transform cursor-default">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    The #1 Sustainability Platform for Nigeria 🇳🇬
                </div>

                <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                    Track Emissions. <br className="hidden md:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                        Drive Impact.
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                    The smartest way to measure, report, and reduce your carbon footprint.
                    Tailored for Nigerian businesses, powered by AI.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
                    <button
                        onClick={openRegister}
                        className="w-full sm:w-auto px-10 py-4.5 rounded-full bg-gradient-brand text-white font-bold text-lg hover:shadow-xl hover:shadow-emerald-600/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        Start Free Trial
                        <ArrowRightIcon className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <button
                        onClick={() => { document.getElementById('features').scrollIntoView({ behavior: 'smooth' }) }}
                        className="w-full sm:w-auto px-10 py-4.5 rounded-full bg-white text-slate-700 font-bold text-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all hover:-translate-y-1 active:scale-95 shadow-sm"
                    >
                        Explore Features
                    </button>
                </div>

                {/* Dashboard Hero Image */}
                <div className="relative mx-auto max-w-5xl group perspective-1000">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-[2rem] blur-3xl -z-10 transform scale-95 group-hover:scale-100 transition-transform duration-700" />
                    <img
                        src={dashboardIsHero}
                        alt="GreenPulse Dashboard Interface"
                        className="rounded-[1.5rem] shadow-2xl border-[6px] border-white/50 backdrop-blur-xl transform transition-transform duration-700 hover:scale-[1.01] hover:rotate-x-2"
                        style={{ transformStyle: 'preserve-3d' }}
                    />
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-slate-900 mb-6">Powerful Features</h2>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                            Everything you need to manage your environmental impact in one place.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        <FeatureCard
                            image={featureEntry}
                            title="Smart Emission Entry"
                            description="Log diesel, grid, and waste data with ease. Our system adapts to Nigerian units and automatically calculates CO₂ equivalents."
                        />
                        <FeatureCard
                            image={featureInsights}
                            title="AI-Powered Insights"
                            description="Unlock cost-saving recommendations. Our AI analyzes your patterns to suggest actionable reduction strategies."
                        />
                        <FeatureCard
                            image={featureReports}
                            title="Compliance Reporting"
                            description="Generate audit-ready PDF reports with one click. Communicate your sustainability journey to stakeholders confidently."
                        />
                    </div>
                </div>
            </section>

            {/* Who It's For */}
            <section className="py-32 bg-[#F0FDF4]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <div>
                            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold tracking-wide uppercase mb-6">
                                Why GreenPulse?
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                                Built for the <span className="text-emerald-600">Modern Nigerian Business</span>
                            </h2>
                            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                                Sustainability isn't just about the planet—it's about efficiency. We help you track fuel consumption, optimize energy use, and save money, all while building a green brand.
                            </p>
                            <ul className="space-y-6">
                                <TargetAudienceItem text="SMEs reducing fuel costs" />
                                <TargetAudienceItem text="Corporates meeting ESG goals" />
                                <TargetAudienceItem text="Consultants managing clients" />
                            </ul>
                            <div className="mt-12">
                                <button onClick={openRegister} className="text-emerald-700 font-bold text-lg hover:text-emerald-800 flex items-center gap-2 group">
                                    Join the waiting list
                                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Visual for Audience */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-3xl transform rotate-3 blur-xl opacity-60" />
                            <div className="relative bg-white p-12 rounded-3xl shadow-xl shadow-emerald-900/5 border border-white/50 backdrop-blur-xl">
                                <UserGroupIcon className="w-20 h-20 text-emerald-500 mb-8" />
                                <h3 className="text-3xl font-bold text-slate-900 mb-6">Join the Movement</h3>
                                <p className="text-slate-600 mb-10 text-lg">
                                    Join hundreds of businesses tracking their impact and building a greener future for Nigeria.
                                </p>
                                <div className="flex items-center gap-6">
                                    <div className="flex -space-x-5">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-12 h-12 rounded-full bg-slate-200 border-4 border-white flex items-center justify-center text-xs font-bold text-slate-500 shadow-md">
                                                U{i}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-sm font-bold text-slate-900">
                                        <span className="text-emerald-600 text-lg block">+500</span> Businesses
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white pt-20 pb-10 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-2xl font-bold text-white mb-6">
                                GreenPulse<span className="text-emerald-500">NG</span>
                            </h3>
                            <p className="text-slate-400 max-w-sm text-lg">
                                Empowering Nigerian businesses to track, reduce, and report their carbon footprint with ease.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-6">Platform</h4>
                            <ul className="space-y-4 text-slate-400">
                                <li><button onClick={openLogin} className="hover:text-emerald-400 transition-colors">Log In</button></li>
                                <li><button onClick={openRegister} className="hover:text-emerald-400 transition-colors">Sign Up</button></li>
                                <li><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-6">Legal</h4>
                            <ul className="space-y-4 text-slate-400">
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-slate-500 text-sm">
                            &copy; {new Date().getFullYear()} GreenPulseNG. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <a href="https://x.com/GreenpulseNG" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
                                X (Twitter)
                            </a>
                            <a href="https://www.linkedin.com/company/greenpulseng" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
                                LinkedIn
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
