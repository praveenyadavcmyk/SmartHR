import {
  createContext,
  useContext,
  useState,
} from 'react'

import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  // =========================
  // AUTH STATE
  // =========================

  const [user, setUser] = useState(
    authService.getCurrentUser()
  )

  const [role, setRole] = useState(
    authService.getRole()
  )

  // =========================
  // LOGIN
  // =========================

  const login = async (
    email,
    password,
    loginRole = 'admin'
  ) => {

    // ADMIN LOGIN
    if (loginRole === 'admin') {

      const data = await authService.adminLogin(
        email,
        password
      )

      setUser(data.admin)
      setRole('admin')

      return data
    }

    // EMPLOYEE LOGIN
    if (loginRole === 'employee') {

      const data = await authService.employeeLogin(
        email,
        password
      )

      setUser(data.employee)
      setRole('employee')

      return data
    }

    throw new Error('Invalid login role.')
  }

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {

    authService.logout()

    setUser(null)
    setRole(null)
  }

  // =========================
  // AUTH VALUES
  // =========================

  const isLoggedIn = !!user

  const isAdmin =
    isLoggedIn && role === 'admin'

  const isEmployee =
    isLoggedIn && role === 'employee'

  return (
    <AuthContext.Provider
      value={{
        user,
        role,

        login,
        logout,

        isLoggedIn,
        isAdmin,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// =========================
// USE AUTH
// =========================

export function useAuth() {

  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.'
    )
  }

  return context
}