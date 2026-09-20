import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import attendanceService from '../../services/attendanceService';
import { EmployeeSidebar } from './EmployeeDashboard';
import { AlertCircle, LogIn, LogOut, CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import './EmployeeDashboard.css';

/* ── Helpers ──────────────────────────────────────────── */
const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatMinutes = (mins) => {
  if (mins == null || isNaN(mins) || mins === 0) return '0h 0m';
  const totalMins = Math.floor(mins);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m}m`;
};

const StatusBadge = ({ status }) => {
  const map = {
    present: { label: 'Present', cls: 'present' },
    absent:  { label: 'Absent',  cls: 'ended'   },
  };
  const { label, cls } = map[status] || { label: status, cls: 'not-started' };
  return (
    <span className={`status-badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
};

/* ── Attendance Page ──────────────────────────────────── */
const Attendance = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [history, setHistory]                 = useState([]);
  const [pagination, setPagination]           = useState({ page: 1, totalPages: 1, total: 0 });
  const [loadingPage, setLoadingPage]         = useState(true);
  const [loadingCheckIn,  setLoadingCheckIn]  = useState(false);
  const [loadingCheckOut, setLoadingCheckOut] = useState(false);
  const [error, setError]                     = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ── Fetch ─────────────────────────────────────────── */
  const fetchAll = useCallback(async (page = 1) => {
    setError('');
    try {
      const [todayRes, histRes] = await Promise.all([
        attendanceService.getTodayAttendance(),
        attendanceService.getAttendanceHistory(page, 10),
      ]);
      setTodayAttendance(todayRes.attendance || null);
      setHistory(histRes.attendance || []);
      setPagination(histRes.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load attendance data');
    }
  }, []);

  useEffect(() => {
    fetchAll(1).finally(() => setLoadingPage(false));
  }, [fetchAll]);

  /* ── Actions ───────────────────────────────────────── */
  const handleCheckIn = async () => {
    setError('');
    setLoadingCheckIn(true);
    try {
      await attendanceService.checkIn();
      await fetchAll(pagination.page);
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
      await fetchAll(pagination.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCheckOut(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchAll(newPage);
  };

  /* ── Derived ───────────────────────────────────────── */
  const isCheckedIn  = !!todayAttendance?.checkIn;
  const isCheckedOut = !!todayAttendance?.checkOut;

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="dashboard-layout">
      <EmployeeSidebar user={user} onLogout={handleLogout} />

      <main className="dashboard-main">
        <h1 className="dashboard-page-title">Attendance</h1>
        <p className="dashboard-page-subtitle">Manage your daily attendance records.</p>

        {error && (
          <div className="dash-error">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loadingPage ? (
          <div className="dash-loading">Loading attendance…</div>
        ) : (
          <>
            {/* ── Today's Card ─────────────────────────── */}
            <div className="dash-card" style={{ marginBottom: '20px' }}>
              <div className="dash-card-header">
                <div className="dash-card-icon"><CalendarCheck size={16} /></div>
                <p className="dash-card-title">Today — {formatDate(new Date())}</p>
              </div>

              {todayAttendance ? (
                <>
                  <div className="attendance-row">
                    <span className="attendance-label">Status</span>
                    <StatusBadge status={todayAttendance.status} />
                  </div>
                  <div className="attendance-row">
                    <span className="attendance-label">Check In</span>
                    <span className="attendance-value">{formatTime(todayAttendance.checkIn)}</span>
                  </div>
                  <div className="attendance-row">
                    <span className="attendance-label">Check Out</span>
                    <span className={`attendance-value ${!todayAttendance.checkOut ? 'not-set' : ''}`}>
                      {formatTime(todayAttendance.checkOut) || '—'}
                    </span>
                  </div>
                  <div className="attendance-row">
                    <span className="attendance-label">Work Duration</span>
                    <span className="attendance-value">{formatMinutes(todayAttendance.workDuration)}</span>
                  </div>
                </>
              ) : (
                <div className="attendance-row">
                  <span className="attendance-value not-set">No attendance record for today.</span>
                </div>
              )}

              <div className="btn-row">
                {!isCheckedIn && (
                  <button
                    className="dash-btn success"
                    onClick={handleCheckIn}
                    disabled={loadingCheckIn}
                    id="att-btn-check-in"
                  >
                    <LogIn size={14} />
                    {loadingCheckIn ? 'Checking In…' : 'Check In'}
                  </button>
                )}
                {isCheckedIn && !isCheckedOut && (
                  <button
                    className="dash-btn danger"
                    onClick={handleCheckOut}
                    disabled={loadingCheckOut}
                    id="att-btn-check-out"
                  >
                    <LogOut size={14} />
                    {loadingCheckOut ? 'Checking Out…' : 'Check Out'}
                  </button>
                )}
                {isCheckedOut && (
                  <span className="status-badge ended"><span className="badge-dot" /> Checked Out</span>
                )}
              </div>
            </div>

            {/* ── History Table ─────────────────────────── */}
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-icon"><CalendarCheck size={16} /></div>
                <p className="dash-card-title">Attendance History</p>
              </div>

              {history.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b' }}>No past attendance records found.</p>
              ) : (
                <>
                  <div className="attendance-table-wrap">
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Check In</th>
                          <th>Check Out</th>
                          <th>Status</th>
                          <th>Work Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((rec) => (
                          <tr key={rec._id}>
                            <td>{formatDate(rec.date)}</td>
                            <td>{formatTime(rec.checkIn)}</td>
                            <td>{formatTime(rec.checkOut)}</td>
                            <td><StatusBadge status={rec.status} /></td>
                            <td>{formatMinutes(rec.workDuration)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pagination-row">
                    <button
                      className="dash-btn secondary"
                      style={{ height: '32px', padding: '0 10px' }}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      id="att-page-prev"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button
                      className="dash-btn secondary"
                      style={{ height: '32px', padding: '0 10px' }}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      id="att-page-next"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Attendance;
