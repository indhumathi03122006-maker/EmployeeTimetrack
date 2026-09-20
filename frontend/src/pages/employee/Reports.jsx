import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import attendanceService from '../../services/attendanceService';
import { EmployeeSidebar } from './EmployeeDashboard';
import { AlertCircle, Calendar, CalendarCheck, Clock, FileText, Search } from 'lucide-react';
import './EmployeeDashboard.css';

/* ── Helpers ──────────────────────────────────────────── */
const formatTime = (dateStr) => {
  if (!dateStr) return 'Not checked out';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
  }, []); // Initial load

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  return (
    <div className="dashboard-layout">
      <EmployeeSidebar user={user} onLogout={handleLogout} />

      <main className="dashboard-main">
        <h1 className="dashboard-page-title">Reports</h1>
        <p className="dashboard-page-subtitle">View your attendance and work time summary.</p>

        {error && (
          <div className="dash-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── Date Filter ─────────────────────────────────── */}
        <div className="dash-card" style={{ marginBottom: '24px', padding: '16px 22px' }}>
          <form className="report-filter-form" onSubmit={handleApplyFilter} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>From Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="auth-input" 
                style={{ margin: 0, padding: '8px 12px', minWidth: '150px' }}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>To Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="auth-input" 
                style={{ margin: 0, padding: '8px 12px', minWidth: '150px' }}
                required
              />
            </div>
            <button type="submit" className="dash-btn primary" disabled={loading} style={{ height: '40px' }}>
              <Search size={14} /> {loading ? 'Loading...' : 'Apply Filter'}
            </button>
          </form>
        </div>

        {loading ? (
          <div className="dash-loading">Loading reports...</div>
        ) : (
          <>
            {/* ── Summary Cards ─────────────────────────────── */}
            <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="dash-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#64748b' }}>
                  <Calendar size={16} /> <span style={{ fontSize: '13px', fontWeight: '500' }}>Total Working Days</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
                  {report.summary?.totalWorkingDays || 0} days
                </div>
              </div>
              <div className="dash-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#64748b' }}>
                  <CalendarCheck size={16} /> <span style={{ fontSize: '13px', fontWeight: '500' }}>Present Days</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                  {report.summary?.presentDays || 0} days
                </div>
              </div>
              <div className="dash-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#64748b' }}>
                  <Clock size={16} /> <span style={{ fontSize: '13px', fontWeight: '500' }}>Total Work Time</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0066cc' }}>
                  {formatMinutes(report.summary?.totalWorkTime)}
                </div>
              </div>
              <div className="dash-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#64748b' }}>
                  <FileText size={16} /> <span style={{ fontSize: '13px', fontWeight: '500' }}>Total Idle Time</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706' }}>
                  {formatMinutes(report.summary?.totalIdleTime)}
                </div>
              </div>
            </div>

            {/* ── Reports Table ─────────────────────────────── */}
            <div className="dash-card">
               <div className="attendance-table-wrap">
                 <table className="attendance-table">
                   <thead>
                     <tr>
                       <th>Date</th>
                       <th>Check In</th>
                       <th>Check Out</th>
                       <th>Work Time</th>
                       <th>Active Time</th>
                       <th>Idle Time</th>
                       <th>Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {report.records?.length > 0 ? (
                       report.records.map((row) => (
                         <tr key={row._id}>
                           <td>{formatDate(row.date)}</td>
                           <td>{formatTime(row.checkIn)}</td>
                           <td>{formatTime(row.checkOut)}</td>
                           <td>{formatMinutes(row.workDuration)}</td>
                           <td style={{ color: '#15803d' }}>{formatMinutes(row.activeDuration)}</td>
                           <td style={{ color: '#a16207' }}>{formatMinutes(row.idleDuration)}</td>
                           <td>
                             <span className={`status-badge ${row.status === 'present' ? 'present' : 'absent'}`} style={{ padding: '4px 8px' }}>
                               {row.status === 'present' ? 'Present' : 'Absent'}
                             </span>
                           </td>
                         </tr>
                       ))
                     ) : (
                       <tr>
                         <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                           No attendance records found for the selected date range.
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;
