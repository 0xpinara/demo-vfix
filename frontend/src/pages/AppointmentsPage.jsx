import { useAuth } from '../context/AuthContext';
import TechnicianAppointments from './technician/Appointments';
import UserAppointments from './user/Appointments';
import { AppointmentProvider } from '../context/AppointmentContext';

function AppointmentsPage() {
  const { user } = useAuth();

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <AppointmentProvider>
      {user.enterprise_role !== null ? <TechnicianAppointments /> : <UserAppointments />}
    </AppointmentProvider>
  );
}

export default AppointmentsPage;
