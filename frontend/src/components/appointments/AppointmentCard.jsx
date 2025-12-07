import { FaCalendarAlt, FaClock, FaUser, FaCog, FaMapMarkerAlt } from 'react-icons/fa';
import './Appointments.css';

function AppointmentCard({ appointment, userType = 'customer' }) {
  const { id, scheduled_for, status, product, technician, customer, location } = appointment;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={`appointment-card status-${status}`}>
      <div className="card-header">
        <h3>{product.brand} {product.model}</h3>
        <span className="status-badge">{status}</span>
      </div>
      <div className="card-body">
        <p><FaCalendarAlt /> <strong>Tarih:</strong> {formatDate(scheduled_for)}</p>
        <p><FaCog /> <strong>Problem:</strong> {product.issue}</p>
        {userType === 'customer' && technician && (
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
        <button className="card-button">Yeni Tarih Seç</button>
      </div>
    </div>
  );
}

export default AppointmentCard;