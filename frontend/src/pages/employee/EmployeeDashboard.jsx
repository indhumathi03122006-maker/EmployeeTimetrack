import React, { useContext, useEffect, useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import attendanceService from '../../services/attendanceService';
import workSessionService from '../../services/workSessionService';
import agentService from '../../services/agentService';
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
  Monitor,
} from 'lucide-react';
import SidebarBrand from '../../components/SidebarBrand';
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
    <SidebarBrand role="EMPLOYEE" />

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
      <NavLink to="/employee/application-activity" className={({ isActive }) => isActive ? 'active-link' : ''}>
        <Monitor size={16} /> Application Activity
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
      {user?.role === 'manager' && (
        <NavLink to="/manager/dashboard" className="dash-btn" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', width: '100%' }}>
          Manager View
        </NavLink>
      )}
      <button className="dash-btn logout-btn" onClick={onLogout}>
        <LogOut size={14} /> Logout
      </button>
    </div>
  </aside>
);

/* ── Status Badge ─────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    active: { label: 'Active', cls: 'active' },
    idle: { label: 'Idle', cls: 'idle' },
    ended: { label: 'Ended', cls: 'ended' },
    'not-started': { label: 'Not Started', cls: 'not-started' },
    present: { label: 'Present', cls: 'present' },
    absent: { label: 'Absent', cls: 'not-started' },
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
  const [session, setSession] = useState(null);   // current work session or null
  const [loadingInit, setLoadingInit] = useState(true);

  // Per-button loading states
  const [loadingCheckIn, setLoadingCheckIn] = useState(false);
  const [loadingCheckOut, setLoadingCheckOut] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingEnd, setLoadingEnd] = useState(false);
  const [loadingBreak, setLoadingBreak] = useState(false);

  const [agentConnecting, setAgentConnecting] = useState(false);

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
      // 1. Start the work session directly first
      await workSessionService.startWorkSession();
      await fetchState();

      // 2. Try to connect to the agent in the background (non-blocking)
      try {
        const statusRes = await agentService.getStatus();
        if (statusRes && statusRes.connected) {
          window.location.href = 'employee-track://open';
        } else {
          const pairingRes = await agentService.requestPairingCode();
          if (pairingRes && pairingRes.success) {
            const code = pairingRes.code;
            console.log('[Frontend] Launching agent with protocol');
            window.location.href = `employee-track://connect/${code}`;
          }
        }
      } catch (agentErr) {
        console.log('[Frontend] Desktop Agent not reachable, continuing without it:', agentErr);
      }
    } catch (err) {
      setError(err.message || 'Error starting work session');
    } finally {
      setLoadingStart(false);
      setAgentConnecting(false);
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

  const handleStartBreak = async () => {
    if (!session || (session.status !== 'active' && session.status !== 'idle')) return;
    if (attendance?.isOnBreak) return; // prevent if already on break
    setError('');
    setLoadingBreak(true);
    try {
      await attendanceService.startBreak();
      await fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBreak(false);
    }
  };

  const handleEndBreak = async () => {
    if (!attendance?.isOnBreak) return;
    setError('');
    setLoadingBreak(true);
    try {
      await attendanceService.endBreak();
      await fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBreak(false);
    }
  };

  /* ── Derived state ─────────────────────────────────── */
  const isCheckedIn = !!attendance?.checkIn;
  const isCheckedOut = !!attendance?.checkOut;
  const sessionStatus = session?.status || 'not-started';
  const sessionActive = sessionStatus === 'active' || sessionStatus === 'idle';
  const isBreakActive = !!attendance?.isOnBreak;

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

        <div className="dash-stats-grid">
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <CalendarCheck size={16} style={{ color: '#3b82f6' }} />
              <span className="dash-stat-label">Attendance</span>
            </div>
            <div className="dash-stat-value" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', height: '100%' }}>
              {isCheckedIn ? <StatusBadge status="present" /> : <StatusBadge status="absent" />}
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <Timer size={16} style={{ color: '#22c55e' }} />
              <span className="dash-stat-label">Work Time</span>
            </div>
            <div className="dash-stat-value">
              {isCheckedOut && attendance?.workDuration > 0
                ? formatMinutes(attendance.workDuration)
                : formatMinutes(session?.activeDuration)}
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <Pause size={16} style={{ color: '#f59e0b' }} />
              <span className="dash-stat-label">Break Time</span>
            </div>
            <div className="dash-stat-value">
              {formatMinutes(attendance?.breakDuration)}
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <Activity size={16} style={{ color: '#8b5cf6' }} />
              <span className="dash-stat-label">Current Status</span>
            </div>
            <div className="dash-stat-value" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', height: '100%' }}>
              <StatusBadge status={sessionStatus} />
            </div>
          </div>
        </div>

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
                <>
                  <button
                    className="dash-btn primary"
                    onClick={handleStartWork}
                    disabled={loadingStart || agentConnecting}
                    id="btn-start-work"
                  >
                    <Play size={14} />
                    {agentConnecting ? 'Waiting for Agent...' : loadingStart ? 'Starting…' : 'Start Work'}
                  </button>
                  <button
                    className="dash-btn warning"
                    onClick={() => {}}
                    disabled={true}
                    id="btn-start-break"
                  >
                    <Pause size={14} />
                    Start Break
                  </button>
                </>
              )}

              {/* Active session — show activity controls */}
              {sessionActive && (
                <>

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
                  {isBreakActive ? (
                    <button
                      className="dash-btn primary"
                      onClick={handleEndBreak}
                      disabled={loadingBreak}
                      id="btn-end-break"
                    >
                      <Play size={14} />
                      {loadingBreak ? 'Ending Break…' : 'End Break'}
                    </button>
                  ) : (
                    <button
                      className="dash-btn warning"
                      onClick={handleStartBreak}
                      disabled={loadingBreak}
                      id="btn-start-break"
                    >
                      <Pause size={14} />
                      {loadingBreak ? 'Starting Break…' : 'Start Break'}
                    </button>
                  )}
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

          {/* ── Card C: My Shift ───────────────── */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-icon"><Clock size={16} /></div>
              <p className="dash-card-title">My Shift</p>
            </div>
            
            {!user?.shift ? (
              <div className="attendance-row" style={{ justifyContent: 'center', padding: '20px 0' }}>
                <span className="attendance-label" style={{ fontStyle: 'italic', color: '#64748b' }}>No shift assigned</span>
              </div>
            ) : (
              <>
                <div className="attendance-row">
                  <span className="attendance-label">Shift Name</span>
                  <span className="attendance-value" style={{ fontWeight: '500' }}>{user.shift.name}</span>
                </div>
                <div className="attendance-row">
                  <span className="attendance-label">Time</span>
                  <span className="attendance-value">{user.shift.startTime} - {user.shift.endTime}</span>
                </div>
                <div className="attendance-row">
                  <span className="attendance-label">Working Days</span>
                  <span className="attendance-value" style={{ fontSize: '12px', textAlign: 'right' }}>{user.shift.workingDays?.join(', ')}</span>
                </div>
                {user.shift.extraBreaks && user.shift.extraBreaks.length > 0 && (
                  <div className="attendance-row" style={{ alignItems: 'flex-start' }}>
                    <span className="attendance-label">Breaks</span>
                    <div className="attendance-value" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                      {user.shift.extraBreaks.map((b, idx) => (
                        <span key={idx} style={{ fontSize: '12px', color: '#64748b' }}>• {b.startTime} - {b.endTime}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
