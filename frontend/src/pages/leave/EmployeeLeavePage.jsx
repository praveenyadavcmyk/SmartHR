import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

const initialFormData = {
  leave_type: '',
  start_date: '',
  end_date: '',
  reason: '',
}

export default function EmployeeLeavePage() {
  const { user } = useAuth()

  const [leaves, setLeaves] = useState([])
  const [formData, setFormData] = useState(initialFormData)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ============================================================
  // GET TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem('access_token')
  }

  // ============================================================
  // GET EMPLOYEE DATABASE ID
  // ============================================================

  const getEmployeeId = () => {
    return user?.id
  }

  // ============================================================
  // FETCH MY LEAVE HISTORY
  // Backend:
  // GET /api/leaves/employee/<employee_id>
  // ============================================================

  const fetchMyLeaves = async () => {
    try {
      setLoading(true)
      setError('')

      const token = getToken()
      const employeeId = getEmployeeId()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      if (!employeeId) {
        throw new Error(
          'Employee information not available.'
        )
      }

      const response = await fetch(
        `${API_BASE_URL}/leaves/employee/${employeeId}`,
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
            'Failed to fetch leave history.'
        )
      }

      setLeaves(result.data || [])
    } catch (err) {
      setError(err.message)
      setLeaves([])
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (user?.id) {
      fetchMyLeaves()
    }
  }, [user?.id])

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // ============================================================
  // VALIDATE FORM
  // ============================================================

  const validateForm = () => {
    if (!formData.leave_type) {
      throw new Error(
        'Please select a leave type.'
      )
    }

    if (!formData.start_date) {
      throw new Error(
        'Please select a start date.'
      )
    }

    if (!formData.end_date) {
      throw new Error(
        'Please select an end date.'
      )
    }

    if (formData.end_date < formData.start_date) {
      throw new Error(
        'End date cannot be before start date.'
      )
    }

    const today = new Date()
      .toISOString()
      .split('T')[0]

    if (formData.start_date < today) {
      throw new Error(
        'Start date cannot be in the past.'
      )
    }
  }

  // ============================================================
  // APPLY FOR LEAVE
  // Backend:
  // POST /api/leaves/apply
  // ============================================================

  const handleApplyLeave = async (e) => {
    e.preventDefault()

    try {
      setError('')
      setSuccess('')

      validateForm()

      const token = getToken()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      setSubmitting(true)

      const payload = {
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason.trim(),
      }

      const response = await fetch(
        `${API_BASE_URL}/leaves/apply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Failed to submit leave application.'
        )
      }

      setSuccess(
        'Leave application submitted successfully.'
      )

      setFormData(initialFormData)
      setShowForm(false)

      await fetchMyLeaves()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // CANCEL FORM
  // ============================================================

  const handleCancelForm = () => {
    setFormData(initialFormData)
    setShowForm(false)
    setError('')
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return '-'
    }

    const dateString = String(dateValue).substring(0, 10)
    const parts = dateString.split('-')

    if (parts.length !== 3) {
      return dateValue
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  // ============================================================
  // CALCULATE DAYS
  // ============================================================

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) {
      return 0
    }

    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)

    const difference =
      end.getTime() - start.getTime()

    return (
      Math.floor(
        difference / (1000 * 60 * 60 * 24)
      ) + 1
    )
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  const stats = useMemo(() => {
    const pending = leaves.filter(
      (leave) =>
        String(leave.status).toLowerCase() ===
        'pending'
    ).length

    const approved = leaves.filter(
      (leave) =>
        String(leave.status).toLowerCase() ===
        'approved'
    ).length

    const rejected = leaves.filter(
      (leave) =>
        String(leave.status).toLowerCase() ===
        'rejected'
    ).length

    const approvedDays = leaves
      .filter(
        (leave) =>
          String(leave.status).toLowerCase() ===
          'approved'
      )
      .reduce(
        (total, leave) =>
          total +
          calculateDays(
            leave.start_date,
            leave.end_date
          ),
        0
      )

    return {
      total: leaves.length,
      pending,
      approved,
      rejected,
      approvedDays,
    }
  }, [leaves])

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusClass = (status) => {
    const value = String(status || '').toLowerCase()

    if (value === 'approved') {
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    }

    if (value === 'rejected') {
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    }

    if (value === 'pending') {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }

    return 'bg-gray-500/10 text-gray-300 border-gray-500/20'
  }

  // ============================================================
  // TODAY FOR DATE INPUT
  // ============================================================

  const today = new Date()
    .toISOString()
    .split('T')[0]

  return (
    <div className="p-6">

      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-white">
            My Leave
          </h1>

          <p className="text-gray-400 mt-1">
            Apply for leave and track your requests
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm(true)
            setError('')
            setSuccess('')
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          + Apply Leave
        </button>

      </div>

      {/* EMPLOYEE INFORMATION */}

      <div className="mb-6 p-5 rounded-xl border border-gray-700 bg-gray-800">

        <p className="text-sm text-gray-400">
          Employee
        </p>

        <h2 className="text-lg font-semibold text-white mt-1">
          {user?.first_name}{' '}
          {user?.last_name}
        </h2>

        <p className="text-sm text-gray-400 mt-1">
          {user?.employee_id || '-'}
        </p>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="mb-5 p-4 rounded-lg border border-green-500/20 bg-green-500/10 text-green-400">
          {success}
        </div>
      )}

      {/* APPLY LEAVE FORM */}

      {showForm && (
        <div className="mb-6 p-6 rounded-xl border border-gray-700 bg-gray-800">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-semibold text-white">
                Apply for Leave
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                Enter your leave information
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancelForm}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>

          </div>

          <form onSubmit={handleApplyLeave}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* LEAVE TYPE */}

              <div>
                <label className="block mb-2 text-sm text-gray-300">
                  Leave Type *
                </label>

                <select
                  name="leave_type"
                  value={formData.leave_type}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select leave type
                  </option>

                  <option value="Casual Leave">
                    Casual Leave
                  </option>

                  <option value="Sick Leave">
                    Sick Leave
                  </option>

                  <option value="Earned Leave">
                    Earned Leave
                  </option>

                  <option value="Emergency Leave">
                    Emergency Leave
                  </option>

                  <option value="Unpaid Leave">
                    Unpaid Leave
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {/* START DATE */}

              <div>
                <label className="block mb-2 text-sm text-gray-300">
                  Start Date *
                </label>

                <input
                  type="date"
                  name="start_date"
                  min={today}
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
                />
              </div>

              {/* END DATE */}

              <div>
                <label className="block mb-2 text-sm text-gray-300">
                  End Date *
                </label>

                <input
                  type="date"
                  name="end_date"
                  min={
                    formData.start_date ||
                    today
                  }
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
                />
              </div>

              {/* NUMBER OF DAYS */}

              <div>
                <label className="block mb-2 text-sm text-gray-300">
                  Number of Days
                </label>

                <div className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-300">
                  {formData.start_date &&
                  formData.end_date
                    ? calculateDays(
                        formData.start_date,
                        formData.end_date
                      )
                    : 0}
                </div>
              </div>

            </div>

            {/* REASON */}

            <div className="mt-4">

              <label className="block mb-2 text-sm text-gray-300">
                Reason
              </label>

              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="4"
                maxLength="500"
                placeholder="Enter reason for leave"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500 resize-none"
              />

              <p className="text-xs text-gray-500 mt-1 text-right">
                {formData.reason.length}/500
              </p>

            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 mt-6">

              <button
                type="button"
                onClick={handleCancelForm}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {submitting
                  ? 'Submitting...'
                  : 'Submit Application'}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Total Requests
          </p>

          <p className="text-3xl font-bold mt-2 text-white">
            {stats.total}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Pending
          </p>

          <p className="text-3xl font-bold mt-2 text-yellow-400">
            {stats.pending}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Approved
          </p>

          <p className="text-3xl font-bold mt-2 text-green-400">
            {stats.approved}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Approved Days
          </p>

          <p className="text-3xl font-bold mt-2 text-blue-400">
            {stats.approvedDays}
          </p>
        </div>

      </div>

      {/* LEAVE HISTORY */}

      <div className="rounded-xl border border-gray-700 overflow-hidden">

        <div className="px-5 py-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">

          <div>
            <h2 className="font-semibold text-white">
              Leave History
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              {leaves.length} request(s)
            </p>
          </div>

          <button
            type="button"
            onClick={fetchMyLeaves}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm"
          >
            {loading
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-800">
              <tr>
                <th className="p-4">
                  Leave Type
                </th>

                <th className="p-4">
                  From
                </th>

                <th className="p-4">
                  To
                </th>

                <th className="p-4">
                  Days
                </th>

                <th className="p-4">
                  Reason
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
                    colSpan="6"
                    className="p-10 text-center text-gray-400"
                  >
                    Loading leave history...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-10 text-center"
                  >
                    <p className="text-gray-300 font-medium">
                      No leave applications yet.
                    </p>

                    <p className="text-gray-500 text-sm mt-2">
                      Click Apply Leave to submit your first request.
                    </p>
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-t border-gray-700 hover:bg-gray-800/50"
                  >

                    <td className="p-4 whitespace-nowrap">
                      {leave.leave_type || '-'}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {formatDate(
                        leave.start_date
                      )}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {formatDate(
                        leave.end_date
                      )}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {calculateDays(
                        leave.start_date,
                        leave.end_date
                      )}
                    </td>

                    <td className="p-4 min-w-[220px]">
                      {leave.reason || '-'}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${getStatusClass(
                          leave.status
                        )}`}
                      >
                        {leave.status || '-'}
                      </span>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}