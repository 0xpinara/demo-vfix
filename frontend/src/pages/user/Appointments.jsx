import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import AppointmentList from '../../components/appointments/AppointmentList';
import { useAppointments } from '../../context/AppointmentContext';
import CreateAppointmentModal from '../../components/appointments/CreateAppointmentModal';
import './Appointments.css';

function UserAppointments() {
  const { appointments, loading, error, loadAppointments } = useAppointments();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Load appointments for the 'user' user type
    loadAppointments('user');
  }, [loadAppointments]);

  return (
    <DashboardLayout title="Randevularım">
      <div className="page-header">
        <button className="create-appointment-btn" onClick={() => setIsModalOpen(true)}>
          + Yeni Randevu Oluştur
        </button>
      </div>
      {loading && appointments.length === 0 && <p>Randevular Yükleniyor...</p>}
      {error && !isModalOpen && <p style={{ color: 'red' }}>Hata: {error}</p>}
      <AppointmentList appointments={appointments} userType="user" />
      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </DashboardLayout>
  );
}

export default UserAppointments;
