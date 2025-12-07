import { useEffect, useState } from 'react';
import AppointmentViewToggle from '../../components/appointments/AppointmentViewToggle';
import { useAppointments } from '../../context/AppointmentContext';
import CreateAppointmentModal from '../../components/appointments/CreateAppointmentModal';
import './Appointments.css';

function TechnicianAppointments() {
  const { appointments, loading, error, loadAppointments } = useAppointments();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  return (
    <>
      <div className="page-header">
        <button className="create-appointment-btn" onClick={() => setIsModalOpen(true)}>
          + Yeni Randevu Oluştur
        </button>
      </div>
      {loading && appointments.length === 0 && <p>Randevular Yükleniyor...</p>}
      {error && !isModalOpen && <p style={{ color: 'red' }}>Hata: {error}</p>}
      <AppointmentViewToggle appointments={appointments} userType="technician" />
      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default TechnicianAppointments;
