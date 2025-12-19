import { createContext, useState, useContext, useCallback } from 'react';
import api from '../services/api';

// 1. Create the context
const AppointmentContext = createContext();

// 2. Create a custom hook for easy consumption
export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

// 3. Create the Provider component
export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState([]);
  const [unassignedAppointments, setUnassignedAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]); // State for technicians
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/appointments/`);
      setAppointments(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      setError(errorMessage);
      console.error(`Failed to fetch appointments:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnassignedAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/appointments/?unassigned=true`);
      setUnassignedAppointments(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      setError(errorMessage);
      console.error(`Failed to fetch unassigned appointments:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  const selfAssignAppointment = useCallback(async (appointmentId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/appointments/${appointmentId}/self-assign`);
      // Add to main appointments list and remove from unassigned list
      setAppointments(prev => [response.data, ...prev]);
      setUnassignedAppointments(prev => prev.filter(app => app.id !== appointmentId));
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred.';
      setError(errorMessage);
      console.error('Failed to self-assign appointment:', err);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const getUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred while fetching users.';
      setError(errorMessage);
      console.error('Failed to fetch users:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/technicians/');
      setTechnicians(response.data);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred while fetching technicians.';
      setError(errorMessage);
      console.error('Failed to fetch technicians:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailableTechnicians = useCallback(async (date) => {
    setLoading(true);
    try {
      const response = await api.get(`/technicians/?date=${date}`);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred while fetching technicians.';
      console.error('Failed to fetch available technicians:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppointment = useCallback(async (appointmentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/appointments/', appointmentData);
      setAppointments(prev => [response.data, ...prev]);
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred.';
      setError(errorMessage);
      console.error('Failed to create appointment:', err);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const rescheduleAppointment = useCallback(async (appointmentId, rescheduleData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch(`/appointments/${appointmentId}/reschedule`, rescheduleData);
      setAppointments(prev => prev.map(app => app.id === appointmentId ? response.data : app));
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred.';
      setError(errorMessage);
      console.error('Failed to reschedule appointment:', err);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteAppointment = useCallback(async (appointmentId) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/appointments/${appointmentId}`);
      setAppointments(prev => prev.filter(app => app.id !== appointmentId));
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred.';
      setError(errorMessage);
      console.error('Failed to delete appointment:', err);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const updateAppointmentStatus = useCallback(async (appointmentId, statusData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch(`/appointments/${appointmentId}/status`, statusData);
      setAppointments(prev => prev.map(app => app.id === appointmentId ? response.data : app));
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred.';
      setError(errorMessage);
      console.error('Failed to update appointment status:', err);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const value = {
    appointments,
    unassignedAppointments,
    users,
    technicians, // Expose technicians
    loading,
    error,
    loadAppointments,
    loadUnassignedAppointments,
    selfAssignAppointment,
    getUsers,
    getUsers,
    getTechnicians, // Expose getTechnicians
    getAvailableTechnicians,
    createAppointment,
    rescheduleAppointment,
    deleteAppointment,
    updateAppointmentStatus,
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}