import { useState } from 'react';
import { FaCalendarAlt, FaUser, FaCog, FaMapMarkerAlt } from 'react-icons/fa';
import './Appointments.css';
import RescheduleAppointmentModal from './RescheduleAppointmentModal';
import UpdateStatusModal from './UpdateStatusModal';
import { useAppointments } from '../../context/AppointmentContext';

function AppointmentCard({ appointment, userType = 'user' }) {
  const { id, scheduled_for, status, product_brand, product_model, product_issue, technician, customer, location } = appointment;
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const { deleteAppointment } = useAppointments();

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const canReschedule = userType === 'user' && status !== 'completed' && status !== 'cancelled';
  const canUpdateStatus = userType === 'technician';

  const handleDelete = async () => {
    if (window.confirm('Bu randevuyu iptal etmek istediğinizden emin misiniz?')) {
      await deleteAppointment(id);
    }
  };

  return (
    <>
      <div className={`appointment-card status-${status}`}>
        <div className="card-header">
          <h3>{product_brand} {product_model}</h3>
          <span className="status-badge">{status}</span>
        </div>
        <div className="card-body">
          <p><FaCalendarAlt /> <strong>Tarih:</strong> {formatDate(scheduled_for)}</p>
          <p><FaCog /> <strong>Problem:</strong> {product_issue}</p>
          {userType === 'user' && technician && (
            <p><FaUser /> <strong>Teknisyen:</strong> {technician.name}</p>
          )}
          {userType === 'technician' && customer && (
            <>
              <p><FaUser /> <strong>Müşteri:</strong> {customer.name}</p>
              <p><FaMapMarkerAlt /> <strong>Konum:</strong> {location}</p>
            </>
          )}
        </div>
        <div className="card-footer">
          <button className="card-button primary">Detaylar</button>
          {canReschedule && (
            <>
              <button className="card-button" onClick={() => setIsRescheduleModalOpen(true)}>Yeni Tarih Seç</button>
              <button className="card-button danger" onClick={handleDelete}>Randevuyu İptal Et</button>
            </>
          )}
          {canUpdateStatus && (
            <button className="card-button" onClick={() => setIsUpdateStatusModalOpen(true)}>Durumu Güncelle</button>
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
    </>
  );
}
export default AppointmentCard;
