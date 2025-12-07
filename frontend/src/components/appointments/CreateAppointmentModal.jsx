import { useState } from 'react';
import { useAppointments } from '../../context/AppointmentContext';
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
  const { createAppointment, loading } = useAppointments();

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    for (const key in formData) {
      if (!formData[key]) {
        setError(`Please fill out the ${key.replace(/_/g, ' ')} field.`);
        return;
      }
    }

    const result = await createAppointment(formData);
    if (result.success) {
      onClose(); // Close modal on success
      setFormData({ // Reset form
        product_brand: '',
        product_model: '',
        product_issue: '',
        location: '',
        scheduled_for: '',
      });
    } else {
      setError(result.error || 'Failed to create appointment.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Yeni Randevu Oluştur</h2>
        {error && <p className="modal-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ürün Markası</label>
            <input type="text" name="product_brand" value={formData.product_brand} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Ürün Modeli</label>
            <input type="text" name="product_model" value={formData.product_model} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Problem Açıklaması</label>
            <textarea name="product_issue" value={formData.product_issue} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Konum / Adres</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Randevu Tarihi ve Saati</label>
            <input type="datetime-local" name="scheduled_for" value={formData.scheduled_for} onChange={handleChange} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>İptal</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Oluşturuluyor...' : 'Randevu Oluştur'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAppointmentModal;