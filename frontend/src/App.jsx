import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import Attendance from './pages/employee/Attendance';
import WorkTime from './pages/employee/WorkTime';
import CurrentActivity from './pages/employee/CurrentActivity';
import Reports from './pages/employee/Reports';
import Notifications from './pages/employee/Notifications';
import Settings from './pages/employee/Settings';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerEmployees from './pages/manager/ManagerEmployees';
import ManagerAttendance from './pages/manager/ManagerAttendance';
import ManagerWorkTime from './pages/manager/ManagerWorkTime';
import ManagerCurrentActivity from './pages/manager/ManagerCurrentActivity';
import ManagerReports from './pages/manager/ManagerReports';
import ManagerNotifications from './pages/manager/ManagerNotifications';
import ManagerSettings from './pages/manager/ManagerSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminWorkTime from './pages/admin/AdminWorkTime';
import AdminCurrentActivity from './pages/admin/AdminCurrentActivity';
import AdminReports from './pages/admin/AdminReports';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';
import { AuthContext } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard if they try to access another role's route
    if (user.role === 'employee') return <Navigate to="/employee/dashboard" replace />;
    if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route 
        path="/employee/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['employee', 'manager']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        } 
      />

      <Route
        path="/employee/attendance"
        element={
          <ProtectedRoute allowedRoles={['employee', 'manager']}>
            <Attendance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/work-time"
        element={
          <ProtectedRoute allowedRoles={['employee', 'manager']}>
            <WorkTime />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/current-activity"
        element={
          <ProtectedRoute allowedRoles={['employee', 'manager']}>
            <CurrentActivity />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/reports"
        element={
          <ProtectedRoute allowedRoles={['employee', 'manager']}>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/settings"
        element={
          <ProtectedRoute allowedRoles={['employee', 'manager']}>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/notifications"
        element={
          <ProtectedRoute allowedRoles={['employee', 'manager']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/manager/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/manager/employees" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerEmployees />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/manager/attendance" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerAttendance />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/manager/work-time" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerWorkTime />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/manager/current-activity" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerCurrentActivity />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/manager/reports" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerReports />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/manager/notifications" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerNotifications />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/manager/settings" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerSettings />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/employees" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminEmployees />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/attendance" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAttendance />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/work-time" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminWorkTime />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/current-activity" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCurrentActivity />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminReports />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/notifications" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNotifications />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
