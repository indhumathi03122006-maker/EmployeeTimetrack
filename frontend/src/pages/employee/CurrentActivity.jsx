import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import workSessionService from '../../services/workSessionService';
import { EmployeeSidebar } from './EmployeeDashboard';
import { AlertCircle, Play, Pause, Activity, CheckCircle2 } from 'lucide-react';
import './EmployeeDashboard.css';

/* ── Helpers ──────────────────────────────────────────── */
const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatMinutes = (mins) => {
  if (mins == null || isNaN(mins) || mins === 0) return '0m';
  const totalMins = Math.floor(mins);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
};

const StatusBadge = ({ status }) => {
  const map = {
    active:        { label: 'Active',      cls: 'active' },
    idle:          { label: 'Idle',        cls: 'idle' },
    ended:         { label: 'Ended',       cls: 'ended' },
    'not-started': { label: 'No Active Work Session', cls: 'not-started' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'not-started' };
  
  if (status === 'not-started') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '500' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#cbd5e1' }}></span>
            {label}
        </div>
      );
  }

  return (
    <span className={`status-badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
};

/* ── CurrentActivity Page ─────────────────────────────── */
const CurrentActivity = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    setSuccessMsg('');
    setLoadingActivity(true);
    try {
      await workSessionService.updateActivity(status);
      await fetchSession();
      setSuccessMsg(`Status updated to ${status === 'active' ? 'Active' : 'Idle'}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingActivity(false);
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
        <h1 className="dashboard-page-title">Current Activity</h1>
        <p className="dashboard-page-subtitle">Monitor and update your current work activity status.</p>

        {error && (
          <div className="dash-error">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {successMsg && (
           <div className="dash-info" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
              <CheckCircle2 size={15} /> {successMsg}
           </div>
        )}

        {loadingPage ? (
          <div className="dash-loading">Loading activity…</div>
        ) : (
          <div className="dash-card" style={{ maxWidth: '480px' }}>
            <div className="dash-card-header">
              <div className="dash-card-icon"><Activity size={16} /></div>
              <p className="dash-card-title">Current Status</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <StatusBadge status={sessionStatus} />
            </div>

            {sessionActive ? (
              <>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#334155', margin: '0 0 16px 0' }}>Work Session</h3>
                  
                  <div className="attendance-row">
                    <span className="attendance-label">Start Time</span>
                    <span className="attendance-value">{formatTime(session.startTime)}</span>
                  </div>
                  <div className="attendance-row">
                    <span className="attendance-label">Active Time</span>
                    <span className="attendance-value" style={{ color: '#15803d' }}>{formatMinutes(session.activeDuration)}</span>
                  </div>
                  <div className="attendance-row">
                    <span className="attendance-label">Idle Time</span>
                    <span className="attendance-value" style={{ color: '#a16207' }}>{formatMinutes(session.idleDuration)}</span>
                  </div>
                  <div className="attendance-row">
                    <span className="attendance-label">Current Status</span>
                    <span className="attendance-value" style={{ textTransform: 'capitalize' }}>{sessionStatus}</span>
                  </div>
                </div>

                <div className="btn-row">
                  <button
                    className="dash-btn success"
                    onClick={() => handleActivity('active')}
                    disabled={loadingActivity || sessionStatus === 'active'}
                    id="ca-btn-mark-active"
                    style={{ flex: 1 }}
                  >
                    <Play size={14} />
                    {loadingActivity && sessionStatus !== 'active' ? 'Updating…' : 'Mark Active'}
                  </button>
                  <button
                    className="dash-btn warning"
                    onClick={() => handleActivity('idle')}
                    disabled={loadingActivity || sessionStatus === 'idle'}
                    id="ca-btn-mark-idle"
                    style={{ flex: 1 }}
                  >
                    <Pause size={14} />
                    {loadingActivity && sessionStatus !== 'idle' ? 'Updating…' : 'Mark Idle'}
                  </button>
                </div>
              </>
            ) : (
               <div style={{ marginTop: '14px', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                  <p style={{ marginBottom: '8px' }}>No active work session</p>
                  <p>Please start a work session from the Work Time page.</p>
               </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CurrentActivity;
