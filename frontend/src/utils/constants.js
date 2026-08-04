// Base URL for all API calls
export const API_BASE_URL = 'http://localhost:5000/api'

// Local storage keys
export const TOKEN_KEY    = 'access_token'
export const REFRESH_KEY  = 'refresh_token'
export const USER_KEY     = 'user'
export const ROLE_KEY     = 'role'

// Leave types
export const LEAVE_TYPES = [
  'Sick Leave',
  'Casual Leave',
  'Earned Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Emergency Leave',
]

// Employment types
export const EMPLOYMENT_TYPES = [
  'Full-Time',
  'Part-Time',
  'Contract',
  'Internship',
]

// Status colors for badges
export const STATUS_BADGE = {
  Present:  'badge-green',
  Late:     'badge-yellow',
  Absent:   'badge-red',
  Approved: 'badge-green',
  Rejected: 'badge-red',
  Pending:  'badge-yellow',
  Paid:     'badge-green',
  Unpaid:   'badge-red',
  Active:   'badge-green',
  Inactive: 'badge-gray',
}
