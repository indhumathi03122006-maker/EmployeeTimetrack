import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import authService from '../../services/authService';
import ManagerSidebar from '../../components/ManagerSidebar';
import notificationService from '../../services/notificationService';
import { AlertCircle, CheckCircle2, User, Lock, Settings as SettingsIcon, Monitor, Sun, Moon } from 'lucide-react';
import '../employee/EmployeeDashboard.css';

const ManagerSettings = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const { themePreference, setThemePreference } = useContext(ThemeContext);
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
      setUser(res.data);
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
        <div style={{ width: '90%', maxWidth: '1000px', margin: '0 auto' }}>
          <header className="dashboard-header" style={{ marginBottom: '24px' }}>
            <div>
              <h1 className="dashboard-page-title" style={{ marginBottom: '8px' }}>Settings</h1>
              <p className="dashboard-page-subtitle" style={{ marginBottom: '0' }}>Manage your profile and account settings.</p>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            
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
                <div className="dash-info" style={{ marginBottom: '16px' }}>
                  <CheckCircle2 size={15} /> {profileSuccess}
                </div>
              )}

              {!isEditing ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div className="attendance-row" style={{ borderBottom: 'none', padding: '8px 0' }}>
                      <span className="attendance-label" style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Name</span>
                      <span className="attendance-value" style={{ fontWeight: '600', fontSize: '15px' }}>{user.name}</span>
                    </div>
                    <div className="attendance-row" style={{ borderBottom: 'none', padding: '8px 0' }}>
                      <span className="attendance-label" style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Email</span>
                      <span className="attendance-value" style={{ fontSize: '15px' }}>{user.email}</span>
                    </div>
                    <div className="attendance-row" style={{ borderBottom: 'none', padding: '8px 0' }}>
                      <span className="attendance-label" style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Department</span>
                      <span className="attendance-value" style={{ fontSize: '15px' }}>{user.department || '—'}</span>
                    </div>
                    <div className="attendance-row" style={{ borderBottom: 'none', padding: '8px 0' }}>
                      <span className="attendance-label" style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Role</span>
                      <span className="attendance-value" style={{ textTransform: 'capitalize', fontSize: '15px' }}>{user.role}</span>
                    </div>
                    <div className="attendance-row" style={{ borderBottom: 'none', padding: '8px 0' }}>
                      <span className="attendance-label" style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Account Status</span>
                      <span className="attendance-value">
                        <span className={`status-badge ${user.isActive !== false ? 'active' : 'ended'}`}>
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                    </div>
                    <div className="attendance-row" style={{ borderBottom: 'none', padding: '8px 0' }}></div>
                  </div>
                  <div className="btn-row" style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                    <button className="dash-btn primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleProfileSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="auth-input"
                        style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Email (Read-only)</label>
                      <input
                        type="text"
                        value={user.email}
                        className="auth-input"
                        style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-hover)', color: 'var(--text-light)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'not-allowed' }}
                        disabled
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="auth-input"
                        style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Role (Read-only)</label>
                      <input
                        type="text"
                        value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        className="auth-input"
                        style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-hover)', color: 'var(--text-light)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'not-allowed' }}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="btn-row" style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
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

            {/* ── Account ──────────────────────────────────── */}
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-icon"><SettingsIcon size={16} /></div>
                <p className="dash-card-title">Account</p>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Manage your account-related information and preferences.
                </p>
                <div className="attendance-row" style={{ borderBottom: 'none', padding: '8px 0' }}>
                  <div style={{ flex: 1 }}>
                    <span className="attendance-label" style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '4px' }}>Appearance</span>
                    <span className="attendance-value" style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '400' }}>Choose your preferred color theme.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setThemePreference('light')}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${themePreference === 'light' ? 'var(--accent-blue)' : 'var(--border-color)'}`, background: themePreference === 'light' ? 'var(--accent-blue-light)' : 'var(--bg-primary)', color: themePreference === 'light' ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                      <Sun size={14} /> Light
                    </button>
                    <button 
                      onClick={() => setThemePreference('dark')}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${themePreference === 'dark' ? 'var(--accent-blue)' : 'var(--border-color)'}`, background: themePreference === 'dark' ? 'var(--accent-blue-light)' : 'var(--bg-primary)', color: themePreference === 'dark' ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                      <Moon size={14} /> Dark
                    </button>
                    <button 
                      onClick={() => setThemePreference('system')}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${themePreference === 'system' ? 'var(--accent-blue)' : 'var(--border-color)'}`, background: themePreference === 'system' ? 'var(--accent-blue-light)' : 'var(--bg-primary)', color: themePreference === 'system' ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                      <Monitor size={14} /> System
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Change Password ──────────────────────────────────── */}
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-icon"><Lock size={16} /></div>
                <p className="dash-card-title">Change Password</p>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Update your password to keep your account secure.
              </p>

              {passwordError && (
                <div className="dash-error" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={15} /> {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="dash-info" style={{ marginBottom: '16px' }}>
                  <CheckCircle2 size={15} /> {passwordSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="auth-input"
                      style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="auth-input"
                      style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="auth-input"
                      style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      required
                    />
                  </div>
                </div>
                <div className="btn-row" style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '20px', justifyContent: 'flex-start' }}>
                  <button type="submit" className="dash-btn danger" disabled={passwordLoading}>
                    {passwordLoading ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerSettings;
