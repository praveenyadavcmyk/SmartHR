import { useLocation } from 'react-router-dom'
import { MdMenu, MdNotifications, MdSearch } from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'

// Map paths to readable page titles
const PAGE_TITLES = {
  '/':             'Dashboard',
  '/employees':    'Employees',
  '/attendance':   'Attendance',
  '/leave':        'Leave Management',
  '/payroll':      'Payroll',
  '/departments':  'Departments',
  '/ai-analytics': 'AI Analytics',
  '/profile':      'My Profile',
  '/settings':     'Settings',
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const title = PAGE_TITLES[pathname] || 'SmartHR'

  return (
    <header className="h-16 bg-dark-850 border-b border-gray-700/50
                        flex items-center justify-between px-4 lg:px-6
                        sticky top-0 z-10">

      {/* Left: hamburger + page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
        >
          <MdMenu size={24} />
        </button>

        <div>
          <h1 className="text-gray-100 font-semibold text-lg leading-tight">{title}</h1>
          <p className="text-gray-500 text-xs hidden sm:block">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Right: search + notification + avatar */}
      <div className="flex items-center gap-3">

        {/* Search bar — hidden on small screens */}
        <div className="hidden md:flex items-center gap-2 bg-dark-900 border border-gray-700
                        rounded-lg px-3 py-2 w-52">
          <MdSearch className="text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-gray-300 placeholder-gray-600
                       outline-none w-full"
          />
        </div>

        {/* Notification bell */}
        <button className="relative p-2 text-gray-400 hover:text-white
                           hover:bg-gray-700/50 rounded-lg transition-colors">
          <MdNotifications size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500
                           rounded-full border border-dark-850" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-600/30 border border-primary-500/30
                        flex items-center justify-center cursor-pointer">
          <span className="text-primary-400 text-sm font-semibold">
            {user?.full_name?.[0]?.toUpperCase() || 'A'}
          </span>
        </div>
      </div>
    </header>
  )
}
