import React, { useState } from 'react';
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
  Users,
  Monitor,
  Menu,
  X,
} from 'lucide-react';
import SidebarBrand from './SidebarBrand';

export const ManagerSidebar = ({ user, onLogout, unreadCount = 0 }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Top Header (only visible <= 768px via CSS) */}
      <header className="mobile-topbar">
        <SidebarBrand role="MANAGER" />
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobile} />
      )}

      {/* Sidebar Drawer */}
      <aside className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <SidebarBrand role="MANAGER" />
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/manager/dashboard" onClick={closeMobile} className={({ isActive }) => isActive ? 'active-link' : ''}>
            <Home size={16} /> Dashboard
          </NavLink>
          <NavLink to="/manager/employees" onClick={closeMobile} className={({ isActive }) => isActive ? 'active-link' : ''}>
            <Users size={16} /> Employees
          </NavLink>
          <NavLink to="/manager/attendance" onClick={closeMobile} className={({ isActive }) => isActive ? 'active-link' : ''}>
            <CalendarCheck size={16} /> Attendance
          </NavLink>
          <NavLink to="/manager/work-time" onClick={closeMobile} className={({ isActive }) => isActive ? 'active-link' : ''}>
            <Timer size={16} /> Work Time
          </NavLink>
          <NavLink to="/manager/current-activity" onClick={closeMobile} className={({ isActive }) => isActive ? 'active-link' : ''}>
            <Activity size={16} /> Current Activity
          </NavLink>
          <NavLink to="/manager/application-activity" onClick={closeMobile} className={({ isActive }) => isActive ? 'active-link' : ''}>
            <Monitor size={16} /> Application Activity
          </NavLink>
          <NavLink to="/manager/reports" onClick={closeMobile} className={({ isActive }) => isActive ? 'active-link' : ''}>
            <FileText size={16} /> Reports
          </NavLink>
          <NavLink to="/manager/notifications" onClick={closeMobile} className={({ isActive }) => isActive ? 'active-link' : ''}>
            <Bell size={16} /> Notifications
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </NavLink>
          <NavLink to="/manager/settings" onClick={closeMobile} className={({ isActive }) => isActive ? 'active-link' : ''}>
            <Settings size={16} /> Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <strong>{user?.name}</strong>
            {user?.role}
          </div>
          <NavLink to="/employee/dashboard" onClick={closeMobile} className="dash-btn secondary" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', width: '100%' }}>
             My Tracking
          </NavLink>
          <button className="dash-btn logout-btn" onClick={onLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default ManagerSidebar;
