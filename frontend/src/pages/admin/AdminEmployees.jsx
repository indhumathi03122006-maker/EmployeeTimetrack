import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import adminService from '../../services/adminService';
import notificationService from '../../services/notificationService';
import { Users, Search } from 'lucide-react';
import '../manager/ManagerDashboard.css';

const AdminEmployees = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empData, notifs] = await Promise.all([
          adminService.getTeamMembers(),
          notificationService.getNotifications()
        ]);
        
        if (empData.success) {
          setEmployees(empData.data);
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

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">All Employees</h1>
              <p className="dashboard-subtitle">Organization-wide employee directory</p>
            </div>
          </header>

          {error && <div className="error-banner">{error}</div>}
          
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
              <div className="dash-loading" style={{ padding: '40px' }}>Loading employees...</div>
            ) : filteredEmployees.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                No employees found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', background: '#f8fafc' }}>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Department</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Manager</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map(emp => (
                      <tr key={emp._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 500, color: '#0f172a' }}>{emp.name}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>{emp.email}</td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>
                          {emp.department ? (
                             <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                               {emp.department}
                             </span>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 20px', color: '#475569' }}>
                          {emp.manager ? emp.manager.name : <span style={{ color: '#cbd5e1' }}>Unassigned</span>}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEmployees;
