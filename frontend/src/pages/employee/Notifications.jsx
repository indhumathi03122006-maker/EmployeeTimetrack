import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { EmployeeSidebar } from './EmployeeDashboard';
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
import './EmployeeDashboard.css';

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
      <div
        className="notif-icon"
        style={{ background: meta.bg, color: meta.color }}
      >
        <Icon size={16} />
      </div>

      <div className="notif-body">
        <div className="notif-header-row">
          <span className="notif-title">{notif.title}</span>
          <span className="notif-type-tag" style={{ background: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <p className="notif-message">{notif.message}</p>
        <div className="notif-footer-row">
          <span className="notif-time">
            <Clock size={11} />
            {formatNotifDate(notif.createdAt)}
          </span>
          {!notif.isRead && (
            <button
              className="dash-btn secondary notif-read-btn"
              onClick={() => onMarkRead(notif._id)}
              disabled={isMarking}
              id={`btn-mark-read-${notif._id}`}
            >
              <Check size={12} />
              {isMarking ? 'Marking…' : 'Mark as read'}
            </button>
          )}
          {notif.isRead && (
            <span className="notif-read-tag">
              <CheckCheck size={11} /> Read
            </span>
          )}
        </div>
      </div>

      {!notif.isRead && <span className="notif-dot" />}
    </div>
  );
};

/* ── Main Notifications Page ─────────────────────────── */
const Notifications = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [markingId,     setMarkingId]     = useState(null);   // id of notif being marked
  const [markingAll,    setMarkingAll]    = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ── Fetch ─────────────────────────────────────────── */
  const fetchNotifications = useCallback(async () => {
    setError('');
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    }
  }, []);

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  /* ── Actions ───────────────────────────────────────── */
  const handleMarkRead = async (id) => {
    setMarkingId(id);
    try {
      await notificationService.markAsRead(id);
      // Update locally for instant feedback, then re-sync counts
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setError('');
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications as read');
    } finally {
      setMarkingAll(false);
    }
  };

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="dashboard-layout">
      <EmployeeSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />

      <main className="dashboard-main">
        <h1 className="dashboard-page-title">Notifications</h1>
        <p className="dashboard-page-subtitle">
          Your activity and attendance alerts from EmployeeTrack.
        </p>

        {/* Error Banner */}
        {error && (
          <div className="dash-error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Unread summary + Mark all */}
        {!loading && notifications.length > 0 && (
          <div className="notif-toolbar">
            <span className="notif-summary">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All notifications have been read'}
            </span>
            {unreadCount > 0 && (
              <button
                className="dash-btn primary notif-mark-all-btn"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                id="btn-mark-all-read"
              >
                <CheckCheck size={14} />
                {markingAll ? 'Marking all…' : 'Mark all as read'}
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="dash-loading">Loading notifications…</div>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && !error && (
          <div className="notif-empty">
            <BellOff size={40} className="notif-empty-icon" />
            <p className="notif-empty-title">No notifications yet</p>
            <p className="notif-empty-sub">
              Check in, start a work session, or check out to receive your first notification.
            </p>
          </div>
        )}

        {/* Notification list */}
        {!loading && notifications.length > 0 && (
          <div className="notif-list">
            {notifications.map(notif => (
              <NotificationItem
                key={notif._id}
                notif={notif}
                onMarkRead={handleMarkRead}
                markingId={markingId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
