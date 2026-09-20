import React, { useContext, useEffect, useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import attendanceService from '../../services/attendanceService';
import workSessionService from '../../services/workSessionService';
import {
  Clock,
  LogIn,
  LogOut,
  Play,
  Square,
  Activity,
  Home,
  CalendarCheck,
  Timer,
  AlertCircle,
  Pause,
  FileText,
  Bell,
  Settings,
} from 'lucide-react';
import './EmployeeDashboard.css';

/* ── Helpers ──────────────────────────────────────────── */
const formatTime = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatMinutes = (mins) => {
  if (mins == null || isNaN(mins)) return '0h 0m';
  const totalMins = Math.floor(mins);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m}m`;
};

/* ── Sidebar shared component ─────────────────────────── */
export const EmployeeSidebar = ({ user, onLogout, unreadCount = 0 }) => (
  <aside className="dashboard-sidebar">
    <div className="sidebar-brand">
      <Clock size={20} />
      <span>
        <span className="brand-employee">Employee</span>
        <span className="brand-track">Track</span>
      </span>
    </div>

    <nav className="sidebar-nav">
      <NavLink to="/employee/dashboard" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Home size={16} /> Dashboard
      </NavLink>
      <NavLink to="/employee/attendance" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <CalendarCheck size={16} /> Attendance
      </NavLink>
      <NavLink to="/employee/work-time" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Timer size={16} /> Work Time
      </NavLink>
      <NavLink to="/employee/current-activity" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Activity size={16} /> Current Activity
      </NavLink>
      <NavLink to="/employee/reports" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <FileText size={16} /> Reports
      </NavLink>
      <NavLink to="/employee/notifications" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Bell size={16} /> Notifications
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </NavLink>
      <NavLink to="/employee/settings" className={({ isActive }) => isActive ? 'active-link' : ''}>
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

/* ── Status Badge ─────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    active:      { label: 'Active',      cls: 'active' },
    idle:        { label: 'Idle',        cls: 'idle' },
    ended:       { label: 'Ended',       cls: 'ended' },
    'not-started': { label: 'Not Started', cls: 'not-started' },
    present:     { label: 'Present',     cls: 'present' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'not-started' };
  return (
    <span className={`status-badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
};

/* ── Main Dashboard ───────────────────────────────────── */
const EmployeeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);   // today's attendance record or null
  const [session, setSession]       = useState(null);   // current work session or null
  const [loadingInit, setLoadingInit] = useState(true);

  // Per-button loading states
  const [loadingCheckIn,  setLoadingCheckIn]  = useState(false);
  const [loadingCheckOut, setLoadingCheckOut] = useState(false);
  const [loadingStart,    setLoadingStart]    = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingEnd,      setLoadingEnd]      = useState(false);

  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ── Fetch initial state ───────────────────────────── */
  const fetchState = useCallback(async () => {
    setError('');
    try {
      const [attRes, sessRes] = await Promise.all([
        attendanceService.getTodayAttendance(),
        workSessionService.getCurrentWorkSession(),
      ]);
      setAttendance(attRes.attendance || null);
      setSession(sessRes.session || null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    }
  }, []);

  useEffect(() => {
    fetchState().finally(() => setLoadingInit(false));
  }, [fetchState]);

  /* ── Actions ───────────────────────────────────────── */
  const handleCheckIn = async () => {
    setError('');
    setLoadingCheckIn(true);
    try {
      await attendanceService.checkIn();
      await fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCheckIn(false);
    }
  };

  const handleCheckOut = async () => {
    setError('');
    setLoadingCheckOut(true);
    try {
      await attendanceService.checkOut();
      await fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCheckOut(false);
    }
  };

  const handleStartWork = async () => {
    setError('');
    setLoadingStart(true);
    try {
      await workSessionService.startWorkSession();
      await fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStart(false);
    }
  };

  const handleActivity = async (status) => {
    setError('');
    setLoadingActivity(true);
    try {
      await workSessionService.updateActivity(status);
      await fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleEndWork = async () => {
    setError('');
    setLoadingEnd(true);
    try {
      await workSessionService.endWorkSession();
      await fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingEnd(false);
    }
  };

  /* ── Derived state ─────────────────────────────────── */
  const isCheckedIn  = !!attendance?.checkIn;
  const isCheckedOut = !!attendance?.checkOut;
  const sessionStatus = session?.status || 'not-started';
  const sessionActive = sessionStatus === 'active' || sessionStatus === 'idle';

  /* ── Render ────────────────────────────────────────── */
  if (loadingInit) {
    return (
      <div className="dashboard-layout">
        <EmployeeSidebar user={user} onLogout={handleLogout} />
        <main className="dashboard-main">
          <div className="dash-loading">Loading your workspace…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <EmployeeSidebar user={user} onLogout={handleLogout} />

      <main className="dashboard-main">
        <h1 className="dashboard-page-title">Dashboard</h1>
        <p className="dashboard-page-subtitle">
          Welcome back, <strong>{user?.name}</strong>. Here's your work overview for today.
        </p>

        {/* Error Banner */}
        {error && (
          <div className="dash-error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <div className="dashboard-grid">
          {/* ── Card A: Today's Attendance ─────────────── */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-icon"><CalendarCheck size={16} /></div>
              <p className="dash-card-title">Today's Attendance</p>
            </div>

            <div className="attendance-row">
              <span className="attendance-label">Status</span>
              {isCheckedIn
                ? <StatusBadge status="present" />
                : <span className="attendance-value not-set">Not Checked In</span>}
            </div>

            <div className="attendance-row">
              <span className="attendance-label">Check In</span>
              <span className={`attendance-value ${!attendance?.checkIn ? 'not-set' : ''}`}>
                {formatTime(attendance?.checkIn) || '—'}
              </span>
            </div>

            <div className="attendance-row">
              <span className="attendance-label">Check Out</span>
              <span className={`attendance-value ${!attendance?.checkOut ? 'not-set' : ''}`}>
                {formatTime(attendance?.checkOut) || '—'}
              </span>
            </div>

            {attendance?.workDuration > 0 && (
              <div className="attendance-row">
                <span className="attendance-label">Work Duration</span>
                <span className="attendance-value">{formatMinutes(attendance.workDuration)}</span>
              </div>
            )}

            <div className="btn-row">
              {!isCheckedIn && (
                <button
                  className="dash-btn success"
                  onClick={handleCheckIn}
                  disabled={loadingCheckIn}
                  id="btn-check-in"
                >
                  <LogIn size={14} />
                  {loadingCheckIn ? 'Checking In…' : 'Check In'}
                </button>
              )}
              {isCheckedIn && !isCheckedOut && !sessionActive && (
                <button
                  className="dash-btn danger"
                  onClick={handleCheckOut}
                  disabled={loadingCheckOut}
                  id="btn-check-out"
                >
                  <LogOut size={14} />
                  {loadingCheckOut ? 'Checking Out…' : 'Check Out'}
                </button>
              )}
              {isCheckedOut && (
                <span className="status-badge ended"><span className="badge-dot" />Checked Out</span>
              )}
            </div>
          </div>

          {/* ── Card B+C+D: Work Session ───────────────── */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-icon"><Activity size={16} /></div>
              <p className="dash-card-title">Work Session</p>
            </div>

            {/* Current status */}
            <div className="attendance-row">
              <span className="attendance-label">Status</span>
              <StatusBadge status={sessionStatus} />
            </div>

            {/* Work time display (from backend) */}
            {session && (
              <div className="work-time-grid" style={{ marginTop: '14px' }}>
                <div className="work-time-item">
                  <div className="work-time-label">Active Time</div>
                  <div className="work-time-value active-time">
                    {formatMinutes(session.activeDuration)}
                  </div>
                </div>
                <div className="work-time-item">
                  <div className="work-time-label">Idle Time</div>
                  <div className="work-time-value idle-time">
                    {formatMinutes(session.idleDuration)}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="btn-row">
              {/* Not checked in — prompt */}
              {!isCheckedIn && (
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Please check in to start work.
                </span>
              )}

              {/* Checked in but no session yet */}
              {isCheckedIn && !session && !isCheckedOut && (
                <button
                  className="dash-btn primary"
                  onClick={handleStartWork}
                  disabled={loadingStart}
                  id="btn-start-work"
                >
                  <Play size={14} />
                  {loadingStart ? 'Starting…' : 'Start Work'}
                </button>
              )}

              {/* Active session — show activity controls */}
              {sessionActive && (
                <>
                  {sessionStatus === 'active' && (
                    <button
                      className="dash-btn warning"
                      onClick={() => handleActivity('idle')}
                      disabled={loadingActivity}
                      id="btn-mark-idle"
                    >
                      <Pause size={14} />
                      {loadingActivity ? 'Updating…' : 'Mark Idle'}
                    </button>
                  )}
                  {sessionStatus === 'idle' && (
                    <button
                      className="dash-btn success"
                      onClick={() => handleActivity('active')}
                      disabled={loadingActivity}
                      id="btn-mark-active"
                    >
                      <Play size={14} />
                      {loadingActivity ? 'Updating…' : 'Mark Active'}
                    </button>
                  )}
                  <button
                    className="dash-btn danger"
                    onClick={handleEndWork}
                    disabled={loadingEnd}
                    id="btn-end-work"
                  >
                    <Square size={14} />
                    {loadingEnd ? 'Ending…' : 'End Work'}
                  </button>
                </>
              )}

              {/* Session ended — allow check out */}
              {sessionStatus === 'ended' && !isCheckedOut && (
                <button
                  className="dash-btn danger"
                  onClick={handleCheckOut}
                  disabled={loadingCheckOut}
                  id="btn-check-out-after-end"
                >
                  <LogOut size={14} />
                  {loadingCheckOut ? 'Checking Out…' : 'Check Out'}
                </button>
              )}

              {isCheckedOut && (
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Work day complete. See you tomorrow!
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
