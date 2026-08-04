import { useEffect, useMemo, useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

export default function AttendancePage() {
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')
  const [search, setSearch] = useState('')

  // =========================
  // GET TOKEN
  // =========================
  const getToken = () => {
    return localStorage.getItem('access_token')
  }

  // =========================
  // FETCH ATTENDANCE
  // =========================
  const fetchAttendance = async (employeeId = '') => {
    try {
      setLoading(true)
      setError('')

      const token = getToken()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      const url = employeeId
        ? `${API_BASE_URL}/attendance/${employeeId}`
        : `${API_BASE_URL}/attendance/`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Failed to fetch attendance records.'
        )
      }

      let attendanceData = result.data || []

      // Employee-specific API does not return
      // employee_id and employee_name inside each row.
      if (employeeId && result.employee) {
        attendanceData = attendanceData.map((record) => ({
          ...record,
          employee_id: result.employee.id,
          employee_code: result.employee.employee_id,
          employee_name: result.employee.name,
        }))
      }

      setRecords(attendanceData)
    } catch (err) {
      setError(err.message)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // FETCH EMPLOYEES
  // =========================
  const fetchEmployees = async () => {
    try {
      const token = getToken()

      if (!token) {
        return
      }

      const response = await fetch(
        `${API_BASE_URL}/employees/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        return
      }

      setEmployees(result.data || [])
    } catch (err) {
      console.error(
        'Failed to fetch employees:',
        err
      )
    }
  }

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    fetchAttendance()
    fetchEmployees()
  }, [])

  // =========================
  // EMPLOYEE FILTER
  // =========================
  const handleEmployeeChange = (e) => {
    const value = e.target.value

    setSelectedEmployee(value)

    fetchAttendance(value)
  }

  // =========================
  // RESET FILTERS
  // =========================
  const handleResetFilters = () => {
    setSelectedEmployee('')
    setStatusFilter('All')
    setDateFilter('')
    setSearch('')

    fetchAttendance()
  }

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return '-'
    }

    const parts = String(dateValue).split('-')

    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }

    return dateValue
  }

  // =========================
  // FORMAT TIME
  // =========================
  const formatTime = (dateTimeValue) => {
    if (!dateTimeValue) {
      return '-'
    }

    const date = new Date(
      String(dateTimeValue).replace(' ', 'T') + 'Z'
    )

    if (Number.isNaN(date.getTime())) {
      const timePart = String(dateTimeValue).split(' ')[1]

      return timePart
        ? timePart.substring(0, 8)
        : '-'
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // =========================
  // FIND EMPLOYEE CODE
  // =========================
  const getEmployeeCode = (record) => {
    if (record.employee_code) {
      return record.employee_code
    }

    const employee = employees.find(
      (item) =>
        Number(item.id) ===
        Number(record.employee_id)
    )

    return employee?.employee_id || record.employee_id || '-'
  }

  // =========================
  // FILTER RECORDS
  // =========================
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const name = (
        record.employee_name || ''
      ).toLowerCase()

      const employeeCode = String(
        getEmployeeCode(record)
      ).toLowerCase()

      const searchValue = search
        .trim()
        .toLowerCase()

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        employeeCode.includes(searchValue)

      const matchesStatus =
        statusFilter === 'All' ||
        record.status === statusFilter

      const matchesDate =
        !dateFilter ||
        record.attendance_date === dateFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      )
    })
  }, [
    records,
    employees,
    search,
    statusFilter,
    dateFilter,
  ])

  // =========================
  // STATISTICS
  // =========================
  const stats = useMemo(() => {
    const today = new Date()
      .toISOString()
      .split('T')[0]

    const todayRecords = records.filter(
      (record) =>
        record.attendance_date === today
    )

    const presentToday = todayRecords.filter(
      (record) =>
        String(record.status).toLowerCase() ===
        'present'
    ).length

    const checkedOutToday = todayRecords.filter(
      (record) => record.check_out
    ).length

    const stillWorking = todayRecords.filter(
      (record) =>
        record.check_in &&
        !record.check_out
    ).length

    return {
      totalRecords: records.length,
      presentToday,
      checkedOutToday,
      stillWorking,
    }
  }, [records])

  // =========================
  // STATUS STYLE
  // =========================
  const getStatusClass = (status) => {
    const value = String(
      status || ''
    ).toLowerCase()

    if (value === 'present') {
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    }

    if (value === 'absent') {
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    }

    if (value === 'late') {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }

    if (value === 'leave') {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }

    return 'bg-gray-500/10 text-gray-300 border-gray-500/20'
  }

  return (
    <div className="p-6">

      {/* ================= HEADER ================= */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Attendance
        </h1>

        <p className="text-gray-400 mt-1">
          Monitor employee attendance records
        </p>
      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div className="mb-5 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
          {error}
        </div>
      )}

      {/* ================= STAT CARDS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Total Records
          </p>

          <p className="text-3xl font-bold mt-2">
            {stats.totalRecords}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Present Today
          </p>

          <p className="text-3xl font-bold mt-2 text-green-400">
            {stats.presentToday}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Working Now
          </p>

          <p className="text-3xl font-bold mt-2 text-blue-400">
            {stats.stillWorking}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            Checked Out Today
          </p>

          <p className="text-3xl font-bold mt-2 text-purple-400">
            {stats.checkedOutToday}
          </p>
        </div>

      </div>

      {/* ================= FILTER SECTION ================= */}

      <div className="mb-6 p-5 rounded-xl border border-gray-700 bg-gray-800">

        <div className="flex items-center justify-between mb-4">

          <div>
            <h2 className="font-semibold">
              Attendance Filters
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Search and filter attendance records
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* SEARCH */}

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
              placeholder="Name or employee ID"
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
            />
          </div>

          {/* EMPLOYEE */}

          <div>
            <label className="block mb-2 text-sm text-gray-300">
              Employee
            </label>

            <select
              value={selectedEmployee}
              onChange={handleEmployeeChange}
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
            >
              <option value="">
                All Employees
              </option>

              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.employee_id} -{' '}
                  {employee.first_name}{' '}
                  {employee.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS */}

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
              <option value="All">
                All Status
              </option>

              <option value="Present">
                Present
              </option>

              <option value="Absent">
                Absent
              </option>

              <option value="Late">
                Late
              </option>

              <option value="Leave">
                Leave
              </option>
            </select>
          </div>

          {/* DATE */}

          <div>
            <label className="block mb-2 text-sm text-gray-300">
              Date
            </label>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500"
            />
          </div>

        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="rounded-xl border border-gray-700 overflow-hidden">

        <div className="px-5 py-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">

          <div>
            <h2 className="font-semibold">
              Attendance Records
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              {filteredRecords.length} record(s)
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchAttendance(selectedEmployee)
            }
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
                  Employee ID
                </th>

                <th className="p-4">
                  Employee
                </th>

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
                    colSpan="7"
                    className="p-8 text-center text-gray-400"
                  >
                    Loading attendance records...
                  </td>
                </tr>

              ) : filteredRecords.length === 0 ? (

                <tr>
                  <td
                    colSpan="7"
                    className="p-10 text-center"
                  >
                    <p className="text-gray-300 font-medium">
                      No attendance records found.
                    </p>

                    <p className="text-gray-500 text-sm mt-2">
                      Attendance will appear here after employees check in.
                    </p>
                  </td>
                </tr>

              ) : (

                filteredRecords.map((record) => (

                  <tr
                    key={record.id}
                    className="border-t border-gray-700 hover:bg-gray-800/50"
                  >

                    {/* EMPLOYEE ID */}

                    <td className="p-4 whitespace-nowrap">
                      {getEmployeeCode(record)}
                    </td>

                    {/* NAME */}

                    <td className="p-4 whitespace-nowrap">
                      {record.employee_name || '-'}
                    </td>

                    {/* DATE */}

                    <td className="p-4 whitespace-nowrap">
                      {formatDate(
                        record.attendance_date
                      )}
                    </td>

                    {/* CHECK IN */}

                    <td className="p-4 whitespace-nowrap">
                      {formatTime(record.check_in)}
                    </td>

                    {/* CHECK OUT */}

                    <td className="p-4 whitespace-nowrap">
                      {formatTime(record.check_out)}
                    </td>

                    {/* HOURS */}

                    <td className="p-4 whitespace-nowrap">
                      {record.working_hours !== null &&
                      record.working_hours !== undefined
                        ? `${record.working_hours} hrs`
                        : '-'}
                    </td>

                    {/* STATUS */}

                    <td className="p-4">

                      <span
                        className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${getStatusClass(
                          record.status
                        )}`}
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
    </div>
  )
}