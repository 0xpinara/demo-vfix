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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAppointments = useCallback(async (userType) => {
    try {
      setLoading(true);
      setError(null);
      // Use the central API service directly, consistent with AuthContext
      const response = await api.get(`/appointments/${userType}`);
      setAppointments(response.data);
    } catch (err) {
      // Better error handling to display backend messages
      const errorMessage = err.response?.data?.detail || err.message;
      setError(errorMessage);
      console.error(`Failed to fetch ${userType} appointments:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppointment = useCallback(async (appointmentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/appointments/', appointmentData);
      // Add new appointment to the start of the list to be immediately visible
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

  const value = {
    appointments,
    loading,
    error,
    loadAppointments,
    createAppointment,
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}