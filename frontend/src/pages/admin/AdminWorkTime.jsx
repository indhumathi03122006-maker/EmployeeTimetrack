import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import adminService from '../../services/adminService';
import notificationService from '../../services/notificationService';
import { Timer, Search } from 'lucide-react';
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
    active:      { label: 'Active',      cls: 'active' },
    idle:        { label: 'Idle',        cls: 'idle' },
    ended:       { label: 'Ended',       cls: 'ended' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'ended' };
  
  const styles = {
    active: { bg: '#dcfce7', color: '#16a34a' },
    idle: { bg: '#fef9c3', color: '#d97706' },
    ended: { bg: '#f1f5f9', color: '#64748b' }
  };
  
  const currentStyle = styles[cls] || styles.ended;
  
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

const AdminWorkTime = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
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
      const [sessionData, notifs] = await Promise.all([
        adminService.getTeamWorkSessions(startDate, endDate),
        notificationService.getNotifications()
      ]);
      
      if (sessionData.success) {
        setSessions(sessionData.data);
      }
      
      if (notifs.success) {
        const unread = (notifs.notifications || []).filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      setError('Failed to load work sessions');
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

  const filteredSessions = sessions.filter(session => 
    session.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    session.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.user?.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <AdminSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <div className="manager-dashboard-container">
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Organization Work Time</h1>
              <p className="dashboard-subtitle">View detailed work sessions across the entire organization</p>
            </div>
          </header>

          {error && <div className="error-banner">{error}</div>}
          
          <div className="manager-overview-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Timer size={18} style={{ color: '#64748b' }} />
                 <h3 className="manager-overview-heading" style={{ margin: 0, border: 'none', padding: 0 }}>Work Session Log</h3>
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
              <div className="dash-loading" style={{ padding: '40px' }}>Loading work sessions...</div>
            ) : filteredSessions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                No work sessions found for the selected date range.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', background: '#f8fafc' }}>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Employee</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Start Time</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>End Time</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Active</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Idle</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map(session => (
                      <tr key={session._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 500, color: '#0f172a' }}>
                          {session.user?.name || 'Unknown'}
                          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>{session.user?.department || 'No Dept'}</div>
                        </td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{formatDate(session.startTime)}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{formatTime(session.startTime)}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{formatTime(session.endTime)}</td>
                        <td style={{ padding: '12px 20px', color: '#475569', fontWeight: 500 }}>{formatDuration(session.activeDuration)}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{formatDuration(session.idleDuration)}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <StatusBadge status={session.status} />
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

export default AdminWorkTime;
