import { motion } from 'framer-motion'

function ErrorMessage({ message }) {
  if (!message) return null

  return (
    <motion.div
      className="error-message"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {message}
    </motion.div>
  )
}

export default ErrorMessage

