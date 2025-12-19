import { useEffect } from 'react';
import { useAppointments } from '../../context/AppointmentContext';
import AppointmentCard from './AppointmentCard';
import './Appointments.css';

function UnassignedAppointments() {
  const { unassignedAppointments, loadUnassignedAppointments, loading, error } = useAppointments();

  useEffect(() => {
    loadUnassignedAppointments();
  }, [loadUnassignedAppointments]);

  return (
    <div className="appointments-container">
      <h2 className="page-title">Bekleyen Randevular</h2>
      {loading && <p>Randevular Yükleniyor...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <div className="appointments-grid">
        {unassignedAppointments.length > 0 ? (
          unassignedAppointments.map(app => (
            <AppointmentCard key={app.id} appointment={app} userType="technician" />
          ))
        ) : (
          <p className="no-appointments">Bekleyen Randevu Yok.</p>
        )}
      </div>
    </div>
  );
}

export default UnassignedAppointments;
