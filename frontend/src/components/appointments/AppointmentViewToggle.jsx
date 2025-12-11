import React, { useState } from 'react';
import AppointmentList from './AppointmentList';
import AppointmentCalendar from './AppointmentCalendar';
import './AppointmentViewToggle.css'; // For styling the toggle buttons

function AppointmentViewToggle({ appointments, userType }) {
  const [view, setView] = useState('list'); // 'list' or 'calendar'

  return (
    <div className="appointment-view-toggle-container">
      <div className="view-toggle-buttons">
        <button
          className={`toggle-button ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          Liste Görünümü
        </button>
        <button
          className={`toggle-button ${view === 'calendar' ? 'active' : ''}`}
          onClick={() => setView('calendar')}
        >
          Takvim Görünümü
        </button>
      </div>

      {view === 'list' ? (
        <AppointmentList appointments={appointments} userType={userType} />
      ) : (
        <AppointmentCalendar appointments={appointments} userType={userType} />
      )}
    </div>
  );
}

export default AppointmentViewToggle;