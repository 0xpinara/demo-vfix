import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaUser, FaCog, FaMapMarkerAlt } from 'react-icons/fa';
import './Appointments.css';
import RescheduleAppointmentModal from './RescheduleAppointmentModal';
import UpdateStatusModal from './UpdateStatusModal';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import { useAppointments } from '../../context/AppointmentContext';

function AppointmentCard({ appointment, userType = 'user' }) {
  const { selfAssignAppointment, deleteAppointment } = useAppointments();

  const { id, scheduled_for, status, product_brand, product_model, product_issue, technician, customer, location } = appointment;
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [isPastAppointment, setIsPastAppointment] = useState(false);

  useEffect(() => {
    const now = new Date();
    const appointmentDate = new Date(scheduled_for);
    setIsPastAppointment(appointmentDate < now);
  }, [scheduled_for]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  const statusTranslations = {
    scheduled: 'Planlandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
    pending: 'Beklemede',
  };

  const translatedStatus = statusTranslations[status] || status;

  const canReschedule = userType === 'user' && status !== 'completed' && status !== 'cancelled' && !isPastAppointment;
  const canUpdateStatus = userType === 'technician' && status !== 'pending' && !isPastAppointment;
  const canDelete = userType === 'user' && status !== 'completed' && status !== 'cancelled' && !isPastAppointment;
  const canSelfAssign = status === 'pending' && !technician && userType === 'technician' && !isPastAppointment;

  const handleDelete = async () => {
    if (window.confirm('Bu randevuyu iptal etmek istediğinizden emin misiniz?')) {
      await deleteAppointment(id);
    }
  };

  const handleSelfAssign = async () => {
    if (window.confirm('Bu randevuyu üstlenmek istediğinizden emin misiniz?')) {
      await selfAssignAppointment(id);
    }
  };

  return (
    <>
      <div className={`appointment-card status-${status} ${isPastAppointment ? 'disabled' : ''}`}>
        <div className="card-header">
          <h3>{product_brand} {product_model}</h3>
          <span className="status-badge">{translatedStatus}</span>
        </div>
        <div className="card-body">
          <p><FaCalendarAlt /> <strong>Tarih:</strong> {formatDate(scheduled_for)}</p>
          <p><FaCog /> <strong>Problem:</strong> {product_issue}</p>
          {userType === 'user' && technician && (
            <p><FaUser /> <strong>Teknisyen:</strong> {technician.full_name}</p>
          )}
          {userType === 'technician' && customer && (
            <>
              <p><FaUser /> <strong>Müşteri:</strong> {customer.full_name}</p>
              <p><FaMapMarkerAlt /> <strong>Konum:</strong> {location}</p>
            </>
          )}
        </div>
        <div className="card-footer">
          <button className="card-button primary" onClick={() => setIsDetailsModalOpen(true)}>Detaylar</button>
          {canReschedule && (
            <button className="card-button" onClick={() => setIsRescheduleModalOpen(true)} disabled={isPastAppointment}>Yeni Tarih Seç</button>
          )}
          {canDelete && (
            <button className="card-button danger" onClick={handleDelete} disabled={isPastAppointment}>Randevuyu İptal Et</button>
          )}
          {canUpdateStatus && (
            <button className="card-button" onClick={() => setIsUpdateStatusModalOpen(true)} disabled={isPastAppointment}>Durumu Güncelle</button>
          )}
          {canSelfAssign && (
            <button className="card-button" onClick={handleSelfAssign} disabled={isPastAppointment}>Randevuyu Üstlen</button>
          )}
        </div>
      </div>
      <RescheduleAppointmentModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        appointment={appointment}
      />
      <UpdateStatusModal
        isOpen={isUpdateStatusModalOpen}
        onClose={() => setIsUpdateStatusModalOpen(false)}
        appointment={appointment}
      />
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={appointment}
      />
    </>
  );
}
export default AppointmentCard;
