import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthButton from '../../components/auth/AuthButton'
import ErrorMessage from '../../components/auth/ErrorMessage'
import GoogleButton from '../../components/auth/GoogleButton'
import { FiMail, FiLock } from 'react-icons/fi'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      // Redirect based on user role
      if (result.role === 'admin') {
        navigate('/admin')
      } else {
        // Normal users go straight to chatbot
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
    <AuthLayout title="Tekrar Hoş Geldiniz" subtitle="V-Fix'e devam etmek için giriş yapın">
      <form onSubmit={handleSubmit} className="auth-form">
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
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifrenizi girin"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input type="checkbox" />
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

