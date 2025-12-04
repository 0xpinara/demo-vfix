import { motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'

function AuthButton({ children, loading, disabled, className = '', ...props }) {
  return (
    <motion.button
      className={`auth-button ${className}`}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {loading ? (
        <span className="spinner"></span>
      ) : (
        <>
          {children}
          {!className.includes('secondary') && <FiArrowRight />}
        </>
      )}
    </motion.button>
  )
}

export default AuthButton

