import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ChatPage from "@/pages/ChatPage";
import Login from "@/pages/login/Login";
import Register from "@/pages/register/Register";
import Dashboard from "@/pages/Dashboard";
import AppointmentsPage from "@/pages/AppointmentsPage";

// Admin Pages
import GeneralStatistics from "@/pages/admin/GeneralStatistics";
import UserFeedback from "@/pages/admin/UserFeedback";
import TechnicianFeedback from "@/pages/admin/TechnicianFeedback";
import ImprovementData from "@/pages/admin/ImprovementData";
import TechnicianVacations from "@/pages/technician/TechnicianVacations";

// Protected Route wrapper for admin pages
function AdminRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Protected Route wrapper for authenticated users
function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected User Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/technician/vacations" element={
          <ProtectedRoute>
            <TechnicianVacations />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <GeneralStatistics />
          </AdminRoute>
        } />
        <Route path="/admin/user-feedback" element={
          <AdminRoute>
            <UserFeedback />
          </AdminRoute>
        } />
        <Route path="/admin/technician-feedback" element={
          <AdminRoute>
            <TechnicianFeedback />
          </AdminRoute>
        } />
        <Route path="/admin/improvement-data" element={
          <AdminRoute>
            <ImprovementData />
          </AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
