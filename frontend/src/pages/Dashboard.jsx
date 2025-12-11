import { useAuth } from '../context/AuthContext'
import { useNavigate, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiLogOut, FiUser, FiHome, FiMessageSquare, FiCalendar } from 'react-icons/fi'
import './Dashboard.css'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <h1 className="sidebar-logo">V-Fix</h1>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            <FiHome />
            <span>Ana Sayfa</span>
          </NavLink>
          <NavLink to="/appointments" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            <FiCalendar />
            <span>Randevular</span>
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            <FiMessageSquare />
            <span>Sohbet</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <p>&copy; 2025 V-Fix</p>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="logo-section">
              <span className="welcome-text">Hoşgeldiniz</span>
            </div>
          </div>
          <div className="header-right">
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut />
              <span>Çıkış</span>
            </button>
          </div>
        </header>
        <motion.div
          className="dashboard-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="user-card">
            <div className="user-avatar">
              <FiUser />
            </div>
            <h2>{user?.full_name || user?.username}</h2>
            <p className="user-email">{user?.email}</p>
            <div className="user-details">
              <div className="detail-item">
                <span className="detail-label">Role:</span>
                <span className="detail-value">{user?.role}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Skill Level:</span>
                <span className="detail-value">{user?.skill_level}/5</span>
              </div>
              {user?.address && (
                <div className="detail-item">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{user.address}</span>
                </div>
              )}
              {user?.phone && (
                <div className="detail-item">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default Dashboard
