import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthButton from '../../components/auth/AuthButton'
import ErrorMessage from '../../components/auth/ErrorMessage'
import GoogleButton from '../../components/auth/GoogleButton'
import AppliancesGroup from '../../components/auth/Appliances'
import { FiMail, FiLock } from 'react-icons/fi'
import './Login.css'

const REMEMBER_ME_EMAIL_KEY = 'vfix_remembered_email'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_ME_EMAIL_KEY)
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_EMAIL_KEY, email)
      } else {
        localStorage.removeItem(REMEMBER_ME_EMAIL_KEY)
      }

      // Redirect based on user role
      if (result.role === 'admin') {
        // System admins go to admin panel
        navigate('/admin')
      } else if (result.enterprise_role === 'branch_manager') {
        // Branch managers go to branch manager dashboard
        navigate('/branch-manager')
      } else {
        // Regular users go to chatbot
        navigate('/chat')
      }
    } else {
      setError(result.error)
    }
  }

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    // Google OAuth integration will be implemented in a future update
  }

  return (
    <AuthLayout title="Tekrar Hoş Geldiniz" subtitle="V-Fix'e devam etmek için giriş yapın" backgroundType="login">
      <form onSubmit={handleSubmit} className="auth-form">
        <AppliancesGroup 
          isPasswordFocused={isPasswordFocused} 
          passwordValue={password} 
          showPassword={showPassword} 
          hasError={!!error} 
        />
        <ErrorMessage message={error} />

        <div className="form-group">
          <label htmlFor="email">
            <FiMail className="input-icon" />
            E-posta Adresi
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
            required
            autoComplete="email"
          />
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              placeholder="Şifrenizi girin"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
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
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Beni hatırla</span>
          </label>
          <Link to="/password-reset" className="forgot-link">
            Şifrenizi mi unuttunuz?
          </Link>
        </div>

        <AuthButton type="submit" loading={loading}>
          Giriş Yap
        </AuthButton>

        <div className="divider">
          <span>veya</span>
        </div>

        <GoogleButton onClick={handleGoogleLogin} />

        <p className="auth-footer">
          Hesabınız yok mu?{' '}
          <Link to="/register" className="auth-link">
            Kayıt olun
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default Login

