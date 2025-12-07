import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, 
  MessageSquare, 
  Wrench, 
  Database, 
  LogOut,
  Home,
  ChevronRight
} from 'lucide-react';
import './AdminLayout.css';

const navItems = [
  {
    path: '/admin',
    label: 'Genel İstatistikler',
    icon: BarChart3,
    exact: true
  },
  {
    path: '/admin/user-feedback',
    label: 'Kullanıcı Geri Bildirimi',
    icon: MessageSquare
  },
  {
    path: '/admin/technician-feedback',
    label: 'Teknisyen Geri Bildirimi',
    icon: Wrench
  },
  {
    path: '/admin/improvement-data',
    label: 'İyileştirme Verileri',
    icon: Database
  }
];

export default function AdminLayout({ children, title }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon-wrapper">
              <Home className="logo-icon" />
            </div>
            <div className="logo-text">
              <span className="logo-title">V-Fix</span>
              <span className="logo-subtitle">Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              <ChevronRight className="nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.full_name?.[0] || user?.username?.[0] || 'A'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.full_name || user?.username || 'Admin'}</span>
              <span className="user-role">Yönetici</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut className="logout-icon" />
            <span>Çıkış</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1 className="page-title">{title}</h1>
          <div className="header-actions">
            <span className="header-date">
              {new Date().toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}

