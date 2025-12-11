import { useState } from 'react';
import AppointmentCard from './AppointmentCard';
import './Appointments.css';

function AppointmentList({ appointments, userType }) {
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' or 'past'

  // console.log("All: ", appointments)

  const filteredAppointments = appointments.filter(app => {
    const appointmentDate = new Date(app.scheduled_for);
    const now = new Date();
    if (filter === 'upcoming') {
      return appointmentDate >= now;
    }
    return appointmentDate < now;
  }).sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for));

  // console.log("Filtered: ", filteredAppointments)

  return (
    <div className="appointments-container">
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Planlanan
        </button>
        <button 
          className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Geçmiş
        </button>
      </div>
      <div className="appointments-grid">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(app => <AppointmentCard key={app.id} appointment={app} userType={userType} />)
        ) : (
          <p className="no-appointments">No {filter} appointments found.</p>
        )}
      </div>
    </div>
  );
}

export default AppointmentList;