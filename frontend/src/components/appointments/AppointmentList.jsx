import { useState } from 'react';
import AppointmentCard from './AppointmentCard';
import { Calendar, History } from 'lucide-react';
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
    <div className="appointment-list-container">
      <div className="view-toggle" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`toggle-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          <Calendar size={16} />
          Planlanan
        </button>
        <button
          className={`toggle-btn ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          <History size={16} />
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