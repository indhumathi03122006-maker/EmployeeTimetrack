import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import attendanceService from '../../services/attendanceService';
import { EmployeeSidebar } from './EmployeeDashboard';
import { FileText, Download } from 'lucide-react';
import './EmployeeDashboard.css';

/* ── Helpers ──────────────────────────────────────────── */
const formatTime = (dateStr) => {
  if (!dateStr) return '--:--';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatMinutes = (mins) => {
  if (mins == null || isNaN(mins)) return '0h 0m';
  const totalMins = Math.floor(mins);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m}m`;
};

const StatusBadge = ({ status }) => {
  const map = {
    present: { label: 'Present', cls: 'present' },
    absent: { label: 'Absent', cls: 'absent' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'absent' };
  
  const styles = {
    present: { bg: '#dcfce7', color: '#16a34a' },
    absent: { bg: '#fee2e2', color: '#dc2626' }
  };
  
  const currentStyle = styles[cls] || { bg: '#f1f5f9', color: '#64748b' };
  
  return (
    <span style={{ 
      background: currentStyle.bg, 
      color: currentStyle.color,
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600
    }}>
      {label}
    </span>
  );
};

/* ── Reports Page ─────────────────────────────────────── */
const Reports = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Date defaults: 1st of current month to end of current month
  const getStartOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  };
  const getEndOfMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getEndOfMonth());

  const [report, setReport] = useState({ summary: {}, records: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };

  const fetchReport = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await attendanceService.getReport(startDate, endDate);
      setReport(res);
    } catch (err) {
      setError('Unable to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]); // Initial load

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    fetchReport();
  };

  return (
    <div className="dashboard-layout">
      <EmployeeSidebar user={user} onLogout={handleLogout} />

      <main className="dashboard-main">
        <div className="manager-dashboard-container">
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">My Reports</h1>
              <p className="dashboard-subtitle">Generate aggregated work and attendance reports</p>
            </div>
          </header>

          {error && <div className="error-banner">{error}</div>}

          {/* ── Date Filter ─────────────────────────────────── */}
          <div className="manager-overview-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
               <FileText size={18} style={{ color: '#8b5cf6' }} />
               <h3 className="manager-overview-heading" style={{ margin: 0, border: 'none', padding: 0 }}>Report Parameters</h3>
            </div>
            
            <form onSubmit={handleApplyFilter}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="dash-input" 
                    style={{ width: '100%', padding: '10px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="dash-input" 
                    style={{ width: '100%', padding: '10px' }}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="dash-btn" 
                disabled={loading} 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: '#3b82f6', color: 'white' }}
              >
                {loading ? 'Generating...' : <><Download size={16} /> Generate Report</>}
              </button>
            </form>
          </div>

          {/* ── Summary Cards ─────────────────────────────── */}
          {report.records?.length > 0 && !loading && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px', marginTop: '24px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Working Days</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>{report.summary?.totalWorkingDays || 0}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Present Days</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>{report.summary?.presentDays || 0}</div>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '4px' }}>Total Work Time</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#15803d' }}>{formatMinutes(report.summary?.totalWorkTime)}</div>
                </div>
                <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#ca8a04', marginBottom: '4px' }}>Total Idle Time</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#a16207' }}>{formatMinutes(report.summary?.totalIdleTime)}</div>
                </div>
              </div>

              {/* ── Reports Table ─────────────────────────────── */}
              <div className="manager-overview-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 className="manager-overview-heading" style={{ margin: 0, border: 'none', padding: 0 }}>Report Results ({report.records.length} records)</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', background: '#f8fafc' }}>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Check In</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Check Out</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Total Duration</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Active Time</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Idle Time</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.records.map((row) => (
                        <tr key={row._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 20px', color: '#475569' }}>{formatDate(row.date)}</td>
                          <td style={{ padding: '12px 20px', color: '#475569' }}>{formatTime(row.checkIn)}</td>
                          <td style={{ padding: '12px 20px', color: '#475569' }}>{formatTime(row.checkOut)}</td>
                          <td style={{ padding: '12px 20px', fontWeight: 500 }}>{formatMinutes(row.workDuration)}</td>
                          <td style={{ padding: '12px 20px', color: '#16a34a', fontWeight: 500 }}>{formatMinutes(row.activeDuration)}</td>
                          <td style={{ padding: '12px 20px', color: '#d97706', fontWeight: 500 }}>{formatMinutes(row.idleDuration)}</td>
                          <td style={{ padding: '12px 20px' }}>
                            <StatusBadge status={row.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {report.records?.length === 0 && !loading && !error && (
            <div style={{ marginTop: '24px', padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              Select parameters and click "Generate Report" to view data.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reports;
