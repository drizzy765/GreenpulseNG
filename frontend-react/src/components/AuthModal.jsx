import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { useAuth } from '../context/AuthContext'
import Button from './ui/Button'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function AuthModal({ isOpen, onClose, onLoginSuccess, defaultIsLogin = true }) {
    const { loginEmail, registerEmail, loginGoogle } = useAuth()
    const [isLogin, setIsLogin] = useState(defaultIsLogin)

    // Reset isLogin when modal opens if default changes (optional, but good for switching buttons)
    // Actually, just init state is usually enough if component unmounts. 
    // If it stays mounted, we might need an effect.
    // Let's stick to useState(defaultIsLogin) for now, assuming it re-mounts or we don't switch often.
    // Better: use useEffect to sync if isOpen changes?
    // Let's add useEffect to reset when opened?
    useEffect(() => {
        if (isOpen) setIsLogin(defaultIsLogin)
    }, [isOpen, defaultIsLogin])
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            if (isLogin) {
                await loginEmail(email, password)
            } else {
                await registerEmail(email, password)
            }
            onLoginSuccess()
            onClose()
        } catch (err) {
            // Firebase error handling
            let msg = "Authentication failed."
            if (err.code === 'auth/wrong-password') msg = "Incorrect password."
            if (err.code === 'auth/user-not-found') msg = "No user found with this email."
            if (err.code === 'auth/email-already-in-use') msg = "Email already in use."
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogle = async () => {
        setLoading(true)
        try {
            await loginGoogle()
            onLoginSuccess()
            onClose()
        } catch (err) {
            console.error("Google Login Error:", err)
            if (err.code === 'auth/operation-not-allowed') {
                setError("Google Sign-In is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.")
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError("Sign-in popup was closed.")
            } else {
                setError(err.message || "Google sign-in failed.")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 md:p-8 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-xl font-bold text-slate-900">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </Dialog.Title>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button variant="primary" type="submit" className="w-full" loading={loading}>
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </Button>
                    </form>

                    <div className="mt-4 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={handleGoogle}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            disabled={loading}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            Google
                        </button>
                    </div>

                    <p className="mt-6 text-center text-sm text-slate-600">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-primary-600 font-medium hover:text-primary-700"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
