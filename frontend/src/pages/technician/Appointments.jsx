import { useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import AppointmentList from '../../components/appointments/AppointmentList';
import { useAppointments } from '../../context/AppointmentContext';

function TechnicianAppointments() {
  const { appointments, loading, error, loadAppointments } = useAppointments();
  
  useEffect(() => {
    // Load appointments for the 'technician' user type
    loadAppointments('technician');
  }, [loadAppointments]);

  return (
    <DashboardLayout title="Bekleyen Randevular">
      {loading && <p>Randevular Yükleniyor...</p>}
      {error && <p style={{ color: 'red' }}>Hata: {error}</p>}
      {!loading && !error && (
        <AppointmentList appointments={appointments} userType="technician" />
      )}
    </DashboardLayout>
  );
}

export default TechnicianAppointments;