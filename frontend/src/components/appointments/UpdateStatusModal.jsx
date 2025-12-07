import { useState } from 'react';
import { useAppointments } from '../../lib/AppointmentContext';
import './CreateAppointmentModal.css'; // Reusing the same CSS

function UpdateStatusModal({ isOpen, onClose, appointment }) {
  const [status, setStatus] = useState(appointment.status);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { updateAppointmentStatus } = useAppointments();

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await updateAppointmentStatus(appointment.id, { status });
      setSubmitting(false);
      onClose(); // Close modal on success
    } catch (err) {
      setError(err.message || 'Durum güncellenirken bir hata oluştu.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Randevu Durumunu Güncelle</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="status">Durum</label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="pending">Beklemede</option>
              <option value="scheduled">Zamanlandı</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>İptal</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Kaydediliyor...' : 'Durumu Güncelle'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateStatusModal;
