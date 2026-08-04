import axios from 'axios'
import { API_BASE_URL, TOKEN_KEY, REFRESH_KEY } from '../utils/constants'

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// ── Request Interceptor ───────────────────────────────────────
// Automatically attach the JWT access token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor ──────────────────────────────────────
// If a 401 is returned, try refreshing the token automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // If 401 and not already retried and not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes('/auth/refresh')
    ) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem(REFRESH_KEY)
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        })
        const newToken = res.data.access_token
        localStorage.setItem(TOKEN_KEY, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        // Refresh failed — clear storage and redirect to login
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
