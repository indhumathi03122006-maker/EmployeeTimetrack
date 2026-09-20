import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import notificationService from '../../services/notificationService';
import {
  Bell,
  BellOff,
  CheckCheck,
  Check,
  AlertCircle,
  Clock,
  Activity,
  CalendarCheck,
  LogOut,
  Cpu,
} from 'lucide-react';
import '../employee/EmployeeDashboard.css';

/* ── Helpers ─────────────────────────────────────────── */

const TYPE_META = {
  attendance:     { label: 'Attendance',     Icon: CalendarCheck, color: '#16a34a', bg: '#dcfce7' },
  'work-session': { label: 'Work Session',   Icon: Activity,      color: '#0066cc', bg: '#eff6ff' },
  activity:       { label: 'Activity',       Icon: Cpu,           color: '#d97706', bg: '#fef9c3' },
  checkout:       { label: 'Checked Out',    Icon: LogOut,        color: '#dc2626', bg: '#fee2e2' },
  system:         { label: 'System',         Icon: Bell,          color: '#6366f1', bg: '#ede9fe' },
};

const formatNotifDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now  = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth()    === now.getMonth()    &&
    date.getDate()     === now.getDate();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth()    === yesterday.getMonth()    &&
    date.getDate()     === yesterday.getDate();
  if (isYesterday) return `Yesterday, ${time}`;

  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${time}`;
};

/* ── Notification Item ───────────────────────────────── */
const NotificationItem = ({ notif, onMarkRead, markingId }) => {
  const meta = TYPE_META[notif.type] || TYPE_META.system;
  const { Icon } = meta;
  const isMarking = markingId === notif._id;

  return (
    <div className={`notif-item ${notif.isRead ? 'notif-read' : 'notif-unread'}`}>
      {!notif.isRead && <div className="notif-dot" />}
      
      <div className="notif-icon" style={{ background: meta.bg, color: meta.color }}>
        <Icon size={18} strokeWidth={2.5} />
      </div>

      <div className="notif-body">
        <div className="notif-header-row">
          <div className="notif-title">{notif.title}</div>
          <div className="notif-type-tag" style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
          </div>
        </div>
        
        <p className="notif-message">{notif.message}</p>
        
        <div className="notif-footer-row">
          <span className="notif-time">
            <Clock size={12} /> {formatNotifDate(notif.createdAt)}
          </span>

          {!notif.isRead ? (
            <button 
              className="dash-btn notif-read-btn" 
              onClick={() => onMarkRead(notif._id)}
              disabled={isMarking}
            >
              <Check size={14} /> 
              {isMarking ? 'Marking...' : 'Mark as read'}
            </button>
          ) : (
            <span className="notif-read-tag">
              <CheckCheck size={14} /> Read
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────── */

const ManagerNotifications = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      } else {
        setError(res.message || 'Failed to load notifications');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error loading notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAsRead = async (id) => {
    setMarkingId(id);
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
      console.error('Failed to mark read', err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="dashboard-layout">
      <ManagerSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Notifications</h1>
            <p className="dashboard-subtitle">Updates and alerts for your account</p>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="notif-toolbar">
          <div className="notif-summary">
            You have <strong>{unreadCount}</strong> unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </div>
          
          <button 
            className="dash-btn notif-mark-all-btn"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || markingAll || loading}
          >
            <CheckCheck size={16} />
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        </div>

        {loading ? (
          <div className="dash-loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <BellOff size={48} className="notif-empty-icon" />
            <h3 className="notif-empty-title">No notifications</h3>
            <p className="notif-empty-sub">
              You're all caught up! When there are updates to your account or system alerts, they will appear here.
            </p>
          </div>
        ) : unreadCount === 0 && notifications.every(n => n.isRead) ? (
          <div className="notif-list">
             <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748b', fontSize: '14px', background: '#f8fafc', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
               <CheckCheck size={24} style={{ opacity: 0.5, marginBottom: '10px' }} />
               <br />
               All notifications have been read.
             </div>
             {notifications.map(notif => (
              <NotificationItem 
                key={notif._id} 
                notif={notif} 
                onMarkRead={handleMarkAsRead}
                markingId={markingId}
              />
            ))}
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map(notif => (
              <NotificationItem 
                key={notif._id} 
                notif={notif} 
                onMarkRead={handleMarkAsRead}
                markingId={markingId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagerNotifications;
