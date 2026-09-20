import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import notificationService from '../../services/notificationService';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import '../manager/ManagerDashboard.css';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const AdminNotifications = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        // IMPORTANT: Safe access based on user requirements
        setNotifications(res.notifications || []);
      } else {
        setError(res.message || 'Failed to load notifications');
      }
    } catch (err) {
      setError('An error occurred while loading notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="dashboard-layout">
      <AdminSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <div className="manager-dashboard-container">
          <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="dashboard-title">Notifications</h1>
              <p className="dashboard-subtitle">Your system alerts and updates</p>
            </div>
            
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
              >
                <CheckCheck size={16} /> Mark all as read
              </button>
            )}
          </header>

          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <div className="dash-loading">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="manager-overview-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Bell size={40} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#475569' }}>No notifications</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>You're all caught up!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  className="manager-overview-panel" 
                  style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    gap: '16px',
                    borderLeft: notif.isRead ? '1px solid #e2e8f0' : '4px solid #3b82f6',
                    background: notif.isRead ? '#ffffff' : '#f8fafc'
                  }}
                >
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    background: notif.isRead ? '#f1f5f9' : '#dbeafe', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <Bell size={20} style={{ color: notif.isRead ? '#94a3b8' : '#3b82f6' }} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: notif.isRead ? 500 : 600 }}>
                        {notif.title}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                        <Clock size={12} /> {formatDateTime(notif.createdAt)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
                      {notif.message}
                    </p>
                    
                    {!notif.isRead && (
                      <div style={{ marginTop: '12px' }}>
                        <button 
                          onClick={() => handleMarkAsRead(notif._id)}
                          style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: 0 }}
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;
