import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import managerService from '../../services/managerService';
import notificationService from '../../services/notificationService';
import { Timer } from 'lucide-react';
import '../employee/EmployeeDashboard.css';

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

const ManagerWorkTime = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionData, notifs] = await Promise.all([
        managerService.getTeamWorkSessions(startDate, endDate),
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

  return (
    <div className="dashboard-layout">
      <ManagerSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Team Work Time</h1>
            <p className="dashboard-subtitle">View detailed work sessions for your team</p>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}
        
        <div className="dash-card">
          <div className="dash-card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Timer size={18} style={{ color: '#64748b' }} />
               <h3 className="dash-card-title" style={{ margin: 0 }}>Work Session Log</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

          {loading ? (
            <div className="dash-loading">Loading work sessions...</div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No work sessions found for the selected date range.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Employee</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Start Time</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>End Time</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Active</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Idle</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 500, color: '#0f172a' }}>
                        {session.user?.name || 'Unknown'}
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>{session.user?.email}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#475569' }}>{formatDate(session.startTime)}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{formatTime(session.startTime)}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{formatTime(session.endTime)}</td>
                      <td style={{ padding: '12px', color: '#475569', fontWeight: 500 }}>{formatDuration(session.activeDuration)}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{formatDuration(session.idleDuration)}</td>
                      <td style={{ padding: '12px' }}>
                        <StatusBadge status={session.status} />
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

export default ManagerWorkTime;
