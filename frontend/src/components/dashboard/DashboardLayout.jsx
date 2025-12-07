import { NavLink } from 'react-router-dom';
import './DashboardLayout.css';

function DashboardLayout({ children, title }) {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <h1 className="sidebar-logo">V-Fix</h1>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>Ana Sayfa</NavLink>
          <NavLink to="/appointments" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>Bekleyen Randevular</NavLink>
          <NavLink to="/chat" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>Sohbet</NavLink>
          {/* Add other links like Profile, Settings etc. here */}
        </nav>
        <div className="sidebar-footer">
          <p>&copy; 2025 V-Fix</p>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h2>{title}</h2>
        </header>
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;