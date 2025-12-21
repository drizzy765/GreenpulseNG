import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bars3Icon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import OnboardingModal from './OnboardingModal'

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Checks if user has business name set in profile
  const businessName = user?.displayName || localStorage.getItem('business_name') || 'Your Business'
  const showOnboarding = isAuthenticated && !localStorage.getItem('business_type')
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  // Trigger onboarding if logged in but no profile set (handled by effect or check)
  // For simplicity, we can check here or use an effect. 
  // Let's use a simple state check on mount? 
  // actually, let's just show it if `showOnboarding` is true and we haven't shown it yet?
  // Refined: We'll open it if user just logged in. 

  const handleLogout = async () => {
    await logout()
    localStorage.removeItem('business_id')
    localStorage.removeItem('business_name')
    localStorage.removeItem('business_type')
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm/50">
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={() => {
          if (!localStorage.getItem('business_type')) setOnboardingOpen(true)
        }}
      />
      <OnboardingModal isOpen={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6 text-slate-700" />
        </button>

        {/* Logo - hidden on mobile when menu button is shown */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800">
            GreenPulseNG
          </span>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Menu as="div" className="relative ml-3">
              <div>
                <Menu.Button className="flex items-center gap-2 max-w-xs rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold border border-primary-200">
                    {user?.photoURL && user.photoURL.length < 5 ? (
                      // If we stored business type here, show icon or letter
                      user.photoURL[0]
                    ) : (
                      <UserCircleIcon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="hidden md:block font-medium text-slate-700">
                    {businessName}
                  </span>
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                  </div>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${active ? 'bg-slate-50' : ''
                          } block w-full px-4 py-2 text-left text-sm text-slate-700 flex items-center gap-2`}
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm shadow-primary-600/20"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}