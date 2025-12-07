import { useState } from 'react';
import { useAppointments } from '../../lib/AppointmentContext';
import './CreateAppointmentModal.css';

function CreateAppointmentModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    product_brand: '',
    product_model: '',
    product_issue: '',
    location: '',
    scheduled_for: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { createAppointment } = useAppointments();

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    for (const key in formData) {
      if (!formData[key]) {
        setError(`Lütfen tüm alanları doldurun.`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const appointmentData = {
        ...formData,
        scheduled_for: new Date(formData.scheduled_for).toISOString(),
      };
      await createAppointment(appointmentData);
      setSubmitting(false);
      onClose(); // Close modal on success
      // Reset form
      setFormData({
        product_brand: '',
        product_model: '',
        product_issue: '',
        location: '',
        scheduled_for: '',
      });
    } catch (err) {
      setError(err.message || 'Randevu oluşturulurken bir hata oluştu.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Yeni Randevu Talebi</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="product_brand">Marka</label>
            <input
              type="text"
              id="product_brand"
              name="product_brand"
              value={formData.product_brand}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="product_model">Model</label>
            <input
              type="text"
              id="product_model"
              name="product_model"
              value={formData.product_model}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="product_issue">Sorun Açıklaması</label>
            <textarea
              id="product_issue"
              name="product_issue"
              value={formData.product_issue}
              onChange={handleChange}
              rows="4"
              required
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="location">Konum</label>
            <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="scheduled_for">Talep Edilen Tarih ve Saat</label>
            <input type="datetime-local" id="scheduled_for" name="scheduled_for" value={formData.scheduled_for} onChange={handleChange} required />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>İptal</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Oluşturuluyor...' : 'Talep Oluştur'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAppointmentModal;