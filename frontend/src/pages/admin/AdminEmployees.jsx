import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import adminService from '../../services/adminService';
import notificationService from '../../services/notificationService';
import { Users, Search, Plus, Edit2, Shield, ShieldOff, CheckCircle2 } from 'lucide-react';
import '../manager/ManagerDashboard.css';

const AdminEmployees = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddManager, setShowAddManager] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    password: '',
    manager: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empData, notifs] = await Promise.all([
        adminService.getTeamMembers(),
        notificationService.getNotifications()
      ]);
      
      if (empData.success) {
        setEmployees(empData.data);
        setManagersList(empData.data.filter(u => u.role === 'manager'));
      }
      
      if (notifs.success) {
        const unread = (notifs.notifications || []).filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddEmployee = () => {
    setFormData({ name: '', email: '', department: '', password: '', manager: '' });
    setShowAddEmployee(true);
    setError('');
  };

  const openAddManager = () => {
    setFormData({ name: '', email: '', department: '', password: '' });
    setShowAddManager(true);
    setError('');
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      department: user.department || '',
      manager: user.manager ? user.manager._id : ''
    });
    setShowEditUser(true);
    setError('');
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.addEmployee({
        ...formData,
        manager: formData.manager || null
      });
      if (res.success) {
        setShowAddEmployee(false);
        setSuccessMsg('Employee added successfully');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to add employee');
    }
  };

  const handleAddManager = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.addManager(formData);
      if (res.success) {
        setShowAddManager(false);
        setSuccessMsg('Manager added successfully');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to add manager');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        department: formData.department,
        manager: editingUser.role === 'employee' ? (formData.manager || null) : undefined
      };
      
      const res = await adminService.updateUser(editingUser._id, payload);
      if (res.success) {
        setShowEditUser(false);
        setSuccessMsg('User updated successfully');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }
    try {
      const res = await adminService.updateUserStatus(userId, !currentStatus);
      if (res.success) {
        setSuccessMsg(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="dashboard-layout">
      <AdminSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <div className="manager-dashboard-container">
          <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="dashboard-title">All Employees</h1>
              <p className="dashboard-subtitle">Organization-wide user directory</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={openAddEmployee} className="dash-btn primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Add Employee
              </button>
              <button onClick={openAddManager} className="dash-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#334155', color: '#fff' }}>
                <Plus size={16} /> Add Manager
              </button>
            </div>
          </header>

          {error && <div className="dash-error" style={{ marginBottom: '16px' }}>{error}</div>}
          {successMsg && (
             <div className="dash-info" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', marginBottom: '16px' }}>
                <CheckCircle2 size={15} /> {successMsg}
             </div>
          )}
          
          <div className="manager-overview-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Users size={18} style={{ color: '#64748b' }} />
                 <h3 className="manager-overview-heading" style={{ margin: 0, border: 'none', padding: 0 }}>Directory</h3>
              </div>
              
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search organization..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '8px 12px 8px 32px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '250px' }}
                />
              </div>
            </div>

            {loading ? (
              <div className="dash-loading" style={{ padding: '40px' }}>Loading directory...</div>
            ) : filteredEmployees.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                No users found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', background: '#f8fafc' }}>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Role</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Department</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Manager</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map(emp => (
                      <tr key={emp._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 500, color: '#0f172a' }}>{emp.name}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{emp.email}</td>
                        <td style={{ padding: '12px 20px', color: '#475569', textTransform: 'capitalize' }}>
                          <span style={{ fontWeight: emp.role === 'manager' ? '600' : '400', color: emp.role === 'manager' ? '#4338ca' : 'inherit' }}>
                            {emp.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>
                          {emp.department ? (
                             <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                               {emp.department}
                             </span>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>
                          {emp.role === 'manager' ? (
                            <span style={{ color: '#cbd5e1' }}>N/A</span>
                          ) : emp.manager ? (
                            emp.manager.name
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          {emp.isActive ? (
                             <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span> Active
                             </span>
                          ) : (
                             <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }}></span> Inactive
                             </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEditUser(emp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => toggleUserStatus(emp._id, emp.isActive)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: emp.isActive ? '#ef4444' : '#10b981' }} title={emp.isActive ? "Deactivate" : "Activate"}>
                              {emp.isActive ? <ShieldOff size={16} /> : <Shield size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Employee Modal */}
        {showAddEmployee && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>Add Employee</h2>
              <form onSubmit={handleAddEmployee}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Password *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Assign Manager</label>
                  <select name="manager" value={formData.manager} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">Unassigned</option>
                    {managersList.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.department || 'No dept'})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowAddEmployee(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="dash-btn primary">Save Employee</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Manager Modal */}
        {showAddManager && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>Add Manager</h2>
              <form onSubmit={handleAddManager}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Password *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowAddManager(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="dash-btn primary" style={{ background: '#334155' }}>Save Manager</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUser && editingUser && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>Edit {editingUser.role === 'manager' ? 'Manager' : 'Employee'}</h2>
              <form onSubmit={handleEditUser}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>Email (Cannot be changed)</label>
                  <input type="email" value={editingUser.email} disabled style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                {editingUser.role === 'employee' && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Assign Manager</label>
                    <select name="manager" value={formData.manager} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                      <option value="">Unassigned</option>
                      {managersList.map(m => (
                        <option key={m._id} value={m._id}>{m.name} ({m.department || 'No dept'})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowEditUser(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="dash-btn primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminEmployees;
