import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import managerService from '../../services/managerService';
import notificationService from '../../services/notificationService';
import { FileText, Download } from 'lucide-react';
import '../employee/EmployeeDashboard.css';

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

const ManagerReports = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const lastWeekStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(lastWeekStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  useEffect(() => {
    // Initial load: get employees for the dropdown and unread notifications
    const initData = async () => {
      try {
        const [empData, notifs] = await Promise.all([
          managerService.getTeamMembers(),
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
    initData();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const reportData = await managerService.getTeamReports(startDate, endDate, selectedEmployee);
      if (reportData.success) {
        setReports(reportData.data);
      }
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Aggregated totals
  const totalPresent = reports.length;
  const totalWorkDuration = reports.reduce((acc, curr) => acc + (curr.workDuration || 0), 0);
  const totalActive = reports.reduce((acc, curr) => acc + (curr.activeTime || 0), 0);
  const totalIdle = reports.reduce((acc, curr) => acc + (curr.idleTime || 0), 0);

  return (
    <div className="dashboard-layout">
      <ManagerSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Team Reports</h1>
            <p className="dashboard-subtitle">Generate aggregated attendance and work time reports</p>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}
        
        <div className="dash-card">
          <div className="dash-card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <FileText size={18} style={{ color: '#64748b' }} />
               <h3 className="dash-card-title" style={{ margin: 0 }}>Report Parameters</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="dash-input"
                  style={{ width: '150px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="dash-input"
                  style={{ width: '150px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Employee (Optional)</label>
                <select 
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="dash-input"
                  style={{ width: '200px' }}
                >
                  <option value="">All Team Members</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              
              <button className="dash-btn dash-btn-primary" onClick={generateReport} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {reports.length > 0 && (
            <>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Present Days</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>{totalPresent}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Work Duration</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>{formatDuration(totalWorkDuration)}</div>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '4px' }}>Total Active Time</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#15803d' }}>{formatDuration(totalActive)}</div>
                </div>
                <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#ca8a04', marginBottom: '4px' }}>Total Idle Time</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#a16207' }}>{formatDuration(totalIdle)}</div>
                </div>
              </div>

              {/* Data Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', background: '#f8fafc' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Employee</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Work Duration</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Active Time</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Idle Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((record, index) => (
                      <tr key={`${record._id}-${index}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: '#0f172a' }}>{record.user?.name}</td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{formatDate(record.date)}</td>
                        <td style={{ padding: '10px 12px' }}>
                           <span style={{ color: record.status === 'present' ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                             {record.status === 'present' ? 'Present' : 'Absent'}
                           </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{formatDuration(record.workDuration)}</td>
                        <td style={{ padding: '10px 12px', color: '#16a34a' }}>{formatDuration(record.activeTime)}</td>
                        <td style={{ padding: '10px 12px', color: '#d97706' }}>{formatDuration(record.idleTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          {!loading && reports.length === 0 && !error && (
             <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                Select parameters and click "Generate Report"
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerReports;
