import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import managerService from '../../services/managerService';
import notificationService from '../../services/notificationService';
import { Users, UserCheck, UserX, Activity, Coffee } from 'lucide-react';
import '../employee/EmployeeDashboard.css';

import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [summary, setSummary] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, notifs] = await Promise.all([
          managerService.getDashboardSummary(),
          notificationService.getNotifications()
        ]);
        
        if (summaryData.success) {
          setSummary(summaryData.data);
        }
        
        if (notifs.success) {
          const unread = (notifs.notifications || []).filter(n => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <ManagerSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <div className="manager-dashboard-container">
          <h1 className="dashboard-page-title">Manager Dashboard</h1>
          <p className="dashboard-page-subtitle">Welcome back, {user?.name}</p>

          {error && <div className="error-banner">{error}</div>}
          
          {loading ? (
            <div className="dash-loading">Loading dashboard...</div>
          ) : (
            <>
              <div className="dash-stats-grid">
                <div className="dash-stat-card">
                  <div className="dash-stat-header">
                    <Users size={16} style={{ color: '#3b82f6' }} />
                    <span className="dash-stat-label">Team Members</span>
                  </div>
                  <div className="dash-stat-value">{summary?.totalTeamMembers || 0}</div>
                </div>

                <div className="dash-stat-card">
                  <div className="dash-stat-header">
                    <UserCheck size={16} style={{ color: '#22c55e' }} />
                    <span className="dash-stat-label">Present</span>
                  </div>
                  <div className="dash-stat-value">{summary?.present || 0}</div>
                </div>

                <div className="dash-stat-card">
                  <div className="dash-stat-header">
                    <UserX size={16} style={{ color: '#ef4444' }} />
                    <span className="dash-stat-label">Absent</span>
                  </div>
                  <div className="dash-stat-value">{summary?.absent || 0}</div>
                </div>

                <div className="dash-stat-card">
                  <div className="dash-stat-header">
                    <Activity size={16} style={{ color: '#8b5cf6' }} />
                    <span className="dash-stat-label">Currently Working</span>
                  </div>
                  <div className="dash-stat-value">{summary?.currentlyWorking || 0}</div>
                </div>

                <div className="dash-stat-card">
                  <div className="dash-stat-header">
                    <Coffee size={16} style={{ color: '#f59e0b' }} />
                    <span className="dash-stat-label">Currently Idle</span>
                  </div>
                  <div className="dash-stat-value">{summary?.currentlyIdle || 0}</div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="dash-card">
                  <div className="dash-card-header">
                    <div className="dash-card-icon"><UserCheck size={16} /></div>
                    <p className="dash-card-title">Team Attendance</p>
                  </div>
                  <div className="attendance-row">
                    <span className="attendance-label">Present</span>
                    <span className="attendance-value">{summary?.present || 0}</span>
                  </div>
                  <div className="attendance-row">
                    <span className="attendance-label">Absent</span>
                    <span className="attendance-value">{summary?.absent || 0}</span>
                  </div>
                </div>

                <div className="dash-card">
                  <div className="dash-card-header">
                    <div className="dash-card-icon"><Activity size={16} /></div>
                    <p className="dash-card-title">Team Activity</p>
                  </div>
                  <div className="attendance-row">
                    <span className="attendance-label">Currently Working</span>
                    <span className="attendance-value active-time" style={{ color: 'var(--status-active-text)' }}>{summary?.currentlyWorking || 0}</span>
                  </div>
                  <div className="attendance-row">
                    <span className="attendance-label">Currently Idle</span>
                    <span className="attendance-value idle-time" style={{ color: 'var(--status-idle-text)' }}>{summary?.currentlyIdle || 0}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
