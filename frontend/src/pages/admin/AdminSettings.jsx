import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import authService from '../../services/authService';
import notificationService from '../../services/notificationService';
import { Settings as SettingsIcon, User, Lock, Save } from 'lucide-react';
import '../manager/ManagerDashboard.css';

const AdminSettings = () => {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await authService.updateProfile({
        name: formData.name,
        department: formData.department
      });

      if (res.success) {
        setSuccessMsg('Profile updated successfully');
        // Update context
        const updatedUser = { ...user, name: res.data.name, department: res.data.department };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Soft reload context is handled by just showing the success msg, 
        // ideally we'd trigger a context refresh, but this works for basic flow.
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (res.success) {
        setSuccessMsg('Password updated successfully');
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <div className="manager-dashboard-container">
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Account Settings</h1>
              <p className="dashboard-subtitle">Manage your admin profile and security</p>
            </div>
          </header>

          {errorMsg && <div className="error-banner">{errorMsg}</div>}
          {successMsg && <div style={{ background: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontWeight: 500 }}>{successMsg}</div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            
            {/* Profile Section */}
            <div className="manager-overview-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                 <User size={18} style={{ color: '#3b82f6' }} />
                 <h3 className="manager-overview-heading" style={{ margin: 0, border: 'none', padding: 0 }}>Profile Information</h3>
              </div>
              
              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="dash-input"
                      style={{ width: '100%', padding: '10px' }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Email Address (Read-only)</label>
                    <input 
                      type="email" 
                      value={user?.email || ''}
                      className="dash-input"
                      style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                      readOnly
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Department</label>
                    <input 
                      type="text" 
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="dash-input"
                      style={{ width: '100%', padding: '10px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Role (Read-only)</label>
                    <input 
                      type="text" 
                      value={(user?.role || '').toUpperCase()}
                      className="dash-input"
                      style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                      readOnly
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="dash-btn"
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#3b82f6', color: 'white' }}
                  >
                    <Save size={16} /> Save Profile
                  </button>
                </div>
              </form>
            </div>

            {/* Password Section */}
            <div className="manager-overview-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                 <Lock size={18} style={{ color: '#ef4444' }} />
                 <h3 className="manager-overview-heading" style={{ margin: 0, border: 'none', padding: 0 }}>Change Password</h3>
              </div>
              
              <form onSubmit={handlePasswordSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Current Password</label>
                    <input 
                      type="password" 
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="dash-input"
                      style={{ width: '100%', padding: '10px' }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>New Password</label>
                    <input 
                      type="password" 
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="dash-input"
                      style={{ width: '100%', padding: '10px' }}
                      required
                      minLength="6"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Confirm New Password</label>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="dash-input"
                      style={{ width: '100%', padding: '10px' }}
                      required
                      minLength="6"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="dash-btn"
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#0f172a', color: 'white' }}
                  >
                    <Lock size={16} /> Update Password
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

export default AdminSettings;
