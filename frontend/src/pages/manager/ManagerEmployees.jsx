import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ManagerSidebar from '../../components/ManagerSidebar';
import managerService from '../../services/managerService';
import notificationService from '../../services/notificationService';
import { Users, Search } from 'lucide-react';
import '../employee/EmployeeDashboard.css';

const ManagerEmployees = () => {
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
          managerService.getTeamMembers(),
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
        setError('Failed to load team members');
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
      <ManagerSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Team Members</h1>
            <p className="dashboard-subtitle">Manage your assigned employees</p>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}
        
        <div className="dash-card">
          <div className="dash-card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Users size={18} style={{ color: '#64748b' }} />
               <h3 className="dash-card-title" style={{ margin: 0 }}>Directory</h3>
            </div>
            
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search team..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px 8px 32px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '200px' }}
              />
            </div>
          </div>

          {loading ? (
            <div className="dash-loading">Loading employees...</div>
          ) : filteredEmployees.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No employees found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Department</th>
                    <th style={{ padding: '12px', fontWeight: 600 }}>Account Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 500, color: '#0f172a' }}>{emp.name}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{emp.email}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>
                        {emp.department ? (
                           <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                             {emp.department}
                           </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
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
      </main>
    </div>
  );
};

export default ManagerEmployees;
