import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import managerService from '../../services/managerService';
import notificationService from '../../services/notificationService';
import { Activity, RefreshCw } from 'lucide-react';
import '../employee/EmployeeDashboard.css';

const formatTime = (dateStr) => {
  if (!dateStr) return '--:--';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  };
  const { label, cls } = map[status] || { label: status, cls: 'idle' };
  
  const styles = {
    active: { bg: '#dcfce7', color: '#16a34a' },
    idle: { bg: '#fef9c3', color: '#d97706' },
  };
  
  const currentStyle = styles[cls] || styles.idle;
  
  return (
    <span style={{ 
      background: currentStyle.bg, 
      color: currentStyle.color,
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentStyle.color }}></span>
      {label}
    </span>
  );
};

const ManagerCurrentActivity = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [sessionData, notifs] = await Promise.all([
        managerService.getTeamCurrentActivity(),
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
      setError('Failed to load current activity');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

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
            <h1 className="dashboard-title">Current Activity</h1>
            <p className="dashboard-subtitle">Real-time status of your working team members</p>
          </div>
          
          <button 
            className="dash-btn" 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
          >
            <RefreshCw size={14} className={refreshing ? "spin-animation" : ""} /> 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}
        
        <div className="dash-card">
          <div className="dash-card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Activity size={18} style={{ color: '#2563eb' }} />
               <h3 className="dash-card-title" style={{ margin: 0 }}>Active & Idle Sessions</h3>
            </div>
          </div>

          {loading ? (
            <div className="dash-loading">Loading activity...</div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Activity size={40} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#475569' }}>No Active Sessions</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>None of your team members are currently working or idle.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {sessions.map(session => (
                <div key={session._id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: session.status === 'active' ? '#fafcff' : '#fffdf5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#0f172a' }}>{session.user?.name || 'Unknown'}</h4>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{session.user?.department || 'No Dept'}</div>
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                     <div>
                       <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Started</div>
                       <div style={{ fontWeight: 500, color: '#475569' }}>{formatTime(session.startTime)}</div>
                     </div>
                     <div>
                       <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Last Activity</div>
                       <div style={{ fontWeight: 500, color: '#475569' }}>{formatTime(session.lastActivityAt)}</div>
                     </div>
                     <div>
                       <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Active Time</div>
                       <div style={{ fontWeight: 500, color: '#16a34a' }}>{formatDuration(session.activeDuration)}</div>
                     </div>
                     <div>
                       <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Idle Time</div>
                       <div style={{ fontWeight: 500, color: '#d97706' }}>{formatDuration(session.idleDuration)}</div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        .spin-animation { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default ManagerCurrentActivity;
