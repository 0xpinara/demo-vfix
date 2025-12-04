import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthButton from '../../components/auth/AuthButton'
import ErrorMessage from '../../components/auth/ErrorMessage'
import StepIndicator from '../../components/register/StepIndicator'
import Step1AccountInfo from '../../components/register/Step1AccountInfo'
import Step2PersonalInfo from '../../components/register/Step2PersonalInfo'
import Step3AdditionalDetails from '../../components/register/Step3AdditionalDetails'
import AirConditioner from '../../components/auth/AirConditioner'
import './Register.css'

function Register() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    address: '',
    phone: '',
    preferred_contact_method: 'email',
    skill_level: 1,
    gdpr_consent: false,
    referral_source: '',
    age_verified: false,
    available_tools: [],
    owned_products: [],
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register } = useAuth()
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

  const validateStep = (stepNum) => {
    const newErrors = {}
    
    if (stepNum === 1) {
      if (!formData.email) newErrors.email = 'E-posta gereklidir'
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Geçersiz e-posta adresi'
      if (!formData.username) newErrors.username = 'Kullanıcı adı gereklidir'
      else if (formData.username.length < 3) newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır'
      if (!formData.password) newErrors.password = 'Şifre gereklidir'
      else if (formData.password.length < 8) newErrors.password = 'Şifre en az 8 karakter olmalıdır'
      else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Şifre harf ve rakam içermelidir'
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor'
      }
    }
    
    if (stepNum === 2) {
      if (!formData.full_name) newErrors.full_name = 'Ad soyad gereklidir'
      if (!formData.age_verified) newErrors.age_verified = 'Yaşınızı doğrulamanız gerekmektedir'
    }
    
    if (stepNum === 3 && !formData.gdpr_consent) {
      newErrors.gdpr_consent = 'GDPR onayı gereklidir'
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

    const submitData = {
      ...formData,
      owned_products: formData.owned_products.map((p) => ({
        brand: p.brand,
        model: p.model,
      })),
    }

    const result = await register(submitData)
    setLoading(false)

    if (result.success) {
      navigate('/dashboard')
    } else {
      if (result.errors && result.errors.length > 0) {
        const errorObj = {}
        result.errors.forEach((err) => {
          errorObj[err.field] = err.message
        })
        setErrors(errorObj)
      } else {
        setErrors({ submit: result.error })
      }
    }
  }

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      owned_products: [...prev.owned_products, { brand: '', model: '' }],
    }))
  }

  const updateProduct = (index, field, value) => {
    setFormData((prev) => {
      const products = [...prev.owned_products]
      products[index] = { ...products[index], [field]: value }
      return { ...prev, owned_products: products }
    })
  }

  const removeProduct = (index) => {
    setFormData((prev) => ({
      ...prev,
      owned_products: prev.owned_products.filter((_, i) => i !== index),
    }))
  }

  const toggleTool = (tool) => {
    setFormData((prev) => ({
      ...prev,
      available_tools: prev.available_tools.includes(tool)
        ? prev.available_tools.filter((t) => t !== tool)
        : [...prev.available_tools, tool],
    }))
  }

  return (
    <AuthLayout title="Hesap Oluştur" subtitle="V-Fix'e katılın ve başlayın" className="register-card" backgroundType="register">
      <div className="register-wrapper">
        <AirConditioner 
          isPasswordFocused={isPasswordFocused} 
          passwordValue={formData.password} 
          showPassword={showPassword} 
        />
        <StepIndicator currentStep={step} totalSteps={3} />

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step1AccountInfo
                key="step1"
                formData={formData}
                errors={errors}
                onInputChange={handleInputChange}
                onNext={handleNext}
                onPasswordFocusChange={setIsPasswordFocused}
                onShowPasswordChange={setShowPassword}
              />
            )}

            {step === 2 && (
              <Step2PersonalInfo
                key="step2"
                formData={formData}
                errors={errors}
                onInputChange={handleInputChange}
                setFormData={setFormData}
                onBack={handleBack}
                onNext={handleNext}
              />
            )}

            {step === 3 && (
              <Step3AdditionalDetails
                key="step3"
                formData={formData}
                errors={errors}
                onInputChange={handleInputChange}
                setFormData={setFormData}
                addProduct={addProduct}
                updateProduct={updateProduct}
                removeProduct={removeProduct}
                toggleTool={toggleTool}
                onBack={handleBack}
                loading={loading}
              />
            )}
          </AnimatePresence>

          <p className="auth-footer">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="auth-link">
              Giriş yapın
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}

export default Register

