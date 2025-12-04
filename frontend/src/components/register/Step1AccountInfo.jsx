import { motion } from 'framer-motion'
import { FiMail, FiUser, FiLock } from 'react-icons/fi'
import AuthButton from '../auth/AuthButton'

function Step1AccountInfo({ formData, errors, onInputChange, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="form-step"
    >
      <h2>Account Information</h2>
      <div className="form-group">
        <label htmlFor="email">
          <FiMail className="input-icon" />
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={onInputChange}
          placeholder="you@example.com"
          required
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="username">
          <FiUser className="input-icon" />
          Username
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={onInputChange}
          placeholder="Choose a username"
          required
        />
        {errors.username && <span className="field-error">{errors.username}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">
          <FiLock className="input-icon" />
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={onInputChange}
          placeholder="At least 8 characters"
          required
        />
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">
          <FiLock className="input-icon" />
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={onInputChange}
          placeholder="Re-enter your password"
          required
        />
        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
      </div>

      <AuthButton type="button" onClick={onNext}>
        Continue
      </AuthButton>
    </motion.div>
  )
}

export default Step1AccountInfo

