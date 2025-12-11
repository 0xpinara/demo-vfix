import { useState, useRef, useEffect } from 'react'
import AuthBackground from './AuthBackground'
import Logo from './Logo'
import './AuthLayout.css'

function AuthLayout({ children, title, subtitle, className = '', backgroundType }) {
  const isRegisterPage = className.includes('register-card')
  const bgType = backgroundType || (isRegisterPage ? 'register' : 'login')
  const cardRef = useRef(null)
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const mouseX = e.clientX - centerX
      const mouseY = e.clientY - centerY
      
      // Calculate rotation (minimal subtle effect - max 1.5 degrees)
      const rotateX = (mouseY / (rect.height / 2)) * -1.5
      const rotateY = (mouseX / (rect.width / 2)) * 1.5
      
      // Calculate perspective and translate for depth (minimal subtle)
      const translateZ = 2
      
      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`
      })
    }

    const handleMouseLeave = () => {
      setTiltStyle({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
      })
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div className={`auth-container ${isRegisterPage ? 'register-container' : ''}`}>
      <AuthBackground type={bgType} />
      <div
        ref={cardRef}
        className={`auth-card ${className} ${isVisible ? 'auth-card-visible' : ''}`}
        style={tiltStyle}
      >
        <div className="auth-header">
          <Logo />
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout

