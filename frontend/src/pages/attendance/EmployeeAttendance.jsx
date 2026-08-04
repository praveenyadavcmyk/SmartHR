import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdAccessTime,
  MdCheckCircle,
  MdLogout,
  MdRefresh,
  MdLogin,
  MdLogout as MdCheckOut,
  MdCalendarMonth,
  MdBadge,
} from 'react-icons/md'

import { useAuth } from '../../hooks/useAuth'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

export default function EmployeeAttendance() {
  const navigate = useNavigate()

  const {
    user,
    logout,
  } = useAuth()

  const [records, setRecords] = useState([])

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // =========================
  // GET TOKEN
  // =========================

  const getToken = () => {
    return localStorage.getItem('access_token')
  }

  // =========================
  // FETCH MY ATTENDANCE
  // =========================

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      setError('')

      const token = getToken()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      if (!user?.id) {
        throw new Error(
          'Employee information not found.'
        )
      }

      const response = await fetch(
        `${API_BASE_URL}/attendance/${user.id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Failed to fetch attendance.'
        )
      }

      setRecords(result.data || [])
    } catch (err) {
      setError(err.message)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // LOAD PAGE
  // =========================

  useEffect(() => {
    fetchAttendance()
  }, [])

  // =========================
  // TODAY DATE
  // =========================

  const todayDate = useMemo(() => {
    const now = new Date()

    const year = now.getFullYear()

    const month = String(
      now.getMonth() + 1
    ).padStart(2, '0')

    const day = String(
      now.getDate()
    ).padStart(2, '0')

    return `${year}-${month}-${day}`
  }, [])

  // =========================
  // TODAY RECORD
  // =========================

  const todayRecord = useMemo(() => {
    return records.find(
      (record) =>
        record.attendance_date === todayDate
    )
  }, [records, todayDate])

  // =========================
  // CHECK-IN STATUS
  // =========================

  const hasCheckedIn = Boolean(
    todayRecord?.check_in
  )

  // =========================
  // CHECK-OUT STATUS
  // =========================

  const hasCheckedOut = Boolean(
    todayRecord?.check_out
  )

  // =========================
  // FORMAT DATE
  // =========================

  const formatDate = (value) => {
    if (!value) {
      return '-'
    }

    const parts = String(value).split('-')

    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }

    return value
  }

  // =========================
  // FORMAT TIME
  // =========================

  const formatTime = (value) => {
    if (!value) {
      return '-'
    }

    const stringValue = String(value)

    const date = new Date(
      stringValue.replace(' ', 'T') + 'Z'
    )

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const timePart =
      stringValue.split(' ')[1]

    return timePart
      ? timePart.substring(0, 5)
      : '-'
  }

  // =========================
  // CHECK IN
  // =========================

  const handleCheckIn = async () => {
    try {
      setActionLoading(true)
      setError('')
      setMessage('')

      const token = getToken()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      const response = await fetch(
        `${API_BASE_URL}/attendance/check-in`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',

            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Check-in failed.'
        )
      }

      setMessage(
        result.message ||
          'Check-in successful.'
      )

      await fetchAttendance()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // =========================
  // CHECK OUT
  // =========================

  const handleCheckOut = async () => {
    try {
      setActionLoading(true)
      setError('')
      setMessage('')

      const token = getToken()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      const response = await fetch(
        `${API_BASE_URL}/attendance/check-out`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',

            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Check-out failed.'
        )
      }

      setMessage(
        result.message ||
          'Check-out successful.'
      )

      await fetchAttendance()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // =========================
  // REFRESH
  // =========================

  const handleRefresh = async () => {
    setMessage('')

    await fetchAttendance()
  }

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // =========================
  // EMPLOYEE NAME
  // =========================

  const employeeName = [
    user?.first_name,
    user?.last_name,
  ]
    .filter(Boolean)
    .join(' ')

  // =========================
  // TOTAL PRESENT DAYS
  // =========================

  const presentDays = useMemo(() => {
    return records.filter(
      (record) =>
        String(
          record.status || ''
        ).toLowerCase() === 'present'
    ).length
  }, [records])

  // =========================
  // TOTAL WORKING HOURS
  // =========================

  const totalWorkingHours = useMemo(() => {
    const total = records.reduce(
      (sum, record) => {
        return (
          sum +
          Number(
            record.working_hours || 0
          )
        )
      },
      0
    )

    return total.toFixed(2)
  }, [records])

  return (
    <div className="min-h-screen bg-dark-900 text-white">

      {/* ================= TOP BAR ================= */}

      <header
        className="
          border-b
          border-gray-700
          bg-gray-900
          px-6
          py-4
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto
            flex
            items-center
            justify-between
            gap-4
          "
        >

          <div>

            <h1 className="text-xl font-bold">
              SmartHR
            </h1>

            <p className="text-xs text-gray-500">
              Employee Attendance Portal
            </p>

          </div>

          <div className="flex items-center gap-4">

            <div className="hidden sm:block text-right">

              <p className="text-sm font-medium">
                {employeeName || 'Employee'}
              </p>

              <p className="text-xs text-gray-500">
                {user?.employee_id || ''}
              </p>

            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="
                flex
                items-center
                gap-2
                px-4
                py-2
                border
                border-gray-700
                rounded-lg
                text-sm
                text-gray-300
                hover:bg-gray-800
              "
            >
              <MdLogout />

              Logout
            </button>

          </div>

        </div>

      </header>

      {/* ================= PAGE ================= */}

      <main className="max-w-7xl mx-auto p-6">

        {/* ================= WELCOME ================= */}

        <div
          className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-4
            mb-6
          "
        >

          <div>

            <p className="text-gray-400 text-sm">
              Welcome back,
            </p>

            <h2 className="text-2xl font-bold mt-1">
              {employeeName || 'Employee'}
            </h2>

            <div
              className="
                flex
                items-center
                gap-2
                text-gray-400
                text-sm
                mt-2
              "
            >
              <MdBadge />

              <span>
                {user?.employee_id || '-'}
              </span>

              <span>•</span>

              <span>
                {user?.email || '-'}
              </span>

            </div>

          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-2
              bg-gray-800
              border
              border-gray-700
              rounded-lg
              hover:bg-gray-700
              disabled:opacity-50
            "
          >
            <MdRefresh />

            {loading
              ? 'Refreshing...'
              : 'Refresh'}

          </button>

        </div>

        {/* ================= ERROR ================= */}

        {error && (
          <div
            className="
              mb-5
              p-4
              rounded-lg
              border
              border-red-500/30
              bg-red-500/10
              text-red-400
            "
          >
            {error}
          </div>
        )}

        {/* ================= SUCCESS ================= */}

        {message && (
          <div
            className="
              mb-5
              p-4
              rounded-lg
              border
              border-green-500/30
              bg-green-500/10
              text-green-400
            "
          >
            {message}
          </div>
        )}

        {/* ================= TODAY CARD ================= */}

        <div
          className="
            p-6
            rounded-xl
            border
            border-gray-700
            bg-gray-800
            mb-6
          "
        >

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-6
            "
          >

            <div>

              <p className="text-gray-400 text-sm">
                Today's Attendance
              </p>

              <h3 className="text-xl font-semibold mt-1">
                {formatDate(todayDate)}
              </h3>

              <div className="mt-3">

                {!hasCheckedIn && (
                  <span
                    className="
                      inline-flex
                      px-3
                      py-1
                      rounded-full
                      bg-gray-500/10
                      border
                      border-gray-500/20
                      text-gray-300
                      text-sm
                    "
                  >
                    Not Checked In
                  </span>
                )}

                {hasCheckedIn &&
                  !hasCheckedOut && (
                    <span
                      className="
                        inline-flex
                        px-3
                        py-1
                        rounded-full
                        bg-green-500/10
                        border
                        border-green-500/20
                        text-green-400
                        text-sm
                      "
                    >
                      Working
                    </span>
                  )}

                {hasCheckedOut && (
                  <span
                    className="
                      inline-flex
                      px-3
                      py-1
                      rounded-full
                      bg-blue-500/10
                      border
                      border-blue-500/20
                      text-blue-400
                      text-sm
                    "
                  >
                    Completed
                  </span>
                )}

              </div>

            </div>

            {/* TIMES */}

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-3
                gap-4
                flex-1
                lg:max-w-2xl
              "
            >

              <div
                className="
                  p-4
                  rounded-lg
                  bg-gray-900
                  border
                  border-gray-700
                "
              >

                <p className="text-xs text-gray-500">
                  Check In
                </p>

                <p className="font-semibold mt-2">
                  {formatTime(
                    todayRecord?.check_in
                  )}
                </p>

              </div>

              <div
                className="
                  p-4
                  rounded-lg
                  bg-gray-900
                  border
                  border-gray-700
                "
              >

                <p className="text-xs text-gray-500">
                  Check Out
                </p>

                <p className="font-semibold mt-2">
                  {formatTime(
                    todayRecord?.check_out
                  )}
                </p>

              </div>

              <div
                className="
                  p-4
                  rounded-lg
                  bg-gray-900
                  border
                  border-gray-700
                "
              >

                <p className="text-xs text-gray-500">
                  Working Hours
                </p>

                <p className="font-semibold mt-2">
                  {todayRecord?.working_hours !==
                    null &&
                  todayRecord?.working_hours !==
                    undefined
                    ? `${todayRecord.working_hours} hrs`
                    : '-'}
                </p>

              </div>

            </div>

          </div>

          {/* ================= ATTENDANCE BUTTONS ================= */}

          <div
            className="
              flex
              flex-col
              sm:flex-row
              gap-3
              mt-6
              pt-6
              border-t
              border-gray-700
            "
          >

            {/* CHECK IN */}

            <button
              type="button"
              onClick={handleCheckIn}
              disabled={
                actionLoading ||
                hasCheckedIn
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                px-6
                py-3
                rounded-lg
                bg-green-600
                hover:bg-green-700
                text-white
                font-medium
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              <MdLogin size={20} />

              {hasCheckedIn
                ? 'Checked In'
                : actionLoading
                  ? 'Processing...'
                  : 'Check In'}

            </button>

            {/* CHECK OUT */}

            <button
              type="button"
              onClick={handleCheckOut}
              disabled={
                actionLoading ||
                !hasCheckedIn ||
                hasCheckedOut
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                px-6
                py-3
                rounded-lg
                bg-blue-600
                hover:bg-blue-700
                text-white
                font-medium
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              <MdCheckOut size={20} />

              {hasCheckedOut
                ? 'Checked Out'
                : actionLoading
                  ? 'Processing...'
                  : 'Check Out'}

            </button>

          </div>

        </div>

        {/* ================= STATISTICS ================= */}

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-3
            gap-4
            mb-6
          "
        >

          <div
            className="
              p-5
              rounded-xl
              border
              border-gray-700
              bg-gray-800
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <MdCalendarMonth
                className="text-blue-400"
                size={24}
              />

              <div>

                <p className="text-gray-400 text-sm">
                  Total Records
                </p>

                <p className="text-2xl font-bold mt-1">
                  {records.length}
                </p>

              </div>

            </div>

          </div>

          <div
            className="
              p-5
              rounded-xl
              border
              border-gray-700
              bg-gray-800
            "
          >

            <div className="flex items-center gap-3">

              <MdCheckCircle
                className="text-green-400"
                size={24}
              />

              <div>

                <p className="text-gray-400 text-sm">
                  Present Days
                </p>

                <p className="text-2xl font-bold mt-1">
                  {presentDays}
                </p>

              </div>

            </div>

          </div>

          <div
            className="
              p-5
              rounded-xl
              border
              border-gray-700
              bg-gray-800
            "
          >

            <div className="flex items-center gap-3">

              <MdAccessTime
                className="text-purple-400"
                size={24}
              />

              <div>

                <p className="text-gray-400 text-sm">
                  Total Working Hours
                </p>

                <p className="text-2xl font-bold mt-1">
                  {totalWorkingHours}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ================= HISTORY ================= */}

        <div
          className="
            rounded-xl
            border
            border-gray-700
            overflow-hidden
          "
        >

          <div
            className="
              px-5
              py-4
              bg-gray-800
              border-b
              border-gray-700
            "
          >

            <h3 className="font-semibold">
              My Attendance History
            </h3>

            <p className="text-gray-400 text-sm mt-1">
              Your previous attendance records
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-gray-800">

                <tr>

                  <th className="p-4">
                    Date
                  </th>

                  <th className="p-4">
                    Check In
                  </th>

                  <th className="p-4">
                    Check Out
                  </th>

                  <th className="p-4">
                    Working Hours
                  </th>

                  <th className="p-4">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="
                        p-8
                        text-center
                        text-gray-400
                      "
                    >
                      Loading attendance...
                    </td>

                  </tr>

                ) : records.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="
                        p-10
                        text-center
                        text-gray-400
                      "
                    >
                      No attendance records yet.
                    </td>

                  </tr>

                ) : (

                  records.map((record) => (

                    <tr
                      key={record.id}
                      className="
                        border-t
                        border-gray-700
                        hover:bg-gray-800/50
                      "
                    >

                      <td className="p-4">
                        {formatDate(
                          record.attendance_date
                        )}
                      </td>

                      <td className="p-4">
                        {formatTime(
                          record.check_in
                        )}
                      </td>

                      <td className="p-4">
                        {formatTime(
                          record.check_out
                        )}
                      </td>

                      <td className="p-4">

                        {record.working_hours !==
                          null &&
                        record.working_hours !==
                          undefined
                          ? `${record.working_hours} hrs`
                          : '-'}

                      </td>

                      <td className="p-4">

                        <span
                          className="
                            inline-flex
                            px-3
                            py-1
                            rounded-full
                            border
                            border-green-500/20
                            bg-green-500/10
                            text-green-400
                            text-xs
                            font-medium
                          "
                        >
                          {record.status || '-'}
                        </span>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>
  )
}