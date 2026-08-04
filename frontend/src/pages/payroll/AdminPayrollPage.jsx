import { useEffect, useMemo, useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

const initialForm = {
  employee_id: '',
  payroll_month: new Date().getMonth() + 1,
  payroll_year: new Date().getFullYear(),
  working_days: 26,
  present_days: 0,
  absent_days: 0,
  leave_days: 0,
  overtime_hours: 0,
  overtime_amount: 0,
  bonus: 0,
  deduction: 0,
  payment_status: 'Pending',
  payment_date: '',
  remarks: '',
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export default function AdminPayrollPage() {
  const [payrolls, setPayrolls] = useState([])
  const [employees, setEmployees] = useState([])

  const [formData, setFormData] = useState(initialForm)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem('access_token')
  }

  // ============================================================
  // FETCH PAYROLL
  // ============================================================

  const fetchPayrolls = async () => {
    try {
      setLoading(true)
      setError('')

      const token = getToken()

      if (!token) {
        throw new Error('Login session expired.')
      }

      const response = await fetch(
        `${API_BASE_URL}/payroll/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'Failed to fetch payroll records.'
        )
      }

      setPayrolls(result.data || [])
    } catch (err) {
      setError(err.message)
      setPayrolls([])
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // FETCH EMPLOYEES
  // ============================================================

  const fetchEmployees = async () => {
    try {
      const token = getToken()

      if (!token) return

      const response = await fetch(
        `${API_BASE_URL}/employees/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()

      if (response.ok) {
        setEmployees(result.data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchPayrolls()
    fetchEmployees()
  }, [])

  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // ============================================================
  // OPEN CREATE FORM
  // ============================================================

  const openCreateForm = () => {
    setEditingId(null)
    setFormData(initialForm)
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  // ============================================================
  // CANCEL FORM
  // ============================================================

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(initialForm)
  }

  // ============================================================
  // CREATE PAYROLL
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const token = getToken()

      if (!token) {
        throw new Error('Login session expired.')
      }

      if (!formData.employee_id && !editingId) {
        throw new Error('Please select an employee.')
      }

      const payload = {
        employee_id: Number(formData.employee_id),
        payroll_month: Number(formData.payroll_month),
        payroll_year: Number(formData.payroll_year),

        working_days: Number(formData.working_days),
        present_days: Number(formData.present_days),
        absent_days: Number(formData.absent_days),
        leave_days: Number(formData.leave_days),

        overtime_hours: Number(formData.overtime_hours),
        overtime_amount: Number(formData.overtime_amount),

        bonus: Number(formData.bonus),
        deduction: Number(formData.deduction),

        payment_status: formData.payment_status,

        payment_date:
          formData.payment_date || null,

        remarks: formData.remarks,
      }

      const url = editingId
        ? `${API_BASE_URL}/payroll/${editingId}`
        : `${API_BASE_URL}/payroll/`

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'Payroll operation failed.'
        )
      }

      setSuccess(
        editingId
          ? 'Payroll updated successfully.'
          : 'Payroll created successfully.'
      )

      closeForm()
      await fetchPayrolls()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // EDIT PAYROLL
  // ============================================================

  const handleEdit = async (payroll) => {
    try {
      setError('')
      setSuccess('')

      const token = getToken()

      const response = await fetch(
        `${API_BASE_URL}/payroll/employee/${payroll.employee_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'Failed to load payroll.'
        )
      }

      const record = (result.data || []).find(
        (item) => item.id === payroll.id
      )

      if (!record) {
        throw new Error('Payroll record not found.')
      }

      setEditingId(payroll.id)

      setFormData({
        employee_id: payroll.employee_id,

        payroll_month: record.month,
        payroll_year: record.year,

        working_days: record.working_days || 0,
        present_days: record.present_days || 0,
        absent_days: record.absent_days || 0,
        leave_days: record.leave_days || 0,

        overtime_hours: record.overtime_hours || 0,
        overtime_amount: record.overtime_amount || 0,

        bonus: record.bonus || 0,
        deduction: record.deduction || 0,

        payment_status:
          record.payment_status || 'Pending',

        payment_date:
          record.payment_date || '',

        remarks:
          record.remarks || '',
      })

      setShowForm(true)
    } catch (err) {
      setError(err.message)
    }
  }

  // ============================================================
  // DELETE PAYROLL
  // ============================================================

  const handleDelete = async (payroll) => {
    const confirmed = window.confirm(
      `Delete payroll for ${payroll.employee_name}?`
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      const token = getToken()

      const response = await fetch(
        `${API_BASE_URL}/payroll/${payroll.id}`,
        {
          method: 'DELETE',

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'Failed to delete payroll.'
        )
      }

      setSuccess('Payroll deleted successfully.')

      await fetchPayrolls()
    } catch (err) {
      setError(err.message)
    }
  }

  // ============================================================
  // FILTER
  // ============================================================

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((payroll) => {
      const searchValue = search.trim().toLowerCase()

      const matchesSearch =
        !searchValue ||
        String(payroll.employee_name || '')
          .toLowerCase()
          .includes(searchValue)

      const matchesMonth =
        monthFilter === 'All' ||
        Number(monthFilter) === Number(payroll.month)

      const matchesStatus =
        statusFilter === 'All' ||
        String(payroll.payment_status).toLowerCase() ===
          statusFilter.toLowerCase()

      return (
        matchesSearch &&
        matchesMonth &&
        matchesStatus
      )
    })
  }, [
    payrolls,
    search,
    monthFilter,
    statusFilter,
  ])

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const totalNet = payrolls.reduce(
      (total, payroll) =>
        total + Number(payroll.net_salary || 0),
      0
    )

    const paid = payrolls.filter(
      (payroll) =>
        String(payroll.payment_status).toLowerCase() ===
        'paid'
    ).length

    const pending = payrolls.filter(
      (payroll) =>
        String(payroll.payment_status).toLowerCase() ===
        'pending'
    ).length

    return {
      records: payrolls.length,
      totalNet,
      paid,
      pending,
    }
  }, [payrolls])

  // ============================================================
  // CURRENCY
  // ============================================================

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(amount || 0))
  }

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const statusClass = (status) => {
    const value = String(status).toLowerCase()

    if (value === 'paid') {
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    }

    if (value === 'pending') {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }

    return 'bg-gray-500/10 text-gray-300 border-gray-500/20'
  }

  return (
    <div className="p-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">

        <div>
          <h1 className="text-2xl font-bold text-white">
            Payroll Management
          </h1>

          <p className="text-gray-400 mt-1">
            Create and manage employee payroll
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          + Create Payroll
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="mb-5 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
          {success}
        </div>
      )}

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <StatCard
          title="Payroll Records"
          value={stats.records}
        />

        <StatCard
          title="Total Net Salary"
          value={formatCurrency(stats.totalNet)}
        />

        <StatCard
          title="Paid"
          value={stats.paid}
          className="text-green-400"
        />

        <StatCard
          title="Pending"
          value={stats.pending}
          className="text-yellow-400"
        />

      </div>

      {/* FORM */}

      {showForm && (

        <div className="p-6 mb-6 rounded-xl border border-gray-700 bg-gray-800">

          <div className="flex justify-between mb-6">

            <div>
              <h2 className="text-xl font-semibold text-white">
                {editingId
                  ? 'Edit Payroll'
                  : 'Create Payroll'}
              </h2>

              <p className="text-sm text-gray-400 mt-1">
                Enter employee payroll information
              </p>
            </div>

            <button
              onClick={closeForm}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              <FormSelect
                label="Employee"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                disabled={Boolean(editingId)}
              >
                <option value="">
                  Select employee
                </option>

                {employees.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.first_name}{' '}
                    {employee.last_name}{' '}
                    ({employee.employee_id})
                  </option>
                ))}

              </FormSelect>

              <FormSelect
                label="Month"
                name="payroll_month"
                value={formData.payroll_month}
                onChange={handleChange}
                disabled={Boolean(editingId)}
              >
                {months.map((month, index) => (
                  <option
                    key={month}
                    value={index + 1}
                  >
                    {month}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Year"
                name="payroll_year"
                type="number"
                value={formData.payroll_year}
                onChange={handleChange}
                disabled={Boolean(editingId)}
              />

              <FormInput
                label="Working Days"
                name="working_days"
                type="number"
                value={formData.working_days}
                onChange={handleChange}
              />

              <FormInput
                label="Present Days"
                name="present_days"
                type="number"
                value={formData.present_days}
                onChange={handleChange}
              />

              <FormInput
                label="Absent Days"
                name="absent_days"
                type="number"
                value={formData.absent_days}
                onChange={handleChange}
              />

              <FormInput
                label="Leave Days"
                name="leave_days"
                type="number"
                value={formData.leave_days}
                onChange={handleChange}
              />

              <FormInput
                label="Overtime Hours"
                name="overtime_hours"
                type="number"
                value={formData.overtime_hours}
                onChange={handleChange}
              />

              <FormInput
                label="Overtime Amount"
                name="overtime_amount"
                type="number"
                value={formData.overtime_amount}
                onChange={handleChange}
              />

              <FormInput
                label="Bonus"
                name="bonus"
                type="number"
                value={formData.bonus}
                onChange={handleChange}
              />

              <FormInput
                label="Deduction"
                name="deduction"
                type="number"
                value={formData.deduction}
                onChange={handleChange}
              />

              <FormSelect
                label="Payment Status"
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
              >
                <option value="Pending">
                  Pending
                </option>

                <option value="Paid">
                  Paid
                </option>
              </FormSelect>

              <FormInput
                label="Payment Date"
                name="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={handleChange}
              />

            </div>

            <div className="mt-4">

              <label className="block text-sm text-gray-300 mb-2">
                Remarks
              </label>

              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="3"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500 resize-none"
              />

            </div>

            <div className="flex justify-end gap-3 mt-6">

              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
              >
                {submitting
                  ? 'Saving...'
                  : editingId
                    ? 'Update Payroll'
                    : 'Create Payroll'}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* FILTERS */}

      <div className="p-5 mb-6 rounded-xl border border-gray-700 bg-gray-800">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search employee..."
            className="p-3 bg-gray-900 border border-gray-700 rounded-lg outline-none focus:border-blue-500"
          />

          <select
            value={monthFilter}
            onChange={(e) =>
              setMonthFilter(e.target.value)
            }
            className="p-3 bg-gray-900 border border-gray-700 rounded-lg"
          >
            <option value="All">
              All Months
            </option>

            {months.map((month, index) => (
              <option
                key={month}
                value={index + 1}
              >
                {month}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="p-3 bg-gray-900 border border-gray-700 rounded-lg"
          >
            <option value="All">
              All Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Paid">
              Paid
            </option>
          </select>

        </div>

      </div>

      {/* TABLE */}

      <div className="rounded-xl border border-gray-700 overflow-hidden">

        <div className="p-5 bg-gray-800 border-b border-gray-700">

          <h2 className="font-semibold text-white">
            Payroll Records
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            {filteredPayrolls.length} record(s)
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-800">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Period</th>
                <th className="p-4">Present</th>
                <th className="p-4">Gross</th>
                <th className="p-4">Net Salary</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="7"
                    className="p-10 text-center text-gray-400"
                  >
                    Loading payroll...
                  </td>
                </tr>

              ) : filteredPayrolls.length === 0 ? (

                <tr>
                  <td
                    colSpan="7"
                    className="p-10 text-center text-gray-400"
                  >
                    No payroll records found.
                  </td>
                </tr>

              ) : (

                filteredPayrolls.map((payroll) => (

                  <tr
                    key={payroll.id}
                    className="border-t border-gray-700 hover:bg-gray-800/50"
                  >

                    <td className="p-4">
                      <p className="font-medium text-white">
                        {payroll.employee_name}
                      </p>

                      <p className="text-xs text-gray-500">
                        Employee #{payroll.employee_id}
                      </p>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {months[payroll.month - 1]}{' '}
                      {payroll.year}
                    </td>

                    <td className="p-4">
                      {payroll.present_days}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {formatCurrency(
                        payroll.gross_salary
                      )}
                    </td>

                    <td className="p-4 whitespace-nowrap font-semibold text-white">
                      {formatCurrency(
                        payroll.net_salary
                      )}
                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 text-xs border rounded-full ${statusClass(
                          payroll.payment_status
                        )}`}
                      >
                        {payroll.payment_status}
                      </span>

                    </td>

                    <td className="p-4">

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            handleEdit(payroll)
                          }
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(payroll)
                          }
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white"
                        >
                          Delete
                        </button>

                      </div>

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


// ============================================================
// SMALL COMPONENTS
// ============================================================

function StatCard({
  title,
  value,
  className = 'text-white',
}) {
  return (
    <div className="p-5 rounded-xl border border-gray-700 bg-gray-800">

      <p className="text-sm text-gray-400">
        {title}
      </p>

      <p
        className={`text-2xl font-bold mt-2 ${className}`}
      >
        {value}
      </p>

    </div>
  )
}


function FormInput({
  label,
  ...props
}) {
  return (
    <div>

      <label className="block text-sm text-gray-300 mb-2">
        {label}
      </label>

      <input
        {...props}
        className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500 disabled:opacity-50"
      />

    </div>
  )
}


function FormSelect({
  label,
  children,
  ...props
}) {
  return (
    <div>

      <label className="block text-sm text-gray-300 mb-2">
        {label}
      </label>

      <select
        {...props}
        className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none focus:border-blue-500 disabled:opacity-50"
      >
        {children}
      </select>

    </div>
  )
}