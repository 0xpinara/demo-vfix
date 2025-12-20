import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppointmentViewToggle from '../../components/appointments/AppointmentViewToggle';
import UnassignedAppointments from '../../components/appointments/UnassignedAppointments'; // Import the new component
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext';
import CreateAppointmentModal from '../../components/appointments/CreateAppointmentModal';
import './Appointments.css';

function TechnicianAppointments() {
  const { appointments, users, getUsers, loading, error, loadAppointments } = useAppointments();
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState('my-appointments'); // 'my-appointments' or 'unassigned'
  const navigate = useNavigate();

  useEffect(() => {
    if (view === 'my-appointments') {
      loadAppointments();
    }
    // getUsers is still needed for creating appointments for customers
    if (currentUser?.role === 'technician' || currentUser?.enterprise_role === 'technician' || 
      currentUser?.enterprise_role === 'senior_technician' || currentUser?.enterprise_role === 'branch_manager' || currentUser?.enterprise_role === 'enterprise_admin') {
      getUsers();
    }
  }, [view, loadAppointments, getUsers, currentUser]);

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

      <div className="view-selector-tabs">
        <button
          className={`view-tab ${view === 'my-appointments' ? 'active' : ''}`}
          onClick={() => setView('my-appointments')}
        >
          Randevularım
        </button>
        <button
          className={`view-tab ${view === 'unassigned' ? 'active' : ''}`}
          onClick={() => setView('unassigned')}
        >
          Mevcut Randevular
        </button>
      </div>

      <div className="appointments-main-content">
        {loading && <p>Randevular Yükleniyor...</p>}
        {error && !isModalOpen && <p style={{ color: 'red' }}>Hata: {error}</p>}
        
        {view === 'my-appointments' ? (
          <AppointmentViewToggle appointments={appointments} userType="technician" />
        ) : (
          <UnassignedAppointments />
        )}
      </div>
      
      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        customers={users}
      />
    </div>
  );
}

export default TechnicianAppointments;

