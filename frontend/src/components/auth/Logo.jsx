import { motion } from 'framer-motion'

function Logo() {
  return (
    <motion.div
      className="logo"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring' }}
    >
      <span className="logo-icon">V</span>
    </motion.div>
  )
}

export default Logo

