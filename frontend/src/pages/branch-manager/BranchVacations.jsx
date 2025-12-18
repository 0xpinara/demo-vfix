import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import BranchManagerLayout from '../../components/branch-manager/BranchManagerLayout';
import api from '../../services/api';
import { 
  RefreshCw,
  CalendarOff,
  User,
  Clock,
  Calendar as CalendarIcon,
  Briefcase,
  Heart,
  Home,
  AlertCircle
} from 'lucide-react';
import './BranchVacations.css';

const vacationTypeLabels = {
  annual: { label: 'Yıllık İzin', icon: Briefcase, color: '#0891b2' },
  sick: { label: 'Hastalık İzni', icon: Heart, color: '#ef4444' },
  personal: { label: 'Kişisel İzin', icon: Home, color: '#8b5cf6' },
  unpaid: { label: 'Ücretsiz İzin', icon: AlertCircle, color: '#f59e0b' },
  maternity: { label: 'Doğum İzni', icon: Heart, color: '#ec4899' },
  paternity: { label: 'Babalık İzni', icon: User, color: '#06b6d4' },
  marriage: { label: 'Evlilik İzni', icon: Heart, color: '#f472b6' },
  bereavement: { label: 'Vefat İzni', icon: AlertCircle, color: '#6b7280' },
  other: { label: 'Diğer', icon: CalendarOff, color: '#94a3b8' }
};

const statusLabels = {
  pending: { label: 'Beklemede', class: 'pending' },
  approved: { label: 'Onaylandı', class: 'approved' },
  rejected: { label: 'Reddedildi', class: 'rejected' },
  cancelled: { label: 'İptal', class: 'cancelled' }
};

export default function BranchVacations() {
  const [vacations, setVacations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  const fetchVacations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get vacations for broader range
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 2, 0);
      
      const response = await api.get('/branch-manager/vacations', {
        params: {
          date_from: startDate.toISOString(),
          date_to: endDate.toISOString()
        }
      });
      setVacations(response.data.vacations);
    } catch (err) {
      console.error('Failed to fetch vacations:', err);
      setError('İzinler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchVacations();
  }, [fetchVacations]);

  const getVacationsForDate = (date) => {
    return vacations.filter(v => {
      const start = new Date(v.start_date);
      const end = new Date(v.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);
      return checkDate >= start && checkDate <= end && v.status === 'approved';
    });
  };

  const selectedDateVacations = getVacationsForDate(selectedDate);

  const hasVacations = (date) => {
    return getVacationsForDate(date).length > 0;
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayVacations = getVacationsForDate(date);
      if (dayVacations.length > 0) {
        return (
          <div className="vacation-tile-content">
            {dayVacations.slice(0, 3).map((v, i) => (
              <span 
                key={i} 
                className="vacation-dot"
                style={{ backgroundColor: vacationTypeLabels[v.vacation_type]?.color || '#94a3b8' }}
                title={v.employee_name}
              />
            ))}
            {dayVacations.length > 3 && (
              <span className="more-indicator">+{dayVacations.length - 3}</span>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      if (hasVacations(date)) {
        return 'has-vacations';
      }
    }
    return null;
  };

  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const startStr = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Calculate days
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return `${startStr} - ${endStr} (${diffDays} gün)`;
  };

  const getVacationIcon = (type) => {
    const config = vacationTypeLabels[type] || vacationTypeLabels.other;
    const Icon = config.icon;
    return <Icon size={16} style={{ color: config.color }} />;
  };

  // Get all upcoming and current vacations
  const currentAndUpcoming = vacations
    .filter(v => {
      const end = new Date(v.end_date);
      return end >= new Date() && v.status === 'approved';
    })
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  if (loading && vacations.length === 0) {
    return (
      <BranchManagerLayout title="İzin Durumu">
        <div className="loading-state">
          <RefreshCw className="loading-icon" />
          <p>İzinler yükleniyor...</p>
        </div>
      </BranchManagerLayout>
    );
  }

  return (
    <BranchManagerLayout title="İzin Durumu">
      <div className="branch-vacations-page">
        {/* View Toggle */}
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon size={16} />
            Takvim
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <CalendarOff size={16} />
            Liste
          </button>
        </div>

        {viewMode === 'calendar' ? (
          <div className="vacations-container">
            {/* Calendar Section */}
            <div className="calendar-section">
              <div className="calendar-wrapper">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  locale="tr-TR"
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  onActiveStartDateChange={({ activeStartDate }) => {
                    setSelectedDate(activeStartDate);
                  }}
                />
              </div>
              
              <div className="vacation-legend">
                {Object.entries(vacationTypeLabels).slice(0, 5).map(([key, config]) => (
                  <div key={key} className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: config.color }}></span>
                    <span>{config.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Date Details */}
            <div className="vacations-details-section">
              <div className="details-header">
                <h3>
                  <CalendarOff className="header-icon" />
                  {selectedDate.toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                <span className="vacation-count-badge">
                  {selectedDateVacations.length} izinli
                </span>
              </div>

              <div className="vacations-list">
                {selectedDateVacations.length === 0 ? (
                  <div className="no-vacations">
                    <CalendarOff className="no-data-icon" />
                    <p>Bu tarihte izinde olan çalışan yok</p>
                  </div>
                ) : (
                  selectedDateVacations.map((vac) => (
                    <div key={vac.id} className="vacation-card">
                      <div className="vacation-header">
                        <div className="employee-info">
                          <div className="employee-avatar">
                            {vac.employee_name?.[0] || 'Ç'}
                          </div>
                          <span className="employee-name">{vac.employee_name}</span>
                        </div>
                        <div className="vacation-type-badge" style={{ 
                          backgroundColor: `${vacationTypeLabels[vac.vacation_type]?.color}20`,
                          color: vacationTypeLabels[vac.vacation_type]?.color 
                        }}>
                          {getVacationIcon(vac.vacation_type)}
                          <span>{vacationTypeLabels[vac.vacation_type]?.label}</span>
                        </div>
                      </div>
                      
                      <div className="vacation-body">
                        <div className="date-range">
                          <Clock size={14} />
                          <span>{formatDateRange(vac.start_date, vac.end_date)}</span>
                        </div>
                        {vac.reason && (
                          <p className="vacation-reason">{vac.reason}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="vacations-list-view">
            <div className="list-header-bar">
              <h3>Güncel ve Yaklaşan İzinler</h3>
              <span className="total-count">{currentAndUpcoming.length} kayıt</span>
            </div>
            
            <div className="vacations-table-wrapper">
              <table className="vacations-table">
                <thead>
                  <tr>
                    <th>Çalışan</th>
                    <th>İzin Türü</th>
                    <th>Başlangıç</th>
                    <th>Bitiş</th>
                    <th>Süre</th>
                    <th>Durum</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAndUpcoming.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        Güncel veya yaklaşan izin kaydı bulunmuyor
                      </td>
                    </tr>
                  ) : (
                    currentAndUpcoming.map((vac) => {
                      const startDate = new Date(vac.start_date);
                      const endDate = new Date(vac.end_date);
                      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                      const isActive = startDate <= new Date() && endDate >= new Date();
                      
                      return (
                        <tr key={vac.id} className={isActive ? 'active-vacation' : ''}>
                          <td className="employee-cell">
                            <div className="employee-avatar small">
                              {vac.employee_name?.[0] || 'Ç'}
                            </div>
                            <span>{vac.employee_name}</span>
                            {isActive && <span className="active-badge">Şu an izinde</span>}
                          </td>
                          <td>
                            <div className="type-cell" style={{ color: vacationTypeLabels[vac.vacation_type]?.color }}>
                              {getVacationIcon(vac.vacation_type)}
                              <span>{vacationTypeLabels[vac.vacation_type]?.label}</span>
                            </div>
                          </td>
                          <td>{startDate.toLocaleDateString('tr-TR')}</td>
                          <td>{endDate.toLocaleDateString('tr-TR')}</td>
                          <td className="duration-cell">{diffDays} gün</td>
                          <td>
                            <span className={`status-badge ${statusLabels[vac.status]?.class}`}>
                              {statusLabels[vac.status]?.label}
                            </span>
                          </td>
                          <td className="reason-cell">{vac.reason || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </BranchManagerLayout>
  );
}

