import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon, Clock, MapPin, Tool, User, Info, AlertCircle } from 'lucide-react';
import './AppointmentCalendar.css';

function AppointmentCalendar({ appointments, userType }) {
  const [value, onChange] = useState(new Date());

  const statusTranslations = {
    scheduled: { label: 'Planlandı', class: 'scheduled', color: '#0891b2' },
    completed: { label: 'Tamamlandı', class: 'completed', color: '#10b981' },
    cancelled: { label: 'İptal Edildi', class: 'cancelled', color: '#ef4444' },
    pending: { label: 'Beklemede', class: 'pending', color: '#f59e0b' },
  };

  const getDayAppointments = (date) => {
    return appointments.filter(app => {
      const appDate = new Date(app.scheduled_for);
      return appDate.getDate() === date.getDate() &&
        appDate.getMonth() === date.getMonth() &&
        appDate.getFullYear() === date.getFullYear();
    }).sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for));
  };

  const selectedDayAppointments = getDayAppointments(value);

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayApps = getDayAppointments(date);
      if (dayApps.length > 0) {
        return (
          <div className="calendar-tile-content">
            {dayApps.slice(0, 3).map((app, i) => (
              <span
                key={i}
                className="calendar-dot"
                style={{ backgroundColor: statusTranslations[app.status]?.color || '#aaa' }}
              />
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month' && getDayAppointments(date).length > 0) {
      return 'has-appointments';
    }
    return null;
  };

  return (
    <div className="appointment-calendar-container">
      {/* Left Side: Calendar */}
      <div className="calendar-section">
        <div className="calendar-wrapper">
          <Calendar
            onChange={onChange}
            value={value}
            tileContent={tileContent}
            tileClassName={tileClassName}
            locale="tr-TR"
          />
        </div>

        <div className="calendar-legend">
          {Object.entries(statusTranslations).map(([key, config]) => (
            <div key={key} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: config.color }}></span>
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side: Details */}
      <div className="appointments-details-section">
        <div className="details-header">
          <h3>
            <CalendarIcon className="header-icon" />
            {value.toLocaleDateString('tr-TR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </h3>
        </div>

        <div className="appointments-list">
          {selectedDayAppointments.length === 0 ? (
            <div className="no-appointments">
              <CalendarIcon className="no-data-icon" />
              <p>Bu tarihte randevu bulunmuyor</p>
            </div>
          ) : (
            selectedDayAppointments.map(app => (
              <div key={app.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="time-badge">
                    <Clock size={14} />
                    {new Date(app.scheduled_for).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className={`status-badge ${statusTranslations[app.status]?.class}`}>
                    {statusTranslations[app.status]?.label || app.status}
                  </span>
                </div>

                <div className="appointment-body">
                  <div className="info-row">
                    <Tool size={16} />
                    <span className="product-info">{app.product_brand} {app.product_model}</span>
                  </div>

                  {userType === 'technician' && app.user && (
                    <div className="info-row">
                      <User size={16} />
                      <span>{app.user.full_name || app.user.username}</span>
                    </div>
                  )}

                  {userType === 'user' && app.technician && (
                    <div className="info-row">
                      <User size={16} />
                      <span>Teknisyen: {app.technician.full_name || app.technician.username}</span>
                    </div>
                  )}

                  {app.notes && (
                    <div className="info-row notes">
                      <Info size={16} />
                      <span>{app.notes}</span>
                    </div>
                  )}

                  {app.address && (
                    <div className="info-row address">
                      <MapPin size={16} />
                      <span>{app.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AppointmentCalendar;
