import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/landing/Landing'
import Login from './pages/login/Login'
import Register from './pages/register/Register'
import EnterpriseRegister from './pages/register/EnterpriseRegister'
import Dashboard from './pages/Dashboard'
import ChatPage from './pages/ChatPage'
import AppointmentsPage from './pages/AppointmentsPage'
import NotFound from './pages/NotFound'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppointmentProvider } from './context/AppointmentContext'

// Admin Pages
import GeneralStatistics from './pages/admin/GeneralStatistics'
import UserFeedback from './pages/admin/UserFeedback'
import TechnicianFeedback from './pages/admin/TechnicianFeedback'
import ImprovementData from './pages/admin/ImprovementData'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/welcome" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/enterprise" element={<EnterpriseRegister />} />
      
      {/* Protected User Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <GeneralStatistics />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/user-feedback"
        element={
          <AdminRoute>
            <UserFeedback />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/technician-feedback"
        element={
          <AdminRoute>
            <TechnicianFeedback />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/improvement-data"
        element={
          <AdminRoute>
            <ImprovementData />
          </AdminRoute>
        }
      />
      
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        }
      />
      
      {/* 404 Page - Catch all unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppointmentProvider>
        <AppRoutes />
      </AppointmentProvider>
    </AuthProvider>
  )
}

export default App
