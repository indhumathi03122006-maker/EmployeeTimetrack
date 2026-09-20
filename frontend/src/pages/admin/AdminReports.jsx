import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import adminService from '../../services/adminService';
import notificationService from '../../services/notificationService';
import { FileText, Download } from 'lucide-react';
import '../manager/ManagerDashboard.css';

const formatTime = (dateStr) => {
  if (!dateStr) return '--:--';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDuration = (mins) => {
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

const AdminReports = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Fetch employees on mount for the dropdown
  useEffect(() => {
    const init = async () => {
      try {
        const [empData, notifs] = await Promise.all([
          adminService.getTeamMembers(),
          notificationService.getNotifications()
        ]);
        if (empData.success) setEmployees(empData.data);
        if (notifs.success) {
          setUnreadCount((notifs.notifications || []).filter(n => !n.isRead).length);
        }
      } catch (err) {
        console.error("Failed to init", err);
      }
    };
    init();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReports([]);
    
    try {
      const res = await adminService.getTeamReports(startDate, endDate, selectedEmployee || undefined);
      if (res.success) {
        setReports(res.data);
      } else {
        setError(res.message || 'Failed to generate report');
      }
    } catch (err) {
      setError('Error generating report. Check date ranges.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <div className="manager-dashboard-container">
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Organization Reports</h1>
              <p className="dashboard-subtitle">Generate aggregated work and attendance reports</p>
            </div>
          </header>

          {error && <div className="error-banner">{error}</div>}
          
          <div className="manager-overview-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
               <FileText size={18} style={{ color: '#8b5cf6' }} />
               <h3 className="manager-overview-heading" style={{ margin: 0, border: 'none', padding: 0 }}>Report Parameters</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="dash-input"
                  style={{ width: '100%', padding: '10px' }}
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
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Employee (Optional)</label>
                <select 
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="dash-input"
                  style={{ width: '100%', padding: '10px', background: 'white' }}
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button 
              className="dash-btn"
              onClick={generateReport}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: '#3b82f6', color: 'white' }}
            >
              {loading ? 'Generating...' : <><Download size={16} /> Generate Report</>}
            </button>
          </div>
          
          {reports.length > 0 && !loading && (
            <div className="manager-overview-panel" style={{ marginTop: '24px', padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 className="manager-overview-heading" style={{ margin: 0, border: 'none', padding: 0 }}>Report Results ({reports.length} records)</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', background: '#f8fafc' }}>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Employee</th>
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
                    {reports.map((record, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 500, color: '#0f172a' }}>{record.user?.name || 'Unknown'}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{formatDate(record.date)}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{formatTime(record.checkIn)}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{formatTime(record.checkOut)}</td>
                        <td style={{ padding: '12px 20px', fontWeight: 500 }}>{formatDuration(record.workDuration)}</td>
                        <td style={{ padding: '12px 20px', color: '#16a34a', fontWeight: 500 }}>{formatDuration(record.activeTime)}</td>
                        <td style={{ padding: '12px 20px', color: '#d97706', fontWeight: 500 }}>{formatDuration(record.idleTime)}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {reports.length === 0 && !loading && !error && (
            <div style={{ marginTop: '24px', padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              Select parameters and click "Generate Report" to view data.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminReports;
