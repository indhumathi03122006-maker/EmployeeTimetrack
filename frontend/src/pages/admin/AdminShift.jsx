import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import shiftService from '../../services/shift.service';
import adminService from '../../services/adminService';
import notificationService from '../../services/notificationService';
import { Clock, Plus, Edit2, Trash2, Users, Search } from 'lucide-react';
import '../manager/ManagerDashboard.css';

const AdminShift = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignShiftId, setAssignShiftId] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const initialFormState = {
    name: '',
    startTime: '',
    endTime: '',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    status: 'Active',
    extraBreaks: []
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await notificationService.getNotifications();
        if (notifs.success) {
          setUnreadCount((notifs.notifications || []).filter(n => !n.isRead).length);
        }
      } catch (err) {}
    };
    fetchNotifs();
    loadShifts();
    loadEmployees(); // Preload employees for assignment
  }, []);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const res = await shiftService.getShifts();
      if (res.success) {
        // Fetch employee counts for each shift to show on cards
        const shiftsWithCounts = await Promise.all(res.data.map(async (shift) => {
          try {
            const countRes = await shiftService.getAssignedEmployees(shift._id);
            if (countRes.success) {
              return { ...shift, assignedCount: countRes.employees ? countRes.employees.length : 0 };
            }
          } catch(e) {}
          return { ...shift, assignedCount: 0 };
        }));
        setShifts(shiftsWithCounts);
      }
    } catch (err) {
      setErrorMsg('Failed to load shifts.');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await adminService.getTeamMembers();
      if (res.success) {
        // Only actual active employees
        setAllEmployees(res.data.filter(emp => emp.role === 'employee' && emp.isActive));
      }
    } catch (err) {
      console.error('Failed to load employees for assignment', err);
    }
  };

  const openAssignModal = async (shift) => {
    setAssignShiftId(shift._id);
    setEmployeeSearchTerm('');
    setAssignLoading(true);
    setShowAssignModal(true);
    
    try {
      const res = await shiftService.getAssignedEmployees(shift._id);
      if (res.success && res.employees) {
        setSelectedEmployees(res.employees.map(emp => emp._id));
      } else {
        setSelectedEmployees([]);
      }
    } catch (err) {
      setErrorMsg('Failed to load assigned employees.');
      setSelectedEmployees([]);
    } finally {
      setAssignLoading(false);
    }
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setAssignShiftId(null);
    setSelectedEmployees([]);
    setEmployeeSearchTerm('');
  };

  const handleToggleEmployee = (empId) => {
    setSelectedEmployees(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleSaveAssignment = async () => {
    if (!assignShiftId) return;
    try {
      setAssignLoading(true);
      const res = await shiftService.assignEmployees(assignShiftId, selectedEmployees);
      if (res.success) {
        setSuccessMsg('Employees assigned successfully.');
        closeAssignModal();
        loadShifts(); // refresh to update counts
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to assign employees.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setCurrentShiftId(null);
    setShowForm(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleDayToggle = (day) => {
    const current = formData.workingDays || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    const sorted = updated.sort((a, b) => allDays.indexOf(a) - allDays.indexOf(b));
    setFormData({ ...formData, workingDays: sorted });
  };

  const validateBreaks = (breaks) => {
    const sortedBreaks = [...breaks].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < sortedBreaks.length; i++) {
      if (sortedBreaks[i].startTime >= sortedBreaks[i].endTime) {
        return 'Break start time must be before end time.';
      }
      if (i > 0 && sortedBreaks[i].startTime < sortedBreaks[i - 1].endTime) {
        return 'Break slots cannot overlap.';
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.extraBreaks.length > 0) {
      const breakError = validateBreaks(formData.extraBreaks);
      if (breakError) {
        setErrorMsg(breakError);
        return;
      }
    }

    try {
      if (isEditing) {
        const res = await shiftService.updateShift(currentShiftId, formData);
        if (res.success) {
          setSuccessMsg('Shift updated successfully.');
          loadShifts();
          setTimeout(resetForm, 1500);
        }
      } else {
        const res = await shiftService.createShift(formData);
        if (res.success) {
          setSuccessMsg('Shift created successfully.');
          loadShifts();
          setTimeout(resetForm, 1500);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save shift.');
    }
  };

  if (!user) {
    return (
      <div className="dashboard-layout">
        <AdminSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
        <main className="dashboard-main">
          <div className="dash-loading">Loading...</div>
        </main>
      </div>
    );
  }

  const filteredEmployeesForAssignment = allEmployees.filter(emp => 
    emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <AdminSidebar user={user} onLogout={handleLogout} unreadCount={unreadCount} />
      
      <main className="dashboard-main">
        <div style={{ width: '90%', maxWidth: '900px', margin: '30px auto' }}>
          
          {errorMsg && (
            <div className="dash-error" style={{ marginBottom: '16px' }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="dash-info" style={{ marginBottom: '16px' }}>
              {successMsg}
            </div>
          )}

          <div className="dash-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              {!showForm ? (
                <button className="dash-btn primary" onClick={() => setShowForm(true)}>
                  <Plus size={16} style={{ marginRight: '6px' }} /> Create New Shift
                </button>
              ) : (
                <button className="dash-btn secondary" onClick={resetForm}>
                  View All Shifts
                </button>
              )}
            </div>

            {showForm ? (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Shift Details</h4>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Shift Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="auth-input"
                      placeholder="Enter shift name"
                      style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Start Time</label>
                      <input 
                        type="time" 
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="auth-input"
                        style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>End Time</label>
                      <input 
                        type="time" 
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="auth-input"
                        style={{ margin: 0, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>Working Days</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {allDays.map(day => {
                        const isSelected = (formData.workingDays || []).includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleDayToggle(day)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '6px',
                              border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                              background: isSelected ? 'var(--accent-blue-light)' : 'var(--bg-primary)',
                              color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              flex: '1 1 auto',
                              textAlign: 'center'
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Breaks</h4>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, extraBreaks: [...(formData.extraBreaks || []), { startTime: '12:00', endTime: '12:15' }] })}
                      className="dash-btn secondary"
                      style={{ fontSize: '13px', padding: '6px 12px' }}
                    >
                      + Add Break
                    </button>
                  </div>

                  {(!formData.extraBreaks || formData.extraBreaks.length === 0) ? (
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
                      No breaks added
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {formData.extraBreaks.map((slot, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                          <div style={{ width: '60px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                            Break {index + 1}
                          </div>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Start Time</label>
                              <input 
                                type="time" 
                                value={slot.startTime}
                                onChange={(e) => {
                                  const updated = [...formData.extraBreaks];
                                  updated[index].startTime = e.target.value;
                                  setFormData({ ...formData, extraBreaks: updated });
                                }}
                                className="auth-input"
                                style={{ margin: 0, padding: '6px 10px', fontSize: '13px', width: '120px', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                required
                              />
                            </div>
                            <span style={{ color: 'var(--text-muted)', marginTop: '16px' }}>→</span>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>End Time</label>
                              <input 
                                type="time" 
                                value={slot.endTime}
                                onChange={(e) => {
                                  const updated = [...formData.extraBreaks];
                                  updated[index].endTime = e.target.value;
                                  setFormData({ ...formData, extraBreaks: updated });
                                }}
                                className="auth-input"
                                style={{ margin: 0, padding: '6px 10px', fontSize: '13px', width: '120px', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.extraBreaks.filter((_, i) => i !== index);
                                setFormData({ ...formData, extraBreaks: updated });
                              }}
                              className="dash-btn danger"
                              style={{ padding: '6px 10px', marginTop: '18px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                  <button type="button" className="dash-btn secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="dash-btn primary">
                    {isEditing ? 'Save Changes' : 'Create Shift'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {loading ? (
                  <div className="dash-loading" style={{ minHeight: '100px' }}>Loading shifts...</div>
                ) : shifts.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No shifts found. Click "Create New Shift" to add one.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {shifts.map(shift => (
                      <div key={shift._id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', background: 'var(--bg-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{shift.name}</h4>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="dash-btn secondary" 
                              style={{ padding: '4px 8px', fontSize: '12px', border: 'none', background: 'transparent' }}
                              onClick={() => {
                                setFormData(shift);
                                setIsEditing(true);
                                setCurrentShiftId(shift._id);
                                setShowForm(true);
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                            <Clock size={14} style={{ marginRight: '6px', color: 'var(--text-muted)' }} />
                            {shift.startTime} - {shift.endTime}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            {shift.workingDays.join(', ')}
                          </div>
                          
                          {shift.extraBreaks && shift.extraBreaks.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <span style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>Breaks</span>
                              {shift.extraBreaks.map((b, idx) => (
                                <div key={idx} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  • {b.startTime} - {b.endTime}
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                              Assigned Employees: {shift.assignedCount || 0}
                            </div>
                            <button 
                              className="dash-btn secondary" 
                              style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => openAssignModal(shift)}
                            >
                              <Users size={14} /> Assign Employees
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Assign Employees Modal */}
      {showAssignModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: 'var(--text-primary)' }}>Assign Employees</h2>
            
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 32px', border: '1px solid var(--border-color)', borderRadius: '6px', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '20px' }}>
              {assignLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
              ) : filteredEmployeesForAssignment.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredEmployeesForAssignment.map(emp => (
                    <label key={emp._id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: selectedEmployees.includes(emp._id) ? 'var(--bg-hover)' : 'transparent' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedEmployees.includes(emp._id)}
                        onChange={() => handleToggleEmployee(emp._id)}
                        style={{ marginRight: '12px', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{emp.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.email} {emp.department ? `• ${emp.department}` : ''}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={closeAssignModal} className="dash-btn secondary" disabled={assignLoading}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveAssignment} className="dash-btn primary" disabled={assignLoading}>
                {assignLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShift;
