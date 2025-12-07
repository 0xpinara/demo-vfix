import { useEffect } from 'react';
import AppointmentList from '../../components/appointments/AppointmentList';
import { useAppointments } from '../../context/AppointmentContext';

function TechnicianAppointments() {
  const { appointments, loading, error, loadAppointments } = useAppointments();
  
  useEffect(() => {
    // Load appointments for the 'technician' user type
    loadAppointments('technician');
  }, [loadAppointments]);

  return (
    <>
      {loading && <p>Randevular Yükleniyor...</p>}
      {error && <p style={{ color: 'red' }}>Hata: {error}</p>}
      {!loading && !error && (
        <AppointmentList appointments={appointments} userType="technician" />
      )}
    </>
  );
}

export default TechnicianAppointments;