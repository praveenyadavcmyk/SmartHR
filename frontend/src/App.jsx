import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import {
  AuthProvider,
  useAuth,
} from './hooks/useAuth.jsx'

import MainLayout from './layouts/MainLayout.jsx'

import LoginPage from './pages/auth/LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotFound from './pages/NotFound.jsx'

// Employee pages
import EmployeesPage from './pages/employees/EmployeesPage.jsx'

// Attendance pages
import AttendancePage from './pages/attendance/AttendancePage.jsx'
import EmployeeAttendance from './pages/attendance/EmployeeAttendance.jsx'

// Leave pages
import AdminLeavePage from './pages/leave/AdminLeavePage.jsx'
import EmployeeLeavePage from './pages/leave/EmployeeLeavePage.jsx'

// Payroll pages
import AdminPayrollPage from './pages/payroll/AdminPayrollPage.jsx'

// Department pages
import DepartmentsPage from './pages/departments/DepartmentsPage.jsx'

// AI Analytics pages
import AIAnalyticsPage from './pages/ai/AIAnalyticsPage.jsx'

// Profile page
import ProfilePage from './pages/ProfilePage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'


// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}


// ============================================================
// ATTENDANCE ROUTE
// Admin     -> AttendancePage
// Employee  -> EmployeeAttendance
// ============================================================

function AttendanceRoute() {
  const { role } = useAuth()

  if (role === 'admin') {
    return <AttendancePage />
  }

  if (role === 'employee') {
    return <EmployeeAttendance />
  }

  return <Navigate to="/" replace />
}


// ============================================================
// LEAVE ROUTE
// Admin     -> AdminLeavePage
// Employee  -> EmployeeLeavePage
// ============================================================

function LeaveRoute() {
  const { role } = useAuth()

  if (role === 'admin') {
    return <AdminLeavePage />
  }

  if (role === 'employee') {
    return <EmployeeLeavePage />
  }

  return <Navigate to="/" replace />
}


// ============================================================
// EMPLOYEE MANAGEMENT ROUTE
// ADMIN ONLY
// ============================================================

function EmployeesRoute() {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <EmployeesPage />
}


// ============================================================
// PAYROLL ROUTE
// ADMIN ONLY
// ============================================================

function PayrollRoute() {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <AdminPayrollPage />
}


// ============================================================
// DEPARTMENT ROUTE
// ADMIN ONLY
// ============================================================

function DepartmentsRoute() {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <DepartmentsPage />
}


// ============================================================
// AI ANALYTICS ROUTE
// ADMIN ONLY
// ============================================================

function AIAnalyticsRoute() {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <AIAnalyticsPage />
}


// ============================================================
// APP ROUTES
// ============================================================

function AppRoutes() {
  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={<LoginPage />}
      />


      {/* PROTECTED APPLICATION */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >

        {/* DASHBOARD */}
        <Route
          index
          element={<Dashboard />}
        />


        {/* EMPLOYEE MANAGEMENT */}
        <Route
          path="employees"
          element={<EmployeesRoute />}
        />


        {/* ATTENDANCE */}
        <Route
          path="attendance"
          element={<AttendanceRoute />}
        />


        {/* LEAVE */}
        <Route
          path="leave"
          element={<LeaveRoute />}
        />


        {/* PAYROLL */}
        <Route
          path="payroll"
          element={<PayrollRoute />}
        />


        {/* DEPARTMENTS */}
        <Route
          path="departments"
          element={<DepartmentsRoute />}
        />


        {/* AI ANALYTICS */}
        <Route
          path="ai-analytics"
          element={<AIAnalyticsRoute />}
        />


        {/* PROFILE */}
        <Route
          path="profile"
          element={<ProfilePage />}
        />


        {/* SETTINGS */}
        <Route
          path="settings"
          element={<SettingsPage />}
        />

      </Route>


      {/* 404 */}
      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  )
}


// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}