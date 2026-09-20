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
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Manager Dashboard</h1>
              <p className="dashboard-subtitle">Welcome back, {user?.name}</p>
            </div>
          </header>

          {error && <div className="error-banner">{error}</div>}
          
          {loading ? (
            <div className="dash-loading">Loading dashboard...</div>
          ) : (
            <>
              <div className="manager-stats-grid">
                <div className="manager-stat-card">
                  <div className="manager-stat-header">
                    <Users size={16} style={{ color: '#3b82f6' }} />
                    <span className="manager-stat-label">Team Members</span>
                  </div>
                  <div className="manager-stat-value">{summary?.totalTeamMembers || 0}</div>
                </div>

                <div className="manager-stat-card">
                  <div className="manager-stat-header">
                    <UserCheck size={16} style={{ color: '#22c55e' }} />
                    <span className="manager-stat-label">Present Today</span>
                  </div>
                  <div className="manager-stat-value">{summary?.present || 0}</div>
                </div>

                <div className="manager-stat-card">
                  <div className="manager-stat-header">
                    <UserX size={16} style={{ color: '#ef4444' }} />
                    <span className="manager-stat-label">Absent Today</span>
                  </div>
                  <div className="manager-stat-value">{summary?.absent || 0}</div>
                </div>

                <div className="manager-stat-card">
                  <div className="manager-stat-header">
                    <Activity size={16} style={{ color: '#3b82f6' }} />
                    <span className="manager-stat-label">Currently Working</span>
                  </div>
                  <div className="manager-stat-value">{summary?.currentlyWorking || 0}</div>
                </div>

                <div className="manager-stat-card">
                  <div className="manager-stat-header">
                    <Coffee size={16} style={{ color: '#f59e0b' }} />
                    <span className="manager-stat-label">Currently Idle</span>
                  </div>
                  <div className="manager-stat-value">{summary?.currentlyIdle || 0}</div>
                </div>
              </div>

              <div className="manager-overview-panel">
                <h3 className="manager-overview-heading">Team Overview</h3>
                <div className="manager-overview-list">
                  <div className="manager-overview-item">
                    <span className="manager-overview-label">Present</span>
                    <span className="manager-overview-val">{summary?.present || 0}</span>
                  </div>
                  <div className="manager-overview-item">
                    <span className="manager-overview-label">Currently Working</span>
                    <span className="manager-overview-val">{summary?.currentlyWorking || 0}</span>
                  </div>
                  <div className="manager-overview-item">
                    <span className="manager-overview-label">Currently Idle</span>
                    <span className="manager-overview-val">{summary?.currentlyIdle || 0}</span>
                  </div>
                  <div className="manager-overview-item">
                    <span className="manager-overview-label">Absent</span>
                    <span className="manager-overview-val">{summary?.absent || 0}</span>
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
