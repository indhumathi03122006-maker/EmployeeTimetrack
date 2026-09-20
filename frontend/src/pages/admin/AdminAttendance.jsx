import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import adminService from '../../services/adminService';
import notificationService from '../../services/notificationService';
import { CalendarCheck, Search } from 'lucide-react';
import '../manager/ManagerDashboard.css';

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

const AdminAttendance = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [attendance, setAttendance] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attData, notifs] = await Promise.all([
        adminService.getTeamAttendance(startDate, endDate),
        notificationService.getNotifications()
      ]);
      
      if (attData.success) {
        setAttendance(attData.data);
      }
      
      if (notifs.success) {
        const unread = (notifs.notifications || []).filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      setError('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredAttendance = attendance.filter(record => 
    record.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    record.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.user?.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <AdminSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <div className="manager-dashboard-container">
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Organization Attendance</h1>
              <p className="dashboard-subtitle">View attendance records across the entire organization</p>
            </div>
          </header>

          {error && <div className="error-banner">{error}</div>}
          
          <div className="manager-overview-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <CalendarCheck size={18} style={{ color: '#64748b' }} />
                 <h3 className="manager-overview-heading" style={{ margin: 0, border: 'none', padding: 0 }}>Attendance Log</h3>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Search employee..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '6px 12px 6px 32px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '200px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>From:</span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="dash-input"
                    style={{ padding: '6px 10px', width: 'auto' }}
                  />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>To:</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="dash-input"
                    style={{ padding: '6px 10px', width: 'auto' }}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="dash-loading" style={{ padding: '40px' }}>Loading attendance records...</div>
            ) : filteredAttendance.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                No attendance records found for the selected date range.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', background: '#f8fafc' }}>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Employee</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Check In</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Check Out</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Duration</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.map(record => (
                      <tr key={record._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 500, color: '#0f172a' }}>
                          {record.user?.name || 'Unknown User'}
                          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>{record.user?.department || 'No Dept'}</div>
                        </td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{formatDate(record.date)}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{formatTime(record.checkIn)}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{formatTime(record.checkOut)}</td>
                        <td style={{ padding: '12px 20px', color: '#475569', fontWeight: 500 }}>{formatMinutes(record.workDuration)}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAttendance;
