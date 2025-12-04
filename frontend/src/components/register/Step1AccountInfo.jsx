import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiMail, FiUser, FiLock } from 'react-icons/fi'
import AuthButton from '../auth/AuthButton'

function Step1AccountInfo({ formData, errors, onInputChange, onNext, onPasswordFocusChange, onShowPasswordChange }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="form-step"
    >
      <h2>Hesap Bilgileri</h2>
      <div className="form-group">
        <label htmlFor="email">
          <FiMail className="input-icon" />
          E-posta Adresi
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={onInputChange}
          placeholder="ornek@email.com"
          required
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="username">
          <FiUser className="input-icon" />
          Kullanıcı Adı
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={onInputChange}
          placeholder="Kullanıcı adınızı seçin"
          required
        />
        {errors.username && <span className="field-error">{errors.username}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">
          <FiLock className="input-icon" />
          Şifre
        </label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={onInputChange}
            onFocus={() => {
              onPasswordFocusChange?.(true)
            }}
            onBlur={() => {
              onPasswordFocusChange?.(false)
            }}
            placeholder="En az 8 karakter"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => {
              const newState = !showPassword
              setShowPassword(newState)
              onShowPasswordChange?.(newState)
            }}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPassword ? (
              <svg className="eye-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg className="eye-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">
          <FiLock className="input-icon" />
          Şifreyi Onayla
        </label>
        <div className="password-input-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={onInputChange}
            placeholder="Şifrenizi tekrar girin"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showConfirmPassword ? (
              <svg className="eye-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg className="eye-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
      </div>

      <AuthButton type="button" onClick={onNext}>
        Devam Et
      </AuthButton>
    </motion.div>
  )
}

export default Step1AccountInfo

