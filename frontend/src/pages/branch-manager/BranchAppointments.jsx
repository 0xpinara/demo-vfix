import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import BranchManagerLayout from '../../components/branch-manager/BranchManagerLayout';
import api from '../../services/api';
import { 
  RefreshCw,
  AlertTriangle,
  User,
  MapPin,
  Wrench,
  Clock,
  ChevronRight,
  X,
  Check,
  Calendar as CalendarIcon
} from 'lucide-react';
import './BranchAppointments.css';

export default function BranchAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reassigning, setReassigning] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get appointments for the month
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
      
      const response = await api.get('/branch-manager/appointments', {
        params: {
          date_from: startOfMonth.toISOString(),
          date_to: endOfMonth.toISOString()
        }
      });
      setAppointments(response.data.appointments);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Randevular yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/branch-manager/technicians');
      setTechnicians(response.data);
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchTechnicians();
  }, [fetchAppointments]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_for);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  const hasAppointments = (date) => {
    return getAppointmentsForDate(date).length > 0;
  };

  const hasConflict = (date) => {
    return getAppointmentsForDate(date).some(apt => apt.has_vacation_conflict);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayAppointments = getAppointmentsForDate(date);
      if (dayAppointments.length > 0) {
        const conflictCount = dayAppointments.filter(a => a.has_vacation_conflict).length;
        return (
          <div className="calendar-tile-content">
            <span className="appointment-count">{dayAppointments.length}</span>
            {conflictCount > 0 && (
              <span className="conflict-indicator" title={`${conflictCount} çakışma`}>
                <AlertTriangle size={10} />
              </span>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const classes = [];
      if (hasAppointments(date)) {
        classes.push('has-appointments');
      }
      if (hasConflict(date)) {
        classes.push('has-conflict');
      }
      return classes.join(' ');
    }
    return null;
  };

  const handleReassign = async () => {
    if (!selectedAppointment || !selectedTechnician) return;

    try {
      setReassigning(true);
      await api.post(`/branch-manager/appointments/${selectedAppointment.id}/reassign`, {
        new_technician_id: selectedTechnician
      });
      
      // Refresh appointments
      await fetchAppointments();
      setSelectedAppointment(null);
      setSelectedTechnician('');
    } catch (err) {
      console.error('Failed to reassign:', err);
      alert(err.response?.data?.detail || 'Randevu atanırken bir hata oluştu');
    } finally {
      setReassigning(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Beklemede', class: 'pending' },
      scheduled: { label: 'Planlandı', class: 'scheduled' },
      completed: { label: 'Tamamlandı', class: 'completed' },
      cancelled: { label: 'İptal', class: 'cancelled' }
    };
    const s = statusMap[status] || { label: status, class: 'default' };
    return <span className={`status-badge ${s.class}`}>{s.label}</span>;
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && appointments.length === 0) {
    return (
      <BranchManagerLayout title="Randevu Takvimi">
        <div className="loading-state">
          <RefreshCw className="loading-icon" />
          <p>Randevular yükleniyor...</p>
        </div>
      </BranchManagerLayout>
    );
  }

  return (
    <BranchManagerLayout title="Randevu Takvimi">
      <div className="branch-appointments-page">
        <div className="appointments-container">
          {/* Calendar Section */}
          <div className="calendar-section">
            <div className="calendar-wrapper">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                locale="tr-TR"
                tileContent={tileContent}
                tileClassName={tileClassName}
                onActiveStartDateChange={({ activeStartDate }) => {
                  setSelectedDate(activeStartDate);
                }}
              />
            </div>
            
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot normal"></span>
                <span>Randevu var</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot conflict"></span>
                <span>İzin çakışması</span>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="appointments-list-section">
            <div className="list-header">
              <h3>
                <CalendarIcon className="header-icon" />
                {selectedDate.toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
              <span className="appointment-count-badge">
                {selectedDateAppointments.length} randevu
              </span>
            </div>

            <div className="appointments-list">
              {selectedDateAppointments.length === 0 ? (
                <div className="no-appointments">
                  <CalendarIcon className="no-data-icon" />
                  <p>Bu tarihte randevu bulunmuyor</p>
                </div>
              ) : (
                selectedDateAppointments.map((apt) => (
                  <div 
                    key={apt.id} 
                    className={`appointment-card ${apt.has_vacation_conflict ? 'conflict' : ''}`}
                    onClick={() => setSelectedAppointment(apt)}
                  >
                    {apt.has_vacation_conflict && (
                      <div className="conflict-banner">
                        <AlertTriangle size={14} />
                        <span>Teknisyen bu tarihte izinde!</span>
                      </div>
                    )}
                    
                    <div className="appointment-header">
                      <div className="time-badge">
                        <Clock size={14} />
                        {formatTime(apt.scheduled_for)}
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                    
                    <div className="appointment-body">
                      <div className="info-row">
                        <User size={14} />
                        <span>{apt.customer_name}</span>
                      </div>
                      <div className="info-row">
                        <Wrench size={14} />
                        <span>{apt.product_brand} {apt.product_model}</span>
                      </div>
                      <div className="info-row issue">
                        <span>{apt.product_issue}</span>
                      </div>
                      <div className="info-row">
                        <MapPin size={14} />
                        <span>{apt.location}</span>
                      </div>
                    </div>
                    
                    <div className="appointment-footer">
                      <div className={`technician-badge ${!apt.technician_name ? 'unassigned' : ''}`}>
                        {apt.technician_name || 'Atanmadı'}
                      </div>
                      <ChevronRight size={16} className="chevron" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Reassign Modal */}
        {selectedAppointment && (
          <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Randevu Detayı</h3>
                <button className="close-btn" onClick={() => setSelectedAppointment(null)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                {selectedAppointment.has_vacation_conflict && (
                  <div className="modal-conflict-warning">
                    <AlertTriangle size={18} />
                    <span>
                      {selectedAppointment.technician_name} bu tarihte izinde. 
                      Lütfen başka bir teknisyen atayın.
                    </span>
                  </div>
                )}
                
                <div className="modal-info">
                  <div className="info-group">
                    <label>Müşteri</label>
                    <span>{selectedAppointment.customer_name}</span>
                  </div>
                  <div className="info-group">
                    <label>Tarih & Saat</label>
                    <span>
                      {new Date(selectedAppointment.scheduled_for).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="info-group">
                    <label>Ürün</label>
                    <span>{selectedAppointment.product_brand} {selectedAppointment.product_model}</span>
                  </div>
                  <div className="info-group">
                    <label>Sorun</label>
                    <span>{selectedAppointment.product_issue}</span>
                  </div>
                  <div className="info-group">
                    <label>Konum</label>
                    <span>{selectedAppointment.location}</span>
                  </div>
                  <div className="info-group">
                    <label>Mevcut Teknisyen</label>
                    <span>{selectedAppointment.technician_name || 'Atanmadı'}</span>
                  </div>
                </div>
                
                <div className="reassign-section">
                  <h4>Teknisyen Ata / Değiştir</h4>
                  <select 
                    value={selectedTechnician} 
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    className="technician-select"
                  >
                    <option value="">Teknisyen seçin...</option>
                    {technicians.map((tech) => (
                      <option 
                        key={tech.id} 
                        value={tech.id}
                        disabled={tech.is_on_vacation}
                      >
                        {tech.full_name} {tech.is_on_vacation ? '(İzinde)' : ''}
                      </option>
                    ))}
                  </select>
                  
                  <button 
                    className="reassign-btn"
                    onClick={handleReassign}
                    disabled={!selectedTechnician || reassigning}
                  >
                    {reassigning ? (
                      <>
                        <RefreshCw className="spin" size={16} />
                        Atanıyor...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Teknisyen Ata
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BranchManagerLayout>
  );
}

