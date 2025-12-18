import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AppointmentCalendar.css'; // For custom styling

function AppointmentCalendar({ appointments, userType }) {
  const [value, onChange] = useState(new Date());
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);

  const statusTranslations = {
    scheduled: 'Planlandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
    pending: 'Beklemede',
  };

  // Function to mark dates with appointments
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasAppointments = appointments.some(app => {
        const appDate = new Date(app.scheduled_for);
        return appDate.getDate() === date.getDate() &&
               appDate.getMonth() === date.getMonth() &&
               appDate.getFullYear() === date.getFullYear();
      });
      return hasAppointments ? <div className="dot"></div> : null;
    }
  };

  // Function to handle day click
  const handleDayClick = (date) => {
    onChange(date); // Set the calendar to the clicked date
    const appointmentsOnDay = appointments.filter(app => {
      const appDate = new Date(app.scheduled_for);
      return appDate.getDate() === date.getDate() &&
             appDate.getMonth() === date.getMonth() &&
             appDate.getFullYear() === date.getFullYear();
    }).sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for)); // Sort by time

    setSelectedDayAppointments(appointmentsOnDay);
  };


  return (
    <div className="appointment-calendar-container">
      <div className="calendar-display">
        <Calendar
          onChange={handleDayClick}
          value={value}
          tileContent={tileContent}
          className="react-calendar-custom"
          locale="tr-TR" // Set locale for calendar
        />
      </div>
      <div className="selected-day-appointments">
        <h3>{selectedDayAppointments.length > 0 ? `Randevular - ${value.toLocaleDateString('tr-TR')}` : `Seçilen Gün: ${value.toLocaleDateString('tr-TR')}`}</h3>
        {selectedDayAppointments.length > 0 ? (
          <ul>
            {selectedDayAppointments.map(app => (
              <li key={app.id}>
                {new Date(app.scheduled_for).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - {app.product_brand} {app.product_model} ({statusTranslations[app.status] || app.status})
              </li>
            ))}
          </ul>
        ) : (
          <p>Bu gün için randevu bulunamadı.</p>
        )}
      </div>
    </div>
  );
}

export default AppointmentCalendar;
