import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import './Landing.css'

function Landing() {
  const [location, setLocation] = useState('Yükleniyor...')
  const [dateTime, setDateTime] = useState('')

  useEffect(() => {
    // Get location from IP
    fetch('https://ipapi.co/json/')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch location')
        }
        return res.json()
      })
      .then(data => {
        if (data.country_name) {
          setLocation(data.country_name.toUpperCase())
        } else if (data.country_code) {
          // Fallback to country code if name not available
          setLocation(data.country_code.toUpperCase())
        } else {
          setLocation('Bilinmiyor')
        }
      })
      .catch((error) => {
        console.error('Location detection error:', error)
        // Try alternative API as fallback
        fetch('https://ip-api.com/json/')
          .then(res => res.json())
          .then(data => {
            if (data.country) {
              setLocation(data.country.toUpperCase())
            } else {
              setLocation('Bilinmiyor')
            }
          })
          .catch(() => {
            setLocation('Bilinmiyor')
          })
      })

    // Update date/time
    const updateDateTime = () => {
      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = now.toLocaleString('tr-TR', { month: 'short' }).toUpperCase()
      const year = String(now.getFullYear()).slice(-2)
      const hours = String(now.getHours() % 12 || 12).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM'
      setDateTime(`${day} ${month} ${year} ${hours}:${minutes}${ampm}`)
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="landing-container">
      {/* Video Background */}
      <video
        className="landing-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/istockphoto-1299084951-640_adpp_is.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay for better text readability */}
      <div className="landing-overlay"></div>

      {/* Content Card */}
      <motion.div
        className="landing-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="landing-header">
          <img src="/logo.png" alt="V-Fix Logo" className="landing-logo" />
          <h1>V-Fix'e Hoş Geldiniz</h1>
        </div>

        <div className="landing-actions">
          <Link to="/login">
            <motion.button
              className="landing-btn landing-btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Giriş Yap
            </motion.button>
          </Link>
          <Link to="/register">
            <motion.button
              className="landing-btn landing-btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Kayıt Ol
            </motion.button>
          </Link>
        </div>

        <div className="landing-footer">
          <span className="landing-location">• {location}</span>
          <span className="landing-datetime">{dateTime}</span>
        </div>
      </motion.div>
    </div>
  )
}

export default Landing

