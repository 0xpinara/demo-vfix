import React, { useState } from 'react';
import AppointmentList from './AppointmentList';
import AppointmentCalendar from './AppointmentCalendar';
import { Calendar, List } from 'lucide-react';
import './AppointmentViewToggle.css';

function AppointmentViewToggle({ appointments, userType }) {
  const [view, setView] = useState('calendar'); // Default to calendar like Vacations

  return (
    <div className="appointment-toggle-wrapper">
      <div className="view-toggle">
        <button
          className={`toggle-btn ${view === 'calendar' ? 'active' : ''}`}
          onClick={() => setView('calendar')}
        >
          <Calendar size={16} />
          Takvim
        </button>
        <button
          className={`toggle-btn ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          <List size={16} />
          Liste
        </button>
      </div>

      <div className="appointment-view-content">
        {view === 'list' ? (
          <AppointmentList appointments={appointments} userType={userType} />
        ) : (
          <AppointmentCalendar appointments={appointments} userType={userType} />
        )}
      </div>
    </div>
  );
}

export default AppointmentViewToggle;