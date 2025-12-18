import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppointmentViewToggle from '../../components/appointments/AppointmentViewToggle';
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import CreateAppointmentModal from '../../components/appointments/CreateAppointmentModal';
import './Appointments.css';

function UserAppointments() {
  const { appointments, technicians, getTechnicians, loading, error, loadAppointments } = useAppointments();
  const { user: currentUser } = useAuth(); // Get current user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAppointments();
    getTechnicians(); // Fetch technicians
  }, [loadAppointments, getTechnicians]);

  const handleGoBack = () => {
    navigate('/dashboard'); // Assuming '/dashboard' is the route for the dashboard page
  };

  return (
    <div className="appointments-page-container">
      <div className="page-header">
        <button className="back-to-dashboard-btn" onClick={handleGoBack}>
          Geri Dön
        </button>
        <h1 className="page-title">Randevularım</h1>
        <button className="create-appointment-btn" onClick={() => setIsModalOpen(true)}>
          + Yeni Randevu Oluştur
        </button>
      </div>

      <div className="appointments-main-content">
        {loading && appointments.length === 0 && <p>Randevular Yükleniyor...</p>}
        {error && !isModalOpen && <p style={{ color: 'red' }}>Hata: {error}</p>}
        <AppointmentViewToggle appointments={appointments} userType="user" />
      </div>
      
      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        technicians={technicians} // Pass technicians
      />
    </div>
  );
}

export default UserAppointments;
