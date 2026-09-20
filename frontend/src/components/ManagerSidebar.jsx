import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Clock,
  LogOut,
  Home,
  CalendarCheck,
  Timer,
  Activity,
  FileText,
  Bell,
  Settings,
  Users
} from 'lucide-react';

export const ManagerSidebar = ({ user, onLogout, unreadCount = 0 }) => (
  <aside className="dashboard-sidebar">
    <div className="sidebar-brand">
      <Clock size={20} />
      <span>
        <span className="brand-employee">Employee</span>
        <span className="brand-track">Track</span>
      </span>
      <span style={{ fontSize: '10px', marginLeft: '4px', background: '#e2e8f0', color: '#475569', padding: '2px 4px', borderRadius: '4px' }}>MGR</span>
    </div>

    <nav className="sidebar-nav">
      <NavLink to="/manager/dashboard" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Home size={16} /> Dashboard
      </NavLink>
      <NavLink to="/manager/employees" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Users size={16} /> Employees
      </NavLink>
      <NavLink to="/manager/attendance" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <CalendarCheck size={16} /> Attendance
      </NavLink>
      <NavLink to="/manager/work-time" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Timer size={16} /> Work Time
      </NavLink>
      <NavLink to="/manager/current-activity" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Activity size={16} /> Current Activity
      </NavLink>
      <NavLink to="/manager/reports" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <FileText size={16} /> Reports
      </NavLink>
      <NavLink to="/manager/notifications" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Bell size={16} /> Notifications
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </NavLink>
      <NavLink to="/manager/settings" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Settings size={16} /> Settings
      </NavLink>
    </nav>

    <div className="sidebar-footer">
      <div className="sidebar-user-info">
        <strong>{user?.name}</strong>
        {user?.role}
      </div>
      <button className="dash-btn logout-btn" onClick={onLogout}>
        <LogOut size={14} /> Logout
      </button>
    </div>
  </aside>
);

export default ManagerSidebar;
