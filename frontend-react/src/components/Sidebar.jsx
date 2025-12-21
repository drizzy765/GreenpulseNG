import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Dialog, Transition } from '@headlessui/react'
import {
  HomeIcon,
  PlusCircleIcon,
  SparklesIcon,
  LightBulbIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const menu = [
  { to: '/app/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/app/add-emission', label: 'Smart Entry', icon: PlusCircleIcon },
  { to: '/app/ai-calculator', label: 'GreenPulse AI', icon: SparklesIcon },
  { to: '/app/forecast', label: 'Forecasting', icon: ChartBarIcon },
  { to: '/app/insights', label: 'Insights', icon: LightBulbIcon },
  { to: '/app/reports', label: 'Reports', icon: DocumentTextIcon },
  { to: '/app/history', label: 'History', icon: ClockIcon },
]

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation()
  const isMobile = mobileOpen !== undefined

  const MenuContent = () => (
    <nav className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 md:hidden">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          GreenPulse<span className="text-primary-600">NG</span>
        </h1>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-6 h-6 text-slate-500" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center gap-3 px-6 py-3 mx-3 rounded-lg transition-all duration-200 group ${isActive
                ? 'bg-primary-50 text-primary-700 font-medium border border-primary-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-500'}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )

  // Desktop: Permanent sidebar
  if (!isMobile) {
    return (
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0">
        <div className="flex flex-col w-64 fixed inset-y-0 left-0 pt-16">
          <MenuContent />
        </div>
      </aside>
    )
  }

  // Mobile: Slide-over drawer
  return (
    <Transition.Root show={mobileOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 md:hidden" onClose={setMobileOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-xs">
                  <MenuContent />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}