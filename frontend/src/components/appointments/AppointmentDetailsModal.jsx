import React from 'react';
import { FaTimes } from 'react-icons/fa';
import './AppointmentDetailsModal.css';

const AppointmentDetailsModal = ({ isOpen, onClose, appointment }) => {
  if (!isOpen || !appointment) {
    return null;
  }

  const {
    scheduled_for,
    status,
    product_brand,
    product_model,
    product_issue,
    knowledge,
    location,
    customer,
    technician,
    created_at,
    updated_at,
  } = appointment;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  const statusTranslations = {
    scheduled: 'Planlandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
    pending: 'Beklemede',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Randevu Detayları</h2>
          <button onClick={onClose} className="close-button">
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="details-grid">
            <div className="detail-item">
              <strong>Durum:</strong>
              <span className={`status-badge status-${status}`}>
                {statusTranslations[status] || status}
              </span>
            </div>
            <div className="detail-item">
              <strong>Oluşturulma:</strong>
              <span>{formatDate(created_at)}</span>
            </div>
            {updated_at && (
              <div className="detail-item">
                <strong>Son Güncelleme:</strong>
                <span>{formatDate(updated_at)}</span>
              </div>
            )}
            <div className="detail-item">
              <strong>Marka:</strong>
              <span>{product_brand}</span>
            </div>
            <div className="detail-item">
              <strong>Model:</strong>
              <span>{product_model}</span>
            </div>
            <div className="detail-item wide">
              <strong>Problem:</strong>
              <p>{product_issue}</p>
            </div>
            {knowledge && (
              <div className="detail-item wide">
                <strong>Notlar:</strong>
                <p>{knowledge}</p>
              </div>
            )}
            <div className="detail-item">
              <strong>Müşteri:</strong>
              <span>{customer?.full_name || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <strong>Teknisyen:</strong>
              <span>{technician?.full_name || 'Atanmamış'}</span>
            </div>
            <div className="detail-item wide">
              <strong>Konum:</strong>
              <span>{location}</span>
            </div>
             <div className="detail-item">
              <strong>Randevu Tarihi:</strong>
              <span>{formatDate(scheduled_for)}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="card-button">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;