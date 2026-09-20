import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import workSessionService from '../../services/workSessionService';
import { EmployeeSidebar } from './EmployeeDashboard';
import { AlertCircle, Play, Pause, Square, Timer, Activity } from 'lucide-react';
import './EmployeeDashboard.css';

/* ── Helpers ──────────────────────────────────────────── */
const formatMinutes = (mins) => {
  if (mins == null || isNaN(mins)) return '0h 0m';
  const totalMins = Math.floor(mins);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m}m`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const StatusBadge = ({ status }) => {
  const map = {
    active:        { label: 'Active',      cls: 'active' },
    idle:          { label: 'Idle',        cls: 'idle' },
    ended:         { label: 'Ended',       cls: 'ended' },
    'not-started': { label: 'Not Started', cls: 'not-started' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'not-started' };
  return (
    <span className={`status-badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
};

/* ── WorkTime Page ────────────────────────────────────── */
const WorkTime = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [session, setSession]       = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingEnd, setLoadingEnd] = useState(false);
  const [error, setError]           = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ── Fetch current session ─────────────────────────── */
  const fetchSession = useCallback(async () => {
    setError('');
    try {
      const res = await workSessionService.getCurrentWorkSession();
      setSession(res.session || null);
    } catch (err) {
      setError(err.message || 'Failed to load work session');
    }
  }, []);

  useEffect(() => {
    fetchSession().finally(() => setLoadingPage(false));
  }, [fetchSession]);

  /* ── Actions ───────────────────────────────────────── */
  const handleActivity = async (status) => {
    setError('');
    setLoadingActivity(true);
    try {
      await workSessionService.updateActivity(status);
      await fetchSession();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleEnd = async () => {
    setError('');
    setLoadingEnd(true);
    try {
      await workSessionService.endWorkSession();
      await fetchSession();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingEnd(false);
    }
  };

  /* ── Derived ───────────────────────────────────────── */
  const sessionStatus = session?.status || 'not-started';
  const sessionActive = sessionStatus === 'active' || sessionStatus === 'idle';

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="dashboard-layout">
      <EmployeeSidebar user={user} onLogout={handleLogout} />

      <main className="dashboard-main">
        <h1 className="dashboard-page-title">Work Time</h1>
        <p className="dashboard-page-subtitle">Today's work session details and controls.</p>

        {error && (
          <div className="dash-error">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loadingPage ? (
          <div className="dash-loading">Loading work session…</div>
        ) : (
          <div className="dash-card" style={{ maxWidth: '480px' }}>
            <div className="dash-card-header">
              <div className="dash-card-icon"><Timer size={16} /></div>
              <p className="dash-card-title">Today's Work Time</p>
            </div>

            {/* Status */}
            <div className="attendance-row">
              <span className="attendance-label">Current Status</span>
              <StatusBadge status={sessionStatus} />
            </div>

            {/* Times */}
            {session && (
              <>
                <div className="attendance-row">
                  <span className="attendance-label">Started At</span>
                  <span className="attendance-value">{formatTime(session.startTime)}</span>
                </div>
                {session.endTime && (
                  <div className="attendance-row">
                    <span className="attendance-label">Ended At</span>
                    <span className="attendance-value">{formatTime(session.endTime)}</span>
                  </div>
                )}
              </>
            )}

            {/* Active / Idle time blocks */}
            {session ? (
              <div className="work-time-grid" style={{ marginTop: '16px' }}>
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
            ) : (
              <div style={{ marginTop: '14px', fontSize: '13px', color: '#64748b' }}>
                No active work session found. Start a session from the Dashboard.
              </div>
            )}

            {/* Controls */}
            {sessionActive && (
              <div className="btn-row">
                {sessionStatus === 'active' && (
                  <button
                    className="dash-btn warning"
                    onClick={() => handleActivity('idle')}
                    disabled={loadingActivity}
                    id="wt-btn-mark-idle"
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
                    id="wt-btn-mark-active"
                  >
                    <Play size={14} />
                    {loadingActivity ? 'Updating…' : 'Mark Active'}
                  </button>
                )}
                <button
                  className="dash-btn danger"
                  onClick={handleEnd}
                  disabled={loadingEnd}
                  id="wt-btn-end-work"
                >
                  <Square size={14} />
                  {loadingEnd ? 'Ending…' : 'End Work'}
                </button>
              </div>
            )}

            {sessionStatus === 'ended' && (
              <div className="dash-info" style={{ marginTop: '14px' }}>
                <Activity size={15} />
                Work session ended. Return to Dashboard to check out.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkTime;
