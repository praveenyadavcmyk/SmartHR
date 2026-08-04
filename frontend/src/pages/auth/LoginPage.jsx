import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdAutoAwesome,
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdAdminPanelSettings,
  MdBadge,
} from 'react-icons/md'

import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  // admin | employee
  const [loginRole, setLoginRole] = useState('admin')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  // =========================
  // CHANGE LOGIN ROLE
  // =========================
  const handleRoleChange = (role) => {
    setLoginRole(role)
    setEmail('')
    setPassword('')
    setError('')
  }

  // =========================
  // LOGIN
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      await login(
        email.trim(),
        password,
        loginRole
      )

      // Routing will be separated for
      // admin and employee in the next step.
      navigate('/', {
        replace: true,
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Login failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">

      {/* ================= LEFT PANEL ================= */}

      <div
        className="
          hidden lg:flex lg:w-1/2
          bg-dark-850
          border-r border-gray-700/50
          flex-col justify-between
          p-12
          relative
          overflow-hidden
        "
      >

        {/* Background decoration */}

        <div className="absolute inset-0 overflow-hidden pointer-events-none">

          <div
            className="
              absolute
              -top-32
              -left-32
              w-96
              h-96
              bg-primary-600/10
              rounded-full
              blur-3xl
            "
          />

          <div
            className="
              absolute
              -bottom-32
              -right-32
              w-96
              h-96
              bg-primary-600/5
              rounded-full
              blur-3xl
            "
          />

        </div>

        {/* Logo */}

        <div className="flex items-center gap-3 relative z-10">

          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-primary-600
              flex
              items-center
              justify-center
            "
          >
            <MdAutoAwesome
              className="text-white text-xl"
            />
          </div>

          <div>
            <p className="text-white font-bold text-lg leading-tight">
              SmartHR
            </p>

            <p className="text-gray-500 text-xs">
              AI-Powered HRMS
            </p>
          </div>

        </div>

        {/* Hero */}

        <div className="relative z-10">

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">

            Manage your
            <br />

            <span className="text-primary-400">
              workforce smarter.
            </span>

          </h2>

          <p className="text-gray-400 text-base leading-relaxed max-w-sm">

            Smart employee attendance,
            geofencing check-in, AI analytics,
            and complete payroll management —
            all in one platform.

          </p>

          {/* Feature pills */}

          <div className="flex flex-wrap gap-2 mt-8">

            {[
              'Attendance',
              'Geofencing',
              'AI Analytics',
              'Payroll',
            ].map((feature) => (

              <span
                key={feature}
                className="
                  px-3
                  py-1.5
                  bg-gray-700/50
                  border
                  border-gray-600/50
                  text-gray-400
                  text-xs
                  rounded-full
                  font-medium
                "
              >
                {feature}
              </span>

            ))}

          </div>

        </div>

        {/* Bottom stats */}

        <div className="flex gap-8 relative z-10">

          {[
            {
              value: 'Admin',
              label: 'Management',
            },
            {
              value: 'Employee',
              label: 'Attendance',
            },
            {
              value: '100m',
              label: 'Geo Radius',
            },
          ].map(({ value, label }) => (

            <div key={label}>

              <p className="text-white font-bold text-xl">
                {value}
              </p>

              <p className="text-gray-500 text-xs">
                {label}
              </p>

            </div>

          ))}

        </div>

      </div>

      {/* ================= RIGHT PANEL ================= */}

      <div className="flex-1 flex items-center justify-center p-6">

        <div className="w-full max-w-md">

          {/* Mobile logo */}

          <div className="flex items-center gap-3 mb-10 lg:hidden">

            <div
              className="
                w-9
                h-9
                rounded-xl
                bg-primary-600
                flex
                items-center
                justify-center
              "
            >
              <MdAutoAwesome
                className="text-white text-lg"
              />
            </div>

            <p className="text-white font-bold text-lg">
              SmartHR
            </p>

          </div>

          {/* Heading */}

          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome back
          </h1>

          <p className="text-gray-400 text-sm mb-6">

            {loginRole === 'admin'
              ? 'Sign in to your admin account'
              : 'Sign in to your employee account'}

          </p>

          {/* ================= ROLE SELECTOR ================= */}

          <div
            className="
              grid
              grid-cols-2
              gap-2
              p-1
              mb-6
              bg-gray-800
              border
              border-gray-700
              rounded-xl
            "
          >

            {/* ADMIN */}

            <button
              type="button"
              onClick={() =>
                handleRoleChange('admin')
              }
              className={`
                flex
                items-center
                justify-center
                gap-2
                py-3
                rounded-lg
                text-sm
                font-medium
                transition-all

                ${
                  loginRole === 'admin'
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }
              `}
            >

              <MdAdminPanelSettings size={19} />

              Admin

            </button>

            {/* EMPLOYEE */}

            <button
              type="button"
              onClick={() =>
                handleRoleChange('employee')
              }
              className={`
                flex
                items-center
                justify-center
                gap-2
                py-3
                rounded-lg
                text-sm
                font-medium
                transition-all

                ${
                  loginRole === 'employee'
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }
              `}
            >

              <MdBadge size={19} />

              Employee

            </button>

          </div>

          {/* ================= ERROR ================= */}

          {error && (

            <div
              className="
                mb-5
                px-4
                py-3
                bg-red-500/10
                border
                border-red-500/30
                text-red-400
                text-sm
                rounded-lg
              "
            >
              {error}
            </div>

          )}

          {/* ================= LOGIN FORM ================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>

              <label className="block text-gray-400 text-sm mb-1.5 font-medium">
                Email address
              </label>

              <div className="relative">

                <MdEmail
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                  "
                  size={18}
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder={
                    loginRole === 'admin'
                      ? 'admin@company.com'
                      : 'employee@company.com'
                  }
                  required
                  autoComplete="email"
                  className="input pl-10"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label className="block text-gray-400 text-sm mb-1.5 font-medium">
                Password
              </label>

              <div className="relative">

                <MdLock
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                  "
                  size={18}
                />

                <input
                  type={
                    showPass
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input pl-10 pr-10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPass(!showPass)
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                    hover:text-gray-300
                    transition-colors
                  "
                >

                  {showPass ? (
                    <MdVisibilityOff size={18} />
                  ) : (
                    <MdVisibility size={18} />
                  )}

                </button>

              </div>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                bg-primary-600
                hover:bg-primary-700
                disabled:opacity-60
                disabled:cursor-not-allowed
                text-white
                font-semibold
                py-3
                rounded-lg
                transition-colors
                duration-200
                text-sm
                mt-2
              "
            >

              {loading
                ? 'Signing in...'
                : loginRole === 'admin'
                  ? 'Sign in as Admin'
                  : 'Sign in as Employee'}

            </button>

          </form>

          {/* Footer */}

          <p className="text-gray-600 text-xs text-center mt-8">

            {loginRole === 'admin'
              ? 'Administrator Portal'
              : 'Employee Attendance Portal'}

            {' · SmartHR v1.0'}

          </p>

        </div>

      </div>

    </div>
  )
}