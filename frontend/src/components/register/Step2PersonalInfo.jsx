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
      <h2>Personal Information</h2>
      <div className="form-group">
        <label htmlFor="full_name">
          <FiUser className="input-icon" />
          Full Name
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={onInputChange}
          placeholder="Your full name"
          required
        />
        {errors.full_name && <span className="field-error">{errors.full_name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="address">
          <FiMapPin className="input-icon" />
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={onInputChange}
          placeholder="Your address"
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">
          <FiPhone className="input-icon" />
          Phone Number
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
        <label htmlFor="preferred_contact_method">Preferred Contact Method</label>
        <select
          id="preferred_contact_method"
          name="preferred_contact_method"
          value={formData.preferred_contact_method}
          onChange={onInputChange}
        >
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="sms">SMS</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="skill_level">Skill Level</label>
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
        <p className="skill-hint">1 = Beginner, 5 = Expert</p>
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
          <span>I confirm that I am at least 18 years old</span>
        </label>
        {errors.age_verified && <span className="field-error">{errors.age_verified}</span>}
      </div>

      <div className="form-actions">
        <AuthButton type="button" onClick={onBack} className="secondary">
          Back
        </AuthButton>
        <AuthButton type="button" onClick={onNext}>
          Continue
        </AuthButton>
      </div>
    </motion.div>
  )
}

export default Step2PersonalInfo

