import { motion } from 'framer-motion'
import { FiUser, FiMapPin, FiPhone } from 'react-icons/fi'
import AuthButton from '../auth/AuthButton'

function Step2PersonalInfo({ formData, errors, onInputChange, setFormData, onBack, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="form-step"
    >
      <h2>Kişisel Bilgiler</h2>
      <div className="form-group">
        <label htmlFor="full_name">
          <FiUser className="input-icon" />
          Ad Soyad
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={onInputChange}
          placeholder="Adınız ve soyadınız"
          required
        />
        {errors.full_name && <span className="field-error">{errors.full_name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="address">
          <FiMapPin className="input-icon" />
          Adres
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={onInputChange}
          placeholder="Adresiniz"
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">
          <FiPhone className="input-icon" />
          Telefon Numarası
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={onInputChange}
          placeholder="+90 555 123 4567"
        />
      </div>

      <div className="form-group">
        <label htmlFor="preferred_contact_method">Tercih Edilen İletişim Yöntemi</label>
        <select
          id="preferred_contact_method"
          name="preferred_contact_method"
          value={formData.preferred_contact_method}
          onChange={onInputChange}
        >
          <option value="email">E-posta</option>
          <option value="phone">Telefon</option>
          <option value="sms">SMS</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="skill_level">Beceri Seviyesi</label>
        <div className="skill-levels">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              className={`skill-btn ${formData.skill_level === level ? 'active' : ''}`}
              onClick={() => setFormData((prev) => ({ ...prev, skill_level: level }))}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="skill-hint">1 = Başlangıç, 5 = Uzman</p>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="age_verified"
            checked={formData.age_verified}
            onChange={onInputChange}
            required
          />
          <span>18 yaşından büyük olduğumu onaylıyorum</span>
        </label>
        {errors.age_verified && <span className="field-error">{errors.age_verified}</span>}
      </div>

      <div className="form-actions">
        <AuthButton type="button" onClick={onBack} className="secondary">
          Geri
        </AuthButton>
        <AuthButton type="button" onClick={onNext}>
          Devam Et
        </AuthButton>
      </div>
    </motion.div>
  )
}

export default Step2PersonalInfo

