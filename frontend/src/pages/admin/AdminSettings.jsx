import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import AdminSidebar from '../../components/AdminSidebar';
import authService from '../../services/authService';
import notificationService from '../../services/notificationService';
import { Settings as SettingsIcon, User, Lock, Save, Monitor, Sun, Moon, Shield } from 'lucide-react';
import '../manager/ManagerDashboard.css';

const AdminSettings = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const { themePreference, setThemePreference } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [unreadCount, setUnreadCount] = useState(0);
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password Edit State
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await notificationService.getNotifications();
        if (notifs.success) {
          setUnreadCount((notifs.notifications || []).filter(n => !n.isRead).length);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    fetchNotifs();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    try {
      const res = await authService.updateProfile({
        name: formData.name,
        department: formData.department
      });

      if (res.success) {
        setProfileSuccessMsg('Profile updated successfully.');
        const updatedUser = { ...user, name: res.data.name, department: res.data.department };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsEditing(false);
        setTimeout(() => setProfileSuccessMsg(''), 3000);
      }
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordErrorMsg('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    try {
      const res = await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (res.success) {
        setPasswordSuccessMsg('Password updated successfully.');
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccessMsg(''), 3000);
      }
    } catch (err) {
      setPasswordErrorMsg(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="dashboard-layout">
        <AdminSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
        <main className="dashboard-main">
          <div className="dash-loading">Loading settings...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <AdminSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
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

              {profileErrorMsg && (
                <div className="dash-error" style={{ marginBottom: '16px' }}>
                  {profileErrorMsg}
                </div>
              )}
              {profileSuccessMsg && (
                <div className="dash-info" style={{ marginBottom: '16px' }}>
                  {profileSuccessMsg}
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
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="auth-input"
                        style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Email (Read-only)</label>
                      <input 
                        type="email" 
                        value={user?.email || ''}
                        className="auth-input"
                        style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-hover)', color: 'var(--text-light)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'not-allowed' }}
                        readOnly
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Department</label>
                      <input 
                        type="text" 
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="auth-input"
                        style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Role (Read-only)</label>
                      <input 
                        type="text" 
                        value={(user?.role || '').charAt(0).toUpperCase() + (user?.role || '').slice(1)}
                        className="auth-input"
                        style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-hover)', color: 'var(--text-light)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'not-allowed' }}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="btn-row" style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                    <button type="submit" className="dash-btn primary" disabled={profileLoading}>
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="dash-btn secondary" onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        ...formData,
                        name: user.name,
                        department: user.department
                      });
                      setProfileErrorMsg('');
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

              {passwordErrorMsg && (
                <div className="dash-error" style={{ marginBottom: '16px' }}>
                  {passwordErrorMsg}
                </div>
              )}
              {passwordSuccessMsg && (
                <div className="dash-info" style={{ marginBottom: '16px' }}>
                  {passwordSuccessMsg}
                </div>
              )}
              
              <form onSubmit={handlePasswordSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Current Password</label>
                    <input 
                      type="password" 
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="auth-input"
                      style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>New Password</label>
                    <input 
                      type="password" 
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="auth-input"
                      style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      required
                      minLength="6"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Confirm Password</label>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="auth-input"
                      style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      required
                      minLength="6"
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

            {/* ── Admin Controls ──────────────────────────────────── */}
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-icon"><Shield size={16} /></div>
                <p className="dash-card-title">Admin Controls</p>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                User management and organization settings.
              </p>
              
              <div className="attendance-row" style={{ borderBottom: 'none', padding: '8px 0' }}>
                <div style={{ flex: 1 }}>
                  <span className="attendance-label" style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '4px' }}>Manage Users</span>
                  <span className="attendance-value" style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '400' }}>Add, remove, or modify user accounts across the organization.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to="/admin/employees" className="dash-btn secondary" style={{ textDecoration: 'none' }}>
                    Go to User Management
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
