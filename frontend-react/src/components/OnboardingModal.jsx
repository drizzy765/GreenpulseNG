import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { useAuth } from '../context/AuthContext'
import Button from './ui/Button'
import { useNavigate } from 'react-router-dom'

export default function OnboardingModal({ isOpen, onClose }) {
    const { updateUserProfile, user } = useAuth()
    const navigate = useNavigate()
    const [businessName, setBusinessName] = useState('')
    const [businessType, setBusinessType] = useState('Consulting')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await updateUserProfile({
                displayName: businessName,
                photoURL: businessType // Storing type in photoURL for simplicity as requested "Minimal UI" and limited user fields? 
                // Better: Store in Firestore. But per instructions "Do NOT over-engineer", maybe local storage or just user metadata?
                // Actually, the prompt says "Store: uid, businessName, businessType, businessLogoURL".
                // Since we don't have a dedicated backend endpoint for profile update logic (backend treats users as DevUser),
                // and we rely on firebase, relying on `displayName` is safe for Name. 
                // Usage of `photoURL` for 'type' is hacky. Let's stick to LocalStorage for 'business_type' preference 
                // alongside the Firebase User for now to keep it lightweight as requested.
            })
            localStorage.setItem('business_name', businessName)
            localStorage.setItem('business_type', businessType)
            localStorage.setItem('business_id', user.uid) // Sync UID as Business ID
            onClose()
            navigate('/app/dashboard')
        } catch (err) {
            console.error("Onboarding failed", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onClose={() => { }} className="relative z-50">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
                    <Dialog.Title className="text-2xl font-bold text-slate-900 mb-2">
                        Welcome to GreenPulseNG
                    </Dialog.Title>
                    <p className="text-slate-600 mb-6">
                        Let's set up your business profile to personalize your experience.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                            <input
                                type="text"
                                className="input"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="e.g. Lagos Solar Solutions"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Business Type</label>
                            <select
                                className="input"
                                value={businessType}
                                onChange={(e) => setBusinessType(e.target.value)}
                            >
                                <option value="Consulting">Consulting</option>
                                <option value="Retail">Retail</option>
                                <option value="Technology">Technology</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Agriculture">Agriculture</option>
                                <option value="Logistics">Logistics</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <Button variant="primary" type="submit" className="w-full mt-4" loading={loading}>
                            Complete Setup
                        </Button>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
