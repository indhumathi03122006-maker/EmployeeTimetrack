import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import ManagerSidebar from '../../components/ManagerSidebar';
import notificationService from '../../services/notificationService';
import { AlertCircle, CheckCircle2, User, Lock, Info } from 'lucide-react';
import '../employee/EmployeeDashboard.css';

const ManagerSettings = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password Edit State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await notificationService.getNotifications();
        if (notifs.success) {
          setUnreadCount((notifs.notifications || []).filter(n => !n.isRead).length);
        }
      } catch (err) {
        console.error('Failed to load notifications for badge', err);
      }
    };
    fetchNotifs();
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const res = await authService.updateProfile({ name, department });
      setUser(res.data); // Update AuthContext
      setProfileSuccess('Profile updated successfully.');
      setIsEditing(false);
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err.message || 'Unable to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authService.changePassword({ currentPassword, newPassword });
      setPasswordSuccess(res.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.message || 'Unable to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (!user) {
    return (
      <div className="dashboard-layout">
        <ManagerSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
        <main className="dashboard-main">
          <div className="dash-loading">Loading settings...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <ManagerSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Settings</h1>
            <p className="dashboard-subtitle">Manage your profile and account settings.</p>
          </div>
        </header>

        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px' }}>
          
          {/* ── Profile Information ──────────────────────────────── */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-icon"><User size={16} /></div>
              <p className="dash-card-title">Profile Information</p>
            </div>

            {profileError && (
              <div className="dash-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={15} /> {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="dash-info" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', marginBottom: '16px' }}>
                <CheckCircle2 size={15} /> {profileSuccess}
              </div>
            )}

            {!isEditing ? (
              <>
                <div className="attendance-row">
                  <span className="attendance-label">Name</span>
                  <span className="attendance-value" style={{ fontWeight: '600' }}>{user.name}</span>
                </div>
                <div className="attendance-row">
                  <span className="attendance-label">Email</span>
                  <span className="attendance-value">{user.email}</span>
                </div>
                <div className="attendance-row">
                  <span className="attendance-label">Department</span>
                  <span className="attendance-value">{user.department || '—'}</span>
                </div>
                <div className="attendance-row">
                  <span className="attendance-label">Role</span>
                  <span className="attendance-value" style={{ textTransform: 'capitalize' }}>{user.role}</span>
                </div>
                <div className="attendance-row" style={{ borderBottom: 'none' }}>
                  <span className="attendance-label">Account Status</span>
                  <span className="attendance-value">
                    <span className={`status-badge ${user.isActive !== false ? 'present' : 'absent'}`}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </div>
                <div className="btn-row" style={{ marginTop: '16px' }}>
                  <button className="dash-btn primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
                </div>
              </>
            ) : (
              <form onSubmit={handleProfileSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input"
                    style={{ margin: 0, padding: '8px 12px', width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="auth-input"
                    style={{ margin: 0, padding: '8px 12px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="btn-row">
                  <button type="submit" className="dash-btn primary" disabled={profileLoading}>
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="dash-btn secondary" onClick={() => {
                    setIsEditing(false);
                    setName(user.name);
                    setDepartment(user.department);
                    setProfileError('');
                  }} disabled={profileLoading}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Change Password ──────────────────────────────────── */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-icon"><Lock size={16} /></div>
              <p className="dash-card-title">Change Password</p>
            </div>

            {passwordError && (
              <div className="dash-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={15} /> {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="dash-info" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', marginBottom: '16px' }}>
                <CheckCircle2 size={15} /> {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="auth-input"
                  style={{ margin: 0, padding: '8px 12px', width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="auth-input"
                  style={{ margin: 0, padding: '8px 12px', width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input"
                  style={{ margin: 0, padding: '8px 12px', width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div className="btn-row">
                <button type="submit" className="dash-btn danger" disabled={passwordLoading}>
                  {passwordLoading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

          {/* ── Account Information ──────────────────────────────── */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-icon"><Info size={16} /></div>
              <p className="dash-card-title">Account Information</p>
            </div>
            
            <div className="attendance-row">
              <span className="attendance-label">Role</span>
              <span className="attendance-value" style={{ textTransform: 'capitalize' }}>{user.role}</span>
            </div>
            <div className="attendance-row">
              <span className="attendance-label">Account Status</span>
              <span className="attendance-value">
                <span className={`status-badge ${user.isActive !== false ? 'present' : 'absent'}`}>
                  {user.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </span>
            </div>
            <div className="attendance-row">
              <span className="attendance-label">Email</span>
              <span className="attendance-value">{user.email}</span>
            </div>
            <div className="attendance-row" style={{ borderBottom: 'none' }}>
              <span className="attendance-label">Member Since</span>
              <span className="attendance-value">{formatDate(user.createdAt)}</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ManagerSettings;
