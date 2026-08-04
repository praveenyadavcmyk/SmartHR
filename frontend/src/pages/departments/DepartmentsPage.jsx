import { useEffect, useMemo, useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

const initialFormData = {
  department_name: '',
  description: '',
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingDepartment, setEditingDepartment] =
    useState(null)

  const [formData, setFormData] =
    useState(initialFormData)

  // ============================================================
  // GET TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem('access_token')
  }

  // ============================================================
  // FETCH DEPARTMENTS
  // ============================================================

  const fetchDepartments = async () => {
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
        `${API_BASE_URL}/departments/`,
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
            'Failed to fetch departments.'
        )
      }

      setDepartments(result.data || [])
    } catch (err) {
      setError(err.message)
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchDepartments()
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

  const handleOpenCreate = () => {
    setEditingDepartment(null)
    setFormData(initialFormData)

    setError('')
    setSuccess('')

    setShowForm(true)
  }

  // ============================================================
  // OPEN EDIT FORM
  // ============================================================

  const handleEdit = (department) => {
    setEditingDepartment(department)

    setFormData({
      department_name:
        department.department_name || '',
      description:
        department.description || '',
    })

    setError('')
    setSuccess('')

    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // ============================================================
  // CANCEL FORM
  // ============================================================

  const handleCancel = () => {
    setShowForm(false)
    setEditingDepartment(null)
    setFormData(initialFormData)
    setError('')
  }

  // ============================================================
  // CREATE / UPDATE DEPARTMENT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setError('')
      setSuccess('')

      const departmentName =
        formData.department_name.trim()

      if (!departmentName) {
        throw new Error(
          'Department name is required.'
        )
      }

      const token = getToken()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      setSubmitting(true)

      const payload = {
        department_name: departmentName,
        description:
          formData.description.trim(),
      }

      const isEditing =
        Boolean(editingDepartment)

      const url = isEditing
        ? `${API_BASE_URL}/departments/${editingDepartment.id}`
        : `${API_BASE_URL}/departments/`

      const method = isEditing
        ? 'PUT'
        : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Failed to save department.'
        )
      }

      setSuccess(
        isEditing
          ? 'Department updated successfully.'
          : 'Department created successfully.'
      )

      setShowForm(false)
      setEditingDepartment(null)
      setFormData(initialFormData)

      await fetchDepartments()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // DELETE DEPARTMENT
  // ============================================================

  const handleDelete = async (department) => {
    if (
      Number(department.employee_count) > 0
    ) {
      setError(
        `Cannot delete "${department.department_name}" because ${department.employee_count} active employee(s) are assigned to it.`
      )

      setSuccess('')
      return
    }

    const confirmed = window.confirm(
      `Delete department "${department.department_name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const token = getToken()

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        )
      }

      const response = await fetch(
        `${API_BASE_URL}/departments/${department.id}`,
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
          result.message ||
            result.error ||
            'Failed to delete department.'
        )
      }

      setSuccess(
        result.message ||
          'Department deleted successfully.'
      )

      await fetchDepartments()
    } catch (err) {
      setError(err.message)
    }
  }

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredDepartments = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase()

    if (!searchValue) {
      return departments
    }

    return departments.filter(
      (department) => {
        const name = String(
          department.department_name || ''
        ).toLowerCase()

        const description = String(
          department.description || ''
        ).toLowerCase()

        return (
          name.includes(searchValue) ||
          description.includes(searchValue)
        )
      }
    )
  }, [departments, search])

  // ============================================================
  // STATISTICS
  // ============================================================

  const stats = useMemo(() => {
    const totalEmployees =
      departments.reduce(
        (total, department) =>
          total +
          Number(
            department.employee_count || 0
          ),
        0
      )

    const emptyDepartments =
      departments.filter(
        (department) =>
          Number(
            department.employee_count || 0
          ) === 0
      ).length

    const activeDepartments =
      departments.filter(
        (department) =>
          Number(
            department.employee_count || 0
          ) > 0
      ).length

    return {
      total: departments.length,
      totalEmployees,
      activeDepartments,
      emptyDepartments,
    }
  }, [departments])

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (value) => {
    if (!value) {
      return '-'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="p-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-white">
            Departments
          </h1>

          <p className="mt-1 text-gray-400">
            Manage company departments and
            employee distribution
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Department
        </button>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {success && (
        <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-400">
          {success}
        </div>
      )}

      {/* =====================================================
          CREATE / EDIT FORM
      ====================================================== */}

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-700 bg-gray-800 p-6">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold text-white">
                {editingDepartment
                  ? 'Edit Department'
                  : 'Add Department'}
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                {editingDepartment
                  ? 'Update department information'
                  : 'Create a new company department'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="text-xl text-gray-400 hover:text-white"
            >
              ✕
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Department Name *
                </label>

                <input
                  type="text"
                  name="department_name"
                  value={
                    formData.department_name
                  }
                  onChange={handleChange}
                  placeholder="e.g. Information Technology"
                  maxLength="100"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Description
                </label>

                <input
                  type="text"
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  placeholder="Short department description"
                  maxLength="255"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting
                  ? 'Saving...'
                  : editingDepartment
                    ? 'Update Department'
                    : 'Create Department'}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL */}

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">
            Total Departments
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {stats.total}
          </p>
        </div>

        {/* EMPLOYEES */}

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">
            Assigned Employees
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-400">
            {stats.totalEmployees}
          </p>
        </div>

        {/* ACTIVE */}

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">
            Active Departments
          </p>

          <p className="mt-2 text-3xl font-bold text-green-400">
            {stats.activeDepartments}
          </p>
        </div>

        {/* EMPTY */}

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">
            Empty Departments
          </p>

          <p className="mt-2 text-3xl font-bold text-yellow-400">
            {stats.emptyDepartments}
          </p>
        </div>

      </div>

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div className="mb-6 rounded-xl border border-gray-700 bg-gray-800 p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div className="w-full sm:max-w-md">

            <label className="mb-2 block text-sm text-gray-300">
              Search Departments
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by name or description..."
              className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none focus:border-blue-500"
            />

          </div>

          <button
            type="button"
            onClick={fetchDepartments}
            disabled={loading}
            className="rounded-lg border border-gray-600 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
          >
            {loading
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

        </div>

      </div>

      {/* =====================================================
          DEPARTMENT TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-700">

        <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-5 py-4">

          <div>
            <h2 className="font-semibold text-white">
              Department List
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              {filteredDepartments.length}{' '}
              department(s)
            </p>
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-800">
              <tr>

                <th className="p-4 text-sm text-gray-300">
                  Department
                </th>

                <th className="p-4 text-sm text-gray-300">
                  Description
                </th>

                <th className="p-4 text-sm text-gray-300">
                  Employees
                </th>

                <th className="p-4 text-sm text-gray-300">
                  Created
                </th>

                <th className="p-4 text-sm text-gray-300">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="5"
                    className="p-10 text-center text-gray-400"
                  >
                    Loading departments...
                  </td>
                </tr>

              ) : filteredDepartments.length === 0 ? (

                <tr>
                  <td
                    colSpan="5"
                    className="p-10 text-center"
                  >
                    <p className="font-medium text-gray-300">
                      No departments found.
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Create a department using
                      the Add Department button.
                    </p>
                  </td>
                </tr>

              ) : (

                filteredDepartments.map(
                  (department) => (

                    <tr
                      key={department.id}
                      className="border-t border-gray-700 hover:bg-gray-800/50"
                    >

                      {/* NAME */}

                      <td className="p-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 font-bold text-blue-400">
                            {department.department_name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              'D'}
                          </div>

                          <div>
                            <p className="font-medium text-white">
                              {
                                department.department_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Department #
                              {department.id}
                            </p>
                          </div>

                        </div>

                      </td>

                      {/* DESCRIPTION */}

                      <td className="max-w-[300px] p-4 text-gray-300">
                        {department.description ||
                          'No description'}
                      </td>

                      {/* EMPLOYEE COUNT */}

                      <td className="p-4">

                        <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                          {department.employee_count ||
                            0}{' '}
                          employee(s)
                        </span>

                      </td>

                      {/* CREATED */}

                      <td className="whitespace-nowrap p-4 text-gray-400">
                        {formatDate(
                          department.created_at
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="p-4">

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                department
                              )
                            }
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                department
                              )
                            }
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                          >
                            Delete
                          </button>

                        </div>

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