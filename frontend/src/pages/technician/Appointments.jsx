import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppointmentViewToggle from '../../components/appointments/AppointmentViewToggle';
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import CreateAppointmentModal from '../../components/appointments/CreateAppointmentModal';
import './Appointments.css';

function TechnicianAppointments() { // Renamed component
  const { appointments, users, getUsers, loading, error, loadAppointments } = useAppointments();
  const { user: currentUser } = useAuth(); // Get current user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAppointments();
    // Fetch users if the current user is a technician
    if (currentUser?.role === 'technician' || currentUser?.enterprise_role === 'technician' || 
      currentUser?.enterprise_role === 'senior_technician' || currentUser?.enterprise_role === 'branch_manager' || currentUser?.enterprise_role === 'enterprise_admin') {
      getUsers();
    }
  }, [loadAppointments, getUsers, currentUser]);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="appointments-page-container">
      <div className="page-header">
        <button className="back-to-dashboard-btn" onClick={handleGoBack}>
          Geri Dön
        </button>
        <h1 className="page-title">Randevular</h1>
        <button className="create-appointment-btn" onClick={() => setIsModalOpen(true)}>
          + Yeni Randevu Oluştur
        </button>
      </div>

      <div className="appointments-main-content">
        {loading && appointments.length === 0 && <p>Randevular Yükleniyor...</p>}
        {error && !isModalOpen && <p style={{ color: 'red' }}>Hata: {error}</p>}
        <AppointmentViewToggle appointments={appointments} userType="technician" />
      </div>
      
      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        customers={users} // Pass users as customers
      />
    </div>
  );
}

export default TechnicianAppointments; // Renamed export
