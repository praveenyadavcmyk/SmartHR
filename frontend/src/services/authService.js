import api from './api'
import {
  TOKEN_KEY,
  REFRESH_KEY,
  USER_KEY,
  ROLE_KEY,
} from '../utils/constants'

export const authService = {

  // =========================
  // ADMIN LOGIN
  // =========================
  adminLogin: async (email, password) => {
    const res = await api.post('/auth/admin/login', {
      email,
      password,
    })

    const {
      access_token,
      refresh_token,
      admin,
    } = res.data

    localStorage.setItem(TOKEN_KEY, access_token)
    localStorage.setItem(REFRESH_KEY, refresh_token)
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(admin)
    )
    localStorage.setItem(ROLE_KEY, 'admin')

    return res.data
  },

  // =========================
  // EMPLOYEE LOGIN
  // =========================
  employeeLogin: async (email, password) => {
    const res = await api.post('/auth/employee/login', {
      email,
      password,
    })

    const {
      access_token,
      refresh_token,
      employee,
    } = res.data

    localStorage.setItem(TOKEN_KEY, access_token)
    localStorage.setItem(REFRESH_KEY, refresh_token)
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(employee)
    )
    localStorage.setItem(ROLE_KEY, 'employee')

    return res.data
  },

  // =========================
  // LOGOUT
  // =========================
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ROLE_KEY)

    window.location.href = '/login'
  },

  // =========================
  // CURRENT USER
  // =========================
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem(USER_KEY)

      return user
        ? JSON.parse(user)
        : null
    } catch {
      return null
    }
  },

  // =========================
  // CURRENT ROLE
  // =========================
  getRole: () => {
    return localStorage.getItem(ROLE_KEY)
  },

  // =========================
  // CHECK LOGIN
  // =========================
  isLoggedIn: () => {
    return !!localStorage.getItem(TOKEN_KEY)
  },
}