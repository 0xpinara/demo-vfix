import { motion } from 'framer-motion'
import AuthBackground from './AuthBackground'
import Logo from './Logo'
import './AuthLayout.css'

function AuthLayout({ children, title, subtitle, className = '' }) {
  const isRegisterPage = className.includes('register-card')
  return (
    <div className={`auth-container ${isRegisterPage ? 'register-container' : ''}`}>
      <AuthBackground />
      <motion.div
        className={`auth-card ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <Logo />
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </motion.div>
    </div>
  )
}

export default AuthLayout

