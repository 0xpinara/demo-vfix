import { useState } from 'react';
import { useAppointments } from '../../lib/AppointmentContext';
import './CreateAppointmentModal.css'; // Reusing the same CSS for simplicity

function RescheduleAppointmentModal({ isOpen, onClose, appointment }) {
  const [scheduledFor, setScheduledFor] = useState(appointment.scheduled_for);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { rescheduleAppointment } = useAppointments();

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!scheduledFor) {
      setError('Lütfen yeni bir tarih ve saat seçin.');
      setSubmitting(false);
      return;
    }

    try {
      await rescheduleAppointment(appointment.id, { scheduled_for: new Date(scheduledFor).toISOString() });
      setSubmitting(false);
      onClose(); // Close modal on success
    } catch (err) {
      setError(err.message || 'Randevu yeniden zamanlanırken bir hata oluştu.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Randevu Tarihini Değiştir</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="scheduled_for">Yeni Tarih ve Saat</label>
            <input
              type="datetime-local"
              id="scheduled_for"
              name="scheduled_for"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>İptal</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Kaydediliyor...' : 'Tarihi Güncelle'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RescheduleAppointmentModal;
