import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthButton from '../../components/auth/AuthButton'
import ErrorMessage from '../../components/auth/ErrorMessage'
import StepIndicator from '../../components/register/StepIndicator'
import api from '../../services/api'
import { FiMail, FiUser, FiLock, FiEye, FiEyeOff, FiPhone, FiBriefcase, FiHome } from 'react-icons/fi'
import './Register.css'

function EnterpriseRegister() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Account info
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    
    // Enterprise info
    enterprise_name: '',
    enterprise_registration_number: '',
    enterprise_contact_email: '',
    enterprise_contact_phone: '',
    
    // Branch info
    branch_name: '',
    branch_address: '',
    branch_phone: '',
    
    // Employee info
    employee_id: '',
    enterprise_role: 'technician',
    specialization: [],
    
    // Compliance
    gdpr_consent: false,
    age_verified: false,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const toggleSpecialization = (spec) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }))
  }

  const validateStep = (stepNum) => {
    const newErrors = {}
    
    if (stepNum === 1) {
      if (!formData.email) newErrors.email = 'E-posta gereklidir'
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Geçersiz e-posta adresi'
      if (!formData.username) newErrors.username = 'Kullanıcı adı gereklidir'
      else if (formData.username.length < 3) newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır'
      if (!formData.password) newErrors.password = 'Şifre gereklidir'
      else if (formData.password.length < 8) newErrors.password = 'Şifre en az 8 karakter olmalıdır'
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor'
      }
      if (!formData.full_name) newErrors.full_name = 'Ad soyad gereklidir'
    }
    
    if (stepNum === 2) {
      if (!formData.enterprise_name) newErrors.enterprise_name = 'Kuruluş adı gereklidir'
      if (!formData.enterprise_contact_email) newErrors.enterprise_contact_email = 'Kuruluş e-postası gereklidir'
      if (!formData.branch_name) newErrors.branch_name = 'Şube adı gereklidir'
      if (!formData.age_verified) newErrors.age_verified = 'Yaşınızı doğrulamanız gerekmektedir'
    }
    
    if (stepNum === 3) {
      if (!formData.enterprise_role) newErrors.enterprise_role = 'Rol seçimi gereklidir'
      if (!formData.gdpr_consent) newErrors.gdpr_consent = 'GDPR onayı gereklidir'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(3)) return

    setLoading(true)
    setErrors({})

    try {
      const response = await api.post('/enterprise/register', formData)
      const { access_token } = response.data
      
      localStorage.setItem('token', access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      navigate('/chat')
    } catch (error) {
      setErrors({
        submit: error.response?.data?.detail || 'Kayıt başarısız oldu',
      })
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'technician', label: 'Teknisyen' },
    { value: 'senior_technician', label: 'Kıdemli Teknisyen' },
    { value: 'branch_manager', label: 'Şube Müdürü' },
    { value: 'enterprise_admin', label: 'Kuruluş Yöneticisi' },
  ]

  const specializationOptions = [
    'Çamaşır Makinesi',
    'Buzdolabı',
    'Bulaşık Makinesi',
    'Fırın',
    'Klima'
  ]

  return (
    <AuthLayout title="Kurumsal Hesap Oluştur" subtitle="V-Fix Enterprise'a katılın" className="register-card" backgroundType="register">
      <div className="register-wrapper">
        <StepIndicator currentStep={step} totalSteps={3} />

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {/* Step 1: Account Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="form-step"
              >
                <h2>Hesap Bilgileri</h2>
                
                <div className="form-group">
                  <div className="input-icon">
                    <FiMail />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="E-posta"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FiUser />
                  </div>
                  <input
                    type="text"
                    name="username"
                    placeholder="Kullanıcı adı"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={errors.username ? 'error' : ''}
                  />
                  {errors.username && <span className="field-error">{errors.username}</span>}
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FiUser />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Ad Soyad"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className={errors.full_name ? 'error' : ''}
                  />
                  {errors.full_name && <span className="field-error">{errors.full_name}</span>}
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FiLock />
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Şifre"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={errors.password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FiLock />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Şifre Tekrar"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FiPhone />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Telefon"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-actions">
                  <AuthButton type="button" onClick={handleNext}>Devam Et</AuthButton>
                </div>
              </motion.div>
            )}

            {/* Step 2: Enterprise & Branch Info */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="form-step"
              >
                <h2>Kuruluş ve Şube Bilgileri</h2>
                
                <div className="form-group">
                  <div className="input-icon">
                    <FiBriefcase />
                  </div>
                  <input
                    type="text"
                    name="enterprise_name"
                    placeholder="Kuruluş Adı"
                    value={formData.enterprise_name}
                    onChange={handleInputChange}
                    className={errors.enterprise_name ? 'error' : ''}
                  />
                  {errors.enterprise_name && <span className="field-error">{errors.enterprise_name}</span>}
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FiBriefcase />
                  </div>
                  <input
                    type="text"
                    name="enterprise_registration_number"
                    placeholder="Vergi No / Sicil No (İsteğe bağlı)"
                    value={formData.enterprise_registration_number}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FiMail />
                  </div>
                  <input
                    type="email"
                    name="enterprise_contact_email"
                    placeholder="Kuruluş İletişim E-postası"
                    value={formData.enterprise_contact_email}
                    onChange={handleInputChange}
                    className={errors.enterprise_contact_email ? 'error' : ''}
                  />
                  {errors.enterprise_contact_email && <span className="field-error">{errors.enterprise_contact_email}</span>}
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FiPhone />
                  </div>
                  <input
                    type="tel"
                    name="enterprise_contact_phone"
                    placeholder="Kuruluş Telefonu (İsteğe bağlı)"
                    value={formData.enterprise_contact_phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-section-divider">Şube Bilgileri</div>

                <div className="form-group">
                  <div className="input-icon">
                    <FiHome />
                  </div>
                  <input
                    type="text"
                    name="branch_name"
                    placeholder="Şube Adı (örn: İstanbul Şubesi)"
                    value={formData.branch_name}
                    onChange={handleInputChange}
                    className={errors.branch_name ? 'error' : ''}
                  />
                  {errors.branch_name && <span className="field-error">{errors.branch_name}</span>}
                </div>

                <div className="form-group">
                  <textarea
                    name="branch_address"
                    placeholder="Şube Adresi (İsteğe bağlı)"
                    value={formData.branch_address}
                    onChange={handleInputChange}
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FiPhone />
                  </div>
                  <input
                    type="tel"
                    name="branch_phone"
                    placeholder="Şube Telefonu (İsteğe bağlı)"
                    value={formData.branch_phone}
                    onChange={handleInputChange}
                  />
                </div>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="age_verified"
                    checked={formData.age_verified}
                    onChange={handleInputChange}
                  />
                  <span>18 yaşından büyüğüm</span>
                </label>
                {errors.age_verified && <span className="field-error">{errors.age_verified}</span>}

                <div className="form-actions">
                  <AuthButton type="button" onClick={handleBack} className="secondary">Geri</AuthButton>
                  <AuthButton type="button" onClick={handleNext}>Devam Et</AuthButton>
                </div>
              </motion.div>
            )}

            {/* Step 3: Role & Compliance */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="form-step"
              >
                <h2>Rol ve Onaylar</h2>
                
                <div className="form-group">
                  <label className="form-label">Rol Seçimi</label>
                  <div className="role-selector">
                    {roleOptions.map((role) => (
                      <label key={role.value} className="role-option">
                        <input
                          type="radio"
                          name="enterprise_role"
                          value={role.value}
                          checked={formData.enterprise_role === role.value}
                          onChange={handleInputChange}
                        />
                        <span className="role-label">{role.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.enterprise_role && <span className="field-error">{errors.enterprise_role}</span>}
                </div>

                {(formData.enterprise_role === 'technician' || formData.enterprise_role === 'senior_technician') && (
                  <div className="form-group">
                    <label className="form-label">Uzmanlık Alanları</label>
                    <div className="specialization-grid">
                      {specializationOptions.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          className={`spec-button ${formData.specialization.includes(spec) ? 'active' : ''}`}
                          onClick={() => toggleSpecialization(spec)}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div className="input-icon">
                    <FiBriefcase />
                  </div>
                  <input
                    type="text"
                    name="employee_id"
                    placeholder="Çalışan ID (İsteğe bağlı)"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                  />
                </div>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="gdpr_consent"
                    checked={formData.gdpr_consent}
                    onChange={handleInputChange}
                  />
                  <span>GDPR ve gizlilik politikasını kabul ediyorum</span>
                </label>
                {errors.gdpr_consent && <span className="field-error">{errors.gdpr_consent}</span>}

                {errors.submit && <ErrorMessage message={errors.submit} />}

                <div className="form-actions">
                  <AuthButton type="button" onClick={handleBack} className="secondary">Geri</AuthButton>
                  <AuthButton type="submit" loading={loading}>Hesap Oluştur</AuthButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="auth-footer">
            Bireysel kullanıcı mısınız?{' '}
            <Link to="/register" className="auth-link">
              Bireysel Kayıt
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}

export default EnterpriseRegister

