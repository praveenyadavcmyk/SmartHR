import { useEffect, useMemo, useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

export default function AIAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [performance, setPerformance] = useState([])
  const [risks, setRisks] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem('access_token')
  }

  // ============================================================
  // API REQUEST
  // ============================================================

  const apiRequest = async (endpoint) => {
    const token = getToken()

    if (!token) {
      throw new Error(
        'Login session expired. Please login again.'
      )
    }

    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
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
          'Unable to load analytics.'
      )
    }

    return result
  }

  // ============================================================
  // FETCH ANALYTICS
  // ============================================================

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError('')

      const [
        analyticsResult,
        performanceResult,
        riskResult,
      ] = await Promise.all([
        apiRequest('/ai/analytics'),
        apiRequest('/ai/performance'),
        apiRequest('/ai/attendance-risk'),
      ])

      setAnalytics(
        analyticsResult.data || null
      )

      setPerformance(
        performanceResult.data || []
      )

      setRisks(
        riskResult.data || []
      )
    } catch (err) {
      setError(err.message)

      setAnalytics(null)
      setPerformance([])
      setRisks([])
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchAnalytics()
  }, [])

  // ============================================================
  // FILTER PERFORMANCE
  // ============================================================

  const filteredPerformance = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase()

    return performance.filter((employee) => {
      const name = String(
        employee.name || ''
      ).toLowerCase()

      const employeeId = String(
        employee.employee_id || ''
      ).toLowerCase()

      const designation = String(
        employee.designation || ''
      ).toLowerCase()

      return (
        !searchValue ||
        name.includes(searchValue) ||
        employeeId.includes(searchValue) ||
        designation.includes(searchValue)
      )
    })
  }, [performance, search])

  // ============================================================
  // FILTER RISKS
  // ============================================================

  const filteredRisks = useMemo(() => {
    return risks.filter((employee) => {
      if (riskFilter === 'All') {
        return true
      }

      return (
        String(employee.risk_level).toLowerCase() ===
        riskFilter.toLowerCase()
      )
    })
  }, [risks, riskFilter])

  // ============================================================
  // RISK COUNTS
  // ============================================================

  const riskStats = useMemo(() => {
    const high = risks.filter(
      (item) =>
        String(item.risk_level).toLowerCase() ===
        'high'
    ).length

    const medium = risks.filter(
      (item) =>
        String(item.risk_level).toLowerCase() ===
        'medium'
    ).length

    const low = risks.filter(
      (item) =>
        String(item.risk_level).toLowerCase() ===
        'low'
    ).length

    return {
      high,
      medium,
      low,
    }
  }, [risks])

  // ============================================================
  // PERFORMANCE STATUS STYLE
  // ============================================================

  const getPerformanceClass = (category) => {
    const value = String(
      category || ''
    ).toLowerCase()

    if (value === 'excellent') {
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    }

    if (value === 'good') {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }

    if (value === 'average') {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }

    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  // ============================================================
  // RISK STYLE
  // ============================================================

  const getRiskClass = (risk) => {
    const value = String(
      risk || ''
    ).toLowerCase()

    if (value === 'high') {
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    }

    if (value === 'medium') {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }

    if (value === 'low') {
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    }

    return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }

  // ============================================================
  // SAFE VALUES
  // ============================================================

  const totalEmployees =
    analytics?.employees?.total_active ?? 0

  const attendanceRate =
    analytics?.attendance?.attendance_rate ?? 0

  const todayAttendance =
    analytics?.attendance?.today ?? 0

  const totalAttendance =
    analytics?.attendance?.total_records ?? 0

  const presentRecords =
    analytics?.attendance?.present_records ?? 0

  const lateRecords =
    analytics?.attendance?.late_records ?? 0

  const absentRecords =
    analytics?.attendance?.absent_records ?? 0

  const faceVerified =
    analytics?.face_verification?.verified ?? 0

  const faceFailed =
    analytics?.face_verification?.failed ?? 0

  const faceSuccess =
    analytics?.face_verification
      ?.success_percentage ?? 0

  const todayFaceVerified =
    analytics?.face_verification
      ?.today_verified ?? 0

  const geofenceViolations =
    analytics?.geofence?.violations ?? 0

  const verificationAccuracy =
    analytics?.geofence
      ?.verification_accuracy ?? 0

  const bothVerified =
    analytics?.geofence?.both_verified ?? 0

  const pendingLeaves =
    analytics?.leaves?.pending ?? 0

  const approvedLeaves =
    analytics?.leaves?.approved ?? 0

  const rejectedLeaves =
    analytics?.leaves?.rejected ?? 0

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="p-6">
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto" />

            <p className="text-gray-400 mt-4">
              Generating AI analytics...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-white">
            AI Analytics
          </h1>

          <p className="text-gray-400 mt-1">
            Employee performance, attendance insights
            and risk analysis
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
        >
          Refresh Analytics
        </button>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
          {error}
        </div>
      )}

      {/* =====================================================
          MAIN STATISTICS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Active Employees
          </p>

          <p className="text-3xl font-bold text-white mt-2">
            {totalEmployees}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Currently active workforce
          </p>
        </div>

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Attendance Rate
          </p>

          <p className="text-3xl font-bold text-green-400 mt-2">
            {attendanceRate}%
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Overall attendance
          </p>
        </div>

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Verification Accuracy
          </p>

          <p className="text-3xl font-bold text-blue-400 mt-2">
            {verificationAccuracy}%
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Face + location verified
          </p>
        </div>

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            High Risk Employees
          </p>

          <p className="text-3xl font-bold text-red-400 mt-2">
            {riskStats.high}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Need attendance attention
          </p>
        </div>

      </div>

      {/* =====================================================
          ATTENDANCE + FACE ANALYTICS
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* ATTENDANCE */}

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">
              Attendance Insights
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Overall attendance activity
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Total Records
              </p>

              <p className="text-2xl font-bold text-white mt-2">
                {totalAttendance}
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Today
              </p>

              <p className="text-2xl font-bold text-blue-400 mt-2">
                {todayAttendance}
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Present
              </p>

              <p className="text-2xl font-bold text-green-400 mt-2">
                {presentRecords}
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Late
              </p>

              <p className="text-2xl font-bold text-yellow-400 mt-2">
                {lateRecords}
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Absent
              </p>

              <p className="text-2xl font-bold text-red-400 mt-2">
                {absentRecords}
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Attendance %
              </p>

              <p className="text-2xl font-bold text-purple-400 mt-2">
                {attendanceRate}%
              </p>
            </div>

          </div>

        </div>

        {/* FACE + LOCATION */}

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">
              Smart Verification
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Face recognition and geofence analytics
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Face Verified
              </p>

              <p className="text-2xl font-bold text-green-400 mt-2">
                {faceVerified}
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Face Failed
              </p>

              <p className="text-2xl font-bold text-red-400 mt-2">
                {faceFailed}
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Face Success
              </p>

              <p className="text-2xl font-bold text-blue-400 mt-2">
                {faceSuccess}%
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Verified Today
              </p>

              <p className="text-2xl font-bold text-white mt-2">
                {todayFaceVerified}
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Face + Location
              </p>

              <p className="text-2xl font-bold text-green-400 mt-2">
                {bothVerified}
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Geofence Violations
              </p>

              <p className="text-2xl font-bold text-red-400 mt-2">
                {geofenceViolations}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          LEAVE + RISK SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* LEAVE */}

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">

          <h2 className="text-lg font-semibold text-white">
            Leave Analytics
          </h2>

          <p className="text-sm text-gray-400 mt-1 mb-5">
            Current leave request distribution
          </p>

          <div className="grid grid-cols-3 gap-3">

            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {pendingLeaves}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Pending
              </p>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">
                {approvedLeaves}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Approved
              </p>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">
                {rejectedLeaves}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Rejected
              </p>
            </div>

          </div>

        </div>

        {/* RISK */}

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">

          <h2 className="text-lg font-semibold text-white">
            Employee Risk Overview
          </h2>

          <p className="text-sm text-gray-400 mt-1 mb-5">
            Attendance-based employee risk detection
          </p>

          <div className="grid grid-cols-3 gap-3">

            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">
                {riskStats.high}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                High Risk
              </p>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {riskStats.medium}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Medium
              </p>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">
                {riskStats.low}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Low Risk
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          PERFORMANCE RANKING
      ====================================================== */}

      <div className="rounded-xl border border-gray-700 overflow-hidden mb-6">

        <div className="p-5 bg-gray-800 border-b border-gray-700">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h2 className="text-lg font-semibold text-white">
                Employee Performance Ranking
              </h2>

              <p className="text-sm text-gray-400 mt-1">
                AI-assisted scoring using attendance,
                working hours and punctuality
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search employee..."
              className="w-full md:w-64 p-2.5 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
            />

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-800">

              <tr>
                <th className="p-4">
                  Rank
                </th>

                <th className="p-4">
                  Employee
                </th>

                <th className="p-4">
                  Present
                </th>

                <th className="p-4">
                  Late
                </th>

                <th className="p-4">
                  Avg Hours
                </th>

                <th className="p-4">
                  Attendance
                </th>

                <th className="p-4">
                  Score
                </th>

                <th className="p-4">
                  Performance
                </th>

                <th className="p-4">
                  Risk
                </th>
              </tr>

            </thead>

            <tbody>

              {filteredPerformance.length === 0 ? (

                <tr>
                  <td
                    colSpan="9"
                    className="p-10 text-center text-gray-400"
                  >
                    No performance data found.
                  </td>
                </tr>

              ) : (

                filteredPerformance.map(
                  (employee, index) => (

                    <tr
                      key={
                        employee.id ||
                        employee.employee_id
                      }
                      className="border-t border-gray-700 hover:bg-gray-800/50"
                    >

                      <td className="p-4">
                        <span className="font-bold text-gray-300">
                          #{index + 1}
                        </span>
                      </td>

                      <td className="p-4 min-w-[180px]">

                        <p className="font-medium text-white">
                          {employee.name}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {employee.employee_id}

                          {employee.designation
                            ? ` • ${employee.designation}`
                            : ''}
                        </p>

                      </td>

                      <td className="p-4">
                        {employee.present_days ?? 0}
                      </td>

                      <td className="p-4 text-yellow-400">
                        {employee.late_days ?? 0}
                      </td>

                      <td className="p-4">
                        {employee.average_working_hours ?? 0}h
                      </td>

                      <td className="p-4">
                        {employee.attendance_percentage ?? 0}%
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-blue-400">
                          {employee.performance_score ?? 0}
                        </span>
                        <span className="text-gray-500">
                          /100
                        </span>
                      </td>

                      <td className="p-4">

                        <span
                          className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${getPerformanceClass(
                            employee.performance_category
                          )}`}
                        >
                          {employee.performance_category}
                        </span>

                      </td>

                      <td className="p-4">

                        <span
                          className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${getRiskClass(
                            employee.risk_level
                          )}`}
                        >
                          {employee.risk_level}
                        </span>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          ATTENDANCE RISK ANALYSIS
      ====================================================== */}

      <div className="rounded-xl border border-gray-700 overflow-hidden">

        <div className="p-5 bg-gray-800 border-b border-gray-700">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h2 className="text-lg font-semibold text-white">
                Attendance Risk Analysis
              </h2>

              <p className="text-sm text-gray-400 mt-1">
                Employees automatically classified
                using attendance patterns
              </p>
            </div>

            <select
              value={riskFilter}
              onChange={(e) =>
                setRiskFilter(e.target.value)
              }
              className="p-2.5 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
            >
              <option value="All">
                All Risk Levels
              </option>

              <option value="High">
                High Risk
              </option>

              <option value="Medium">
                Medium Risk
              </option>

              <option value="Low">
                Low Risk
              </option>
            </select>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-800">

              <tr>
                <th className="p-4">
                  Employee
                </th>

                <th className="p-4">
                  Attendance
                </th>

                <th className="p-4">
                  Late Days
                </th>

                <th className="p-4">
                  Absent Days
                </th>

                <th className="p-4">
                  Risk Level
                </th>

                <th className="p-4">
                  Analysis
                </th>
              </tr>

            </thead>

            <tbody>

              {filteredRisks.length === 0 ? (

                <tr>
                  <td
                    colSpan="6"
                    className="p-10 text-center text-gray-400"
                  >
                    No risk analysis available.
                  </td>
                </tr>

              ) : (

                filteredRisks.map(
                  (employee) => (

                    <tr
                      key={employee.employee_id}
                      className="border-t border-gray-700 hover:bg-gray-800/50"
                    >

                      <td className="p-4">

                        <p className="font-medium text-white">
                          {employee.name}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {employee.employee_id}
                        </p>

                      </td>

                      <td className="p-4">
                        {employee.attendance_percentage ?? 0}%
                      </td>

                      <td className="p-4 text-yellow-400">
                        {employee.late_days ?? 0}
                      </td>

                      <td className="p-4 text-red-400">
                        {employee.absent_days ?? 0}
                      </td>

                      <td className="p-4">

                        <span
                          className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${getRiskClass(
                            employee.risk_level
                          )}`}
                        >
                          {employee.risk_level}
                        </span>

                      </td>

                      <td className="p-4 min-w-[260px] text-gray-300">
                        {employee.reason || '-'}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}