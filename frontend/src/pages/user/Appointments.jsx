import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import AppointmentList from '../../components/appointments/AppointmentList';
import { useAppointments } from '../../lib/AppointmentContext';
import CreateAppointmentModal from '../../components/appointments/CreateAppointmentModal';
import './Appointments.css';

function CustomerAppointments() {
  const { appointments, loading, error, loadAppointments } = useAppointments();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Load appointments for the 'customer' user type
    loadAppointments('customer');
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
      <AppointmentList appointments={appointments} userType="customer" />
      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </DashboardLayout>
  );
}

export default CustomerAppointments;