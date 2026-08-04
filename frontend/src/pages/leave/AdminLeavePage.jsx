import { useEffect, useMemo, useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

export default function AdminLeavePage() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')

  // ============================================================
  // GET TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem('access_token')
  }

  // ============================================================
  // FETCH ALL LEAVE REQUESTS
  // ============================================================

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      setError('')

      const token = getToken()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      const response = await fetch(
        `${API_BASE_URL}/leaves/`,
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
            'Failed to fetch leave requests.'
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
    fetchLeaves()
  }, [])

  // ============================================================
  // APPROVE LEAVE
  // ============================================================

  const handleApprove = async (leave) => {
    const confirmed = window.confirm(
      `Approve leave request for ${leave.employee_name}?`
    )

    if (!confirmed) {
      return
    }

    try {
      setActionLoading(leave.id)
      setError('')
      setSuccess('')

      const token = getToken()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      const response = await fetch(
        `${API_BASE_URL}/leaves/${leave.id}/approve`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Failed to approve leave.'
        )
      }

      setSuccess('Leave approved successfully.')

      await fetchLeaves()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // ============================================================
  // REJECT LEAVE
  // ============================================================

  const handleReject = async (leave) => {
    const confirmed = window.confirm(
      `Reject leave request for ${leave.employee_name}?`
    )

    if (!confirmed) {
      return
    }

    try {
      setActionLoading(leave.id)
      setError('')
      setSuccess('')

      const token = getToken()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      const response = await fetch(
        `${API_BASE_URL}/leaves/${leave.id}/reject`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Failed to reject leave.'
        )
      }

      setSuccess('Leave rejected successfully.')

      await fetchLeaves()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // ============================================================
  // RESET FILTERS
  // ============================================================

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setTypeFilter('All')
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
  // CALCULATE NUMBER OF DAYS
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
  // UNIQUE LEAVE TYPES
  // ============================================================

  const leaveTypes = useMemo(() => {
    const types = leaves
      .map((leave) => leave.leave_type)
      .filter(Boolean)

    return [...new Set(types)]
  }, [leaves])

  // ============================================================
  // FILTER LEAVE REQUESTS
  // ============================================================

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const searchValue = search
        .trim()
        .toLowerCase()

      const employeeName = String(
        leave.employee_name || ''
      ).toLowerCase()

      const employeeId = String(
        leave.employee_id || ''
      ).toLowerCase()

      const leaveType = String(
        leave.leave_type || ''
      ).toLowerCase()

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employeeId.includes(searchValue) ||
        leaveType.includes(searchValue)

      const matchesStatus =
        statusFilter === 'All' ||
        String(leave.status).toLowerCase() ===
          statusFilter.toLowerCase()

      const matchesType =
        typeFilter === 'All' ||
        leave.leave_type === typeFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      )
    })
  }, [
    leaves,
    search,
    statusFilter,
    typeFilter,
  ])

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

    return {
      total: leaves.length,
      pending,
      approved,
      rejected,
    }
  }, [leaves])

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusClass = (status) => {
    const value = String(
      status || ''
    ).toLowerCase()

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

  return (
    <div className="p-6">

      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Leave Management
          </h1>

          <p className="text-gray-400 mt-1">
            Review and manage employee leave requests
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLeaves}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
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

      {/* STAT CARDS */}

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
            Rejected
          </p>
          <p className="text-3xl font-bold mt-2 text-red-400">
            {stats.rejected}
          </p>
        </div>

      </div>

      {/* FILTERS */}

      <div className="mb-6 p-5 rounded-xl border border-gray-700 bg-gray-800">

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-white">
              Leave Filters
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Search and filter leave requests
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 text-sm"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label className="block mb-2 text-sm text-gray-300">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Employee name or leave type"
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-300">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-300">
              Leave Type
            </label>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
            >
              <option value="All">All Types</option>

              {leaveTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* TABLE */}

      <div className="rounded-xl border border-gray-700 overflow-hidden">

        <div className="px-5 py-4 bg-gray-800 border-b border-gray-700">
          <h2 className="font-semibold text-white">
            Leave Requests
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            {filteredLeaves.length} request(s)
          </p>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-800">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Leave Type</th>
                <th className="p-4">From</th>
                <th className="p-4">To</th>
                <th className="p-4">Days</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="8"
                    className="p-10 text-center text-gray-400"
                  >
                    Loading leave requests...
                  </td>
                </tr>

              ) : filteredLeaves.length === 0 ? (

                <tr>
                  <td
                    colSpan="8"
                    className="p-10 text-center"
                  >
                    <p className="text-gray-300 font-medium">
                      No leave requests found.
                    </p>

                    <p className="text-gray-500 text-sm mt-2">
                      Employee leave applications will appear here.
                    </p>
                  </td>
                </tr>

              ) : (

                filteredLeaves.map((leave) => (

                  <tr
                    key={leave.id}
                    className="border-t border-gray-700 hover:bg-gray-800/50"
                  >

                    <td className="p-4 whitespace-nowrap">
                      <p className="font-medium text-white">
                        {leave.employee_name || '-'}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Employee #{leave.employee_id}
                      </p>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {leave.leave_type || '-'}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {formatDate(leave.start_date)}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {formatDate(leave.end_date)}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {calculateDays(
                        leave.start_date,
                        leave.end_date
                      )}
                    </td>

                    <td className="p-4 min-w-[220px] max-w-[300px]">
                      <p className="text-gray-300 break-words">
                        {leave.reason || '-'}
                      </p>
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

                    <td className="p-4 whitespace-nowrap">

                      {String(leave.status).toLowerCase() === 'pending' ? (

                        <div className="flex gap-2">

                          <button
                            type="button"
                            disabled={
                              actionLoading === leave.id
                            }
                            onClick={() =>
                              handleApprove(leave)
                            }
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm"
                          >
                            {actionLoading === leave.id
                              ? 'Please wait...'
                              : 'Approve'}
                          </button>

                          <button
                            type="button"
                            disabled={
                              actionLoading === leave.id
                            }
                            onClick={() =>
                              handleReject(leave)
                            }
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm"
                          >
                            Reject
                          </button>

                        </div>

                      ) : (

                        <span className="text-sm text-gray-500">
                          Completed
                        </span>

                      )}

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