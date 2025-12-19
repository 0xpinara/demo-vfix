import { useState, useEffect } from 'react';
import { useAppointments } from '../../context/AppointmentContext';
import SearchableDropdown from '../common/SearchableDropdown'; // Import the new component
import './CreateAppointmentModal.css';

function CreateAppointmentModal({ isOpen, onClose, currentUser, customers = [], technicians = [] }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    technician_id: '',
    product_brand: '',
    product_model: '',
    product_issue: '',
    knowledge: '',
    location: '',
    scheduled_for: '',
  });
  const [error, setError] = useState('');
  const { createAppointment, loading } = useAppointments();

  const isTechnicianCreator = currentUser?.role === 'technician' || currentUser?.enterprise_role === 'technician' || 
    currentUser?.enterprise_role === 'senior_technician';
  const isUserCreator = !isTechnicianCreator;

  // Reset form state when the modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      setError('');
      setFormData({
        customer_id: '',
        technician_id: '',
        product_brand: '',
        product_model: '',
        product_issue: '',
        knowledge: '',
        location: '',
        scheduled_for: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelect = (name, selectedOption) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption ? selectedOption.id : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- Validation ---
    const requiredFields = ['product_brand', 'product_model', 'product_issue', 'location', 'scheduled_for'];
    if (isTechnicianCreator) {
      requiredFields.push('customer_id');
    }

    for (const key of requiredFields) {
      if (!formData[key]) {
        const fieldName = key.replace(/_/g, ' ');
        setError(`Please fill out the ${fieldName} field.`);
        return;
      }
    }
    
    // Clean up payload before sending
    const payload = { ...formData };
    if (!isTechnicianCreator) {
      delete payload.customer_id; // Users don't send this
    }
    if (!isUserCreator || !payload.technician_id) {
        delete payload.technician_id; // Technicians don't send this for themselves
    }


    const result = await createAppointment(payload);
    if (result.success) {
      onClose();
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
          
          {isTechnicianCreator && (
            <div className="form-group">
              <label>Müşteri Seç</label>
              <SearchableDropdown
                options={customers}
                onSelect={(option) => handleSelect('customer_id', option)}
                placeholder="Müşteri ara..."
                displayKey="full_name"
                secondaryDisplayKey="email"
              />
            </div>
          )}

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
            <label>Notlar / Bilgi</label>
            <textarea name="knowledge" value={formData.knowledge} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Konum / Adres</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Randevu Tarihi ve Saati</label>
            <input type="datetime-local" name="scheduled_for" value={formData.scheduled_for} onChange={handleChange} required />
          </div>

          {isUserCreator && (
             <div className="form-group">
                <label>Teknisyen Seç (Opsiyonel)</label>
                <SearchableDropdown
                    options={technicians}
                    onSelect={(option) => handleSelect('technician_id', option)}
                    placeholder="Teknisyen ara..."
                    displayKey="full_name"
                    secondaryDisplayKey="email"
                />
             </div>
          )}
          
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