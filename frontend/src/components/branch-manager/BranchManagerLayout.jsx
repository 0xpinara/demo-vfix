import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, 
  Calendar,
  MessageSquare, 
  Wrench, 
  LogOut,
  Building2,
  ChevronRight,
  CalendarOff
} from 'lucide-react';
import './BranchManagerLayout.css';

const navItems = [
  {
    path: '/enterprise',
    label: 'Genel İstatistikler',
    icon: BarChart3,
    exact: true
  },
  {
    path: '/enterprise/appointments',
    label: 'Randevu Takvimi',
    icon: Calendar
  },
  {
    path: '/enterprise/vacations',
    label: 'İzin Durumu',
    icon: CalendarOff
  },
  {
    path: '/enterprise/feedback',
    label: 'AI Geri Bildirimleri',
    icon: MessageSquare
  }
];

export default function BranchManagerLayout({ children, title }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="branch-manager-layout">
      {/* Sidebar */}
      <aside className="branch-sidebar">
        <div className="branch-sidebar-header">
          <div className="branch-sidebar-logo">
            <div className="branch-logo-icon-wrapper">
              <Building2 className="branch-logo-icon" />
            </div>
            <div className="branch-logo-text">
              <span className="branch-logo-title">V-Fix</span>
              <span className="branch-logo-subtitle">Şube Yönetimi</span>
            </div>
          </div>
        </div>

        <nav className="branch-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => 
                `branch-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="branch-nav-icon" />
              <span className="branch-nav-label">{item.label}</span>
              <ChevronRight className="branch-nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="branch-sidebar-footer">
          <div className="branch-user-info">
            <div className="branch-user-avatar">
              {user?.full_name?.[0] || user?.username?.[0] || 'M'}
            </div>
            <div className="branch-user-details">
              <span className="branch-user-name">{user?.full_name || user?.username || 'Yönetici'}</span>
              <span className="branch-user-role">Şube Yöneticisi</span>
            </div>
          </div>
          <button className="branch-logout-btn" onClick={handleLogout}>
            <LogOut className="branch-logout-icon" />
            <span>Çıkış</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="branch-main">
        <header className="branch-header">
          <h1 className="branch-page-title">{title}</h1>
          <div className="branch-header-actions">
            <span className="branch-header-date">
              {new Date().toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </header>
        <div className="branch-content">
          {children}
        </div>
      </main>
    </div>
  );
}

