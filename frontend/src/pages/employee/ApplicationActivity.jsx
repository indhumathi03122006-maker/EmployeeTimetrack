import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import appActivityService from '../../services/appActivityService';
import { EmployeeSidebar } from './EmployeeDashboard';
import { AlertCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Monitor } from 'lucide-react';
import './EmployeeDashboard.css';

/* ── Date Helpers ───────────────────────────────────────── */
const formatDateForInput = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* ── Classification Badge Component ─────────────────────── */
const TypeBadge = ({ classification }) => {
  const styles = {
    'Productive': { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    'Non-productive': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
    'Neutral': { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  };
  const current = styles[classification] || styles['Neutral'];

  return (
    <span style={{
      backgroundColor: current.bg,
      color: current.color,
      border: `1px solid ${current.border}`,
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block'
    }}>
      {classification || 'Neutral'}
    </span>
  );
};

/* ── ApplicationActivity Page Component ─────────────────── */
const ApplicationActivity = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const todayStr = formatDateForInput(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ── Fetch activities for selected date ─────────────── */
  const fetchActivities = useCallback(async (dateStr) => {
    setError('');
    setLoading(true);
    try {
      const res = await appActivityService.getAppActivities(dateStr);
      setActivities(res.activities || []);
    } catch (err) {
      setError(err.message || 'Failed to load application activity');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities(selectedDate);
  }, [selectedDate, fetchActivities]);

  /* ── Date Navigation Controls ────────────────────────── */
  const handlePrevDate = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(formatDateForInput(prev));
  };

  const handleNextDate = () => {
    if (selectedDate >= todayStr) return;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    const nextStr = formatDateForInput(next);
    if (nextStr <= todayStr) {
      setSelectedDate(nextStr);
    }
  };

  const handleDateInputChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    if (val > todayStr) {
      setSelectedDate(todayStr);
    } else {
      setSelectedDate(val);
    }
  };

  const isToday = selectedDate === todayStr;

  return (
    <div className="dashboard-layout">
      <EmployeeSidebar user={user} onLogout={handleLogout} />

      <main className="dashboard-main">
        <h1 className="dashboard-page-title">Application Activity</h1>
        <p className="dashboard-page-subtitle">View your daily aggregated application usage breakdown.</p>

        {error && (
          <div className="dash-error">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── Date Filter Bar ───────────────────────────────── */}
        <div 
          className="dash-card" 
          style={{ 
            marginBottom: '20px', 
            padding: '16px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={18} style={{ color: '#3b82f6' }} />
            <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>Date Filter</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrevDate}
              className="dash-btn"
              style={{ padding: '8px 12px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
              title="Previous Date"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="date"
                value={selectedDate}
                max={todayStr}
                onChange={handleDateInputChange}
                style={{
                  padding: '7px 12px 7px 34px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
              />
              <CalendarIcon size={15} style={{ position: 'absolute', left: '10px', color: '#64748b', pointerEvents: 'none' }} />
            </div>

            <button
              onClick={handleNextDate}
              disabled={isToday}
              className="dash-btn"
              style={{
                padding: '8px 12px',
                background: isToday ? '#f8fafc' : '#f1f5f9',
                color: isToday ? '#94a3b8' : '#334155',
                border: '1px solid #cbd5e1',
                cursor: isToday ? 'not-allowed' : 'pointer',
                opacity: isToday ? 0.6 : 1
              }}
              title="Next Date"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ── Activity Display Table ──────────────────────────── */}
        <div className="dash-card">
          <div className="dash-card-header" style={{ marginBottom: '16px' }}>
            <div className="dash-card-icon"><Monitor size={16} /></div>
            <p className="dash-card-title">Daily Application Summary — {formatDateForDisplay(selectedDate)}</p>
          </div>

          {loading ? (
            <div className="dash-loading">Loading application activity…</div>
          ) : activities.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
              No application activity recorded for this date.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Application</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Total Time</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act, idx) => (
                    <tr key={act._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>
                        {act.appName}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2563eb' }}>
                        {act.formattedDuration || '0m'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <TypeBadge classification={act.classification} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ApplicationActivity;
