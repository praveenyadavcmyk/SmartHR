import { useEffect, useState } from 'react'

const initialFormData = {
  employee_id: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  gender: '',
  department_id: '',
  designation: '',
  employment_type: '',
  daily_salary: '',
  monthly_salary: '',
  joining_date: '',
  address: '',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(initialFormData)

  // null = Add mode
  // employee object = Edit mode
  const [editingEmployee, setEditingEmployee] = useState(null)

  // =========================
  // FETCH ALL EMPLOYEES
  // =========================
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('access_token')

      if (!token) {
        throw new Error('Login session expired. Please login again.')
      }

      const response = await fetch(
        'http://127.0.0.1:5000/api/employees/',
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
            'Failed to fetch employees'
        )
      }

      setEmployees(result.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // FETCH ALL DEPARTMENTS
  // =========================
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('access_token')

      if (!token) {
        throw new Error('Login session expired. Please login again.')
      }

      const response = await fetch(
        'http://127.0.0.1:5000/api/departments/',
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
            'Failed to fetch departments'
        )
      }

      setDepartments(result.data || [])
    } catch (err) {
      setError(err.message)
    }
  }

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
  }, [])

  // =========================
  // HANDLE INPUT
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // =========================
  // OPEN ADD FORM
  // =========================
  const handleOpenAddForm = () => {
    setEditingEmployee(null)
    setFormData(initialFormData)
    setError('')
    setShowAddForm(true)
  }

  // =========================
  // OPEN EDIT FORM
  // =========================
  const handleEdit = (employee) => {
    setEditingEmployee(employee)

    setFormData({
      employee_id: employee.employee_id || '',
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      password: '',
      phone: employee.phone || '',
      gender: employee.gender || '',

      department_id: employee.department_id
        ? String(employee.department_id)
        : '',

      designation: employee.designation || '',
      employment_type: employee.employment_type || '',

      daily_salary:
        employee.daily_salary !== null &&
        employee.daily_salary !== undefined
          ? String(employee.daily_salary)
          : '',

      monthly_salary:
        employee.monthly_salary !== null &&
        employee.monthly_salary !== undefined
          ? String(employee.monthly_salary)
          : '',

      joining_date: employee.joining_date
        ? String(employee.joining_date).substring(0, 10)
        : '',

      address: employee.address || '',
    })

    setError('')
    setShowAddForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =========================
  // VALIDATE FORM
  // =========================
  const validateForm = () => {
    if (!formData.employee_id.trim()) {
      throw new Error('Employee ID is required.')
    }

    if (!formData.first_name.trim()) {
      throw new Error('First name is required.')
    }

    if (!formData.last_name.trim()) {
      throw new Error('Last name is required.')
    }

    if (!formData.email.trim()) {
      throw new Error('Email is required.')
    }

    if (!editingEmployee && !formData.password.trim()) {
      throw new Error('Password is required.')
    }

    if (!formData.department_id) {
      throw new Error('Department is required.')
    }
  }

  // =========================
  // CREATE PAYLOAD
  // =========================
  const createPayload = () => {
    const payload = {
      ...formData,

      department_id: Number(formData.department_id),

      daily_salary: formData.daily_salary
        ? Number(formData.daily_salary)
        : 0,

      monthly_salary: formData.monthly_salary
        ? Number(formData.monthly_salary)
        : 0,
    }

    if (editingEmployee && !formData.password.trim()) {
      delete payload.password
    }

    return payload
  }

  // =========================
  // ADD EMPLOYEE
  // =========================
  const handleAddEmployee = async () => {
    try {
      setError('')
      validateForm()

      const token = localStorage.getItem('access_token')

      if (!token) {
        throw new Error('Login session expired. Please login again.')
      }

      setSubmitting(true)

      const payload = createPayload()

      const response = await fetch(
        'http://127.0.0.1:5000/api/employees/',
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
            'Failed to add employee'
        )
      }

      await fetchEmployees()

      setFormData(initialFormData)
      setEditingEmployee(null)
      setShowAddForm(false)

      alert('Employee added successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // =========================
  // UPDATE EMPLOYEE
  // =========================
  const handleUpdateEmployee = async () => {
    try {
      setError('')
      validateForm()

      if (!editingEmployee) {
        throw new Error('No employee selected for editing.')
      }

      const token = localStorage.getItem('access_token')

      if (!token) {
        throw new Error('Login session expired. Please login again.')
      }

      setSubmitting(true)

      const payload = createPayload()

      const response = await fetch(
        `http://127.0.0.1:5000/api/employees/${editingEmployee.id}`,
        {
          method: 'PUT',
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
            'Failed to update employee'
        )
      }

      await fetchEmployees()

      setFormData(initialFormData)
      setEditingEmployee(null)
      setShowAddForm(false)

      alert('Employee updated successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // =========================
  // DELETE EMPLOYEE
  // =========================
  const handleDelete = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      const token = localStorage.getItem('access_token')

      if (!token) {
        throw new Error('Login session expired. Please login again.')
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/employees/${employee.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      let result = {}

      try {
        result = await response.json()
      } catch {
        result = {}
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Failed to delete employee'
        )
      }

      // If currently editing the deleted employee,
      // close and clear the form.
      if (editingEmployee?.id === employee.id) {
        setEditingEmployee(null)
        setFormData(initialFormData)
        setShowAddForm(false)
      }

      await fetchEmployees()

      alert('Employee deleted successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  // =========================
  // SUBMIT ADD OR EDIT
  // =========================
  const handleSubmit = () => {
    if (editingEmployee) {
      handleUpdateEmployee()
    } else {
      handleAddEmployee()
    }
  }

  // =========================
  // CANCEL
  // =========================
  const handleCancel = () => {
    setShowAddForm(false)
    setEditingEmployee(null)
    setFormData(initialFormData)
    setError('')
  }

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="p-6">
        <p>Loading employees...</p>
      </div>
    )
  }

  return (
    <div className="p-6">

      {/* ================= HEADING ================= */}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Employees
          </h1>

          <p className="text-gray-400 mt-1">
            Manage all employees
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddForm}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          + Add Employee
        </button>
      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 text-red-400">
          {error}
        </div>
      )}

      {/* ================= ADD / EDIT FORM ================= */}

      {showAddForm && (
        <div className="mb-6 p-6 rounded-xl border border-gray-700 bg-gray-800">

          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {editingEmployee
                  ? 'Edit Employee'
                  : 'Add New Employee'}
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                {editingEmployee
                  ? 'Update employee information'
                  : 'Enter employee information'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* EMPLOYEE ID */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Employee ID *
              </label>

              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                placeholder="EMP007"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              />
            </div>

            {/* FIRST NAME */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                First Name *
              </label>

              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              />
            </div>

            {/* LAST NAME */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Last Name *
              </label>

              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              />
            </div>

            {/* EMAIL */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Email *
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="employee@example.com"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Password {editingEmployee ? '' : '*'}
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  editingEmployee
                    ? 'Leave blank to keep current password'
                    : 'Enter password'
                }
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              />
            </div>

            {/* PHONE */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              />
            </div>

            {/* GENDER */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Gender
              </label>

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* DEPARTMENT */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Department *
              </label>

              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              >
                <option value="">
                  Select department
                </option>

                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.department_name}
                  </option>
                ))}
              </select>
            </div>

            {/* DESIGNATION */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Designation
              </label>

              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Software Engineer"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              />
            </div>

            {/* EMPLOYMENT TYPE */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Employment Type
              </label>

              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              >
                <option value="">Select type</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            {/* DAILY SALARY */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Daily Salary
              </label>

              <input
                type="number"
                name="daily_salary"
                value={formData.daily_salary}
                onChange={handleChange}
                placeholder="Example: 1200"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              />
            </div>

            {/* MONTHLY SALARY */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Monthly Salary
              </label>

              <input
                type="number"
                name="monthly_salary"
                value={formData.monthly_salary}
                onChange={handleChange}
                placeholder="Example: 30000"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              />
            </div>

            {/* JOINING DATE */}

            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Joining Date
              </label>

              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
              />
            </div>
          </div>

          {/* ADDRESS */}

          <div className="mt-4">
            <label className="block mb-2 text-sm text-gray-300">
              Address
            </label>

            <textarea
              rows="3"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Employee address"
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 outline-none"
            />
          </div>
₹
          {/* BUTTONS */}

          <div className="flex justify-end gap-3 mt-6">

            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {submitting
                ? editingEmployee
                  ? 'Updating...'
                  : 'Adding...'
                : editingEmployee
                  ? 'Update Employee'
                  : 'Add Employee'}
            </button>

          </div>
        </div>
      )}

      {/* ================= EMPLOYEE TABLE ================= */}

      <div className="overflow-x-auto rounded-xl border border-gray-700">

        <table className="w-full text-left">

          <thead className="bg-gray-800">
            <tr>
              <th className="p-4">Employee ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Department</th>
              <th className="p-4">Designation</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>

            {employees.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="p-6 text-center text-gray-400"
                >
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (

                <tr
                  key={employee.id}
                  className="border-t border-gray-700"
                >

                  <td className="p-4">
                    {employee.employee_id}
                  </td>

                  <td className="p-4">
                    {employee.first_name}{' '}
                    {employee.last_name}
                  </td>

                  <td className="p-4">
                    {employee.email}
                  </td>

                  <td className="p-4">
                    {employee.department ||
                      employee.department_name ||
                      '-'}
                  </td>

                  <td className="p-4">
                    {employee.designation || '-'}
                  </td>

                  <td className="p-4">
                    {employee.employment_type || '-'}
                  </td>

                  <td className="p-4">
                    {employee.is_active ? (
                      <span className="text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-400">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* ACTION BUTTONS */}

                  <td className="p-4">

                    <div className="flex gap-2">

                      <button
                        type="button"
                        onClick={() => handleEdit(employee)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(employee)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg"
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
  )
}