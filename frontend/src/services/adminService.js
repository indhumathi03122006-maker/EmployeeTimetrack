import { handleResponse, handleFetchError } from './apiHelper';
import axios from 'axios';

const API_URL = '/api/admin';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const getDashboardSummary = async () => {
  const response = await axios.get(`${API_URL}/dashboard`, getAuthHeaders());
  return response.data;
};

const getTeamMembers = async () => {
  const response = await axios.get(`${API_URL}/employees`, getAuthHeaders());
  return response.data;
};

const getTeamAttendance = async (startDate, endDate) => {
  let url = `${API_URL}/attendance`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await axios.get(url, getAuthHeaders());
  return response.data;
};

const getTeamWorkSessions = async (startDate, endDate) => {
  let url = `${API_URL}/work-time`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await axios.get(url, getAuthHeaders());
  return response.data;
};

const getTeamCurrentActivity = async () => {
  const response = await axios.get(`${API_URL}/current-activity`, getAuthHeaders());
  return response.data;
};

const getTeamReports = async (startDate, endDate, employeeId) => {
  let url = `${API_URL}/reports`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (employeeId) params.append('employeeId', employeeId);
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await axios.get(url, getAuthHeaders());
  return response.data;
};

const addEmployee = async (employeeData) => {
  try {
    const response = await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders().headers
      },
      body: JSON.stringify(employeeData)
    });
    return await handleResponse(response, 'Failed to add employee');
  } catch (error) {
    handleFetchError(error);
  }
};

const addManager = async (managerData) => {
  try {
    const response = await fetch(`${API_URL}/managers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders().headers
      },
      body: JSON.stringify(managerData)
    });
    return await handleResponse(response, 'Failed to add manager');
  } catch (error) {
    handleFetchError(error);
  }
};

const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders().headers
      },
      body: JSON.stringify(userData)
    });
    return await handleResponse(response, 'Failed to update user');
  } catch (error) {
    handleFetchError(error);
  }
};

const updateUserStatus = async (userId, isActive) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders().headers
      },
      body: JSON.stringify({ isActive })
    });
    return await handleResponse(response, 'Failed to update status');
  } catch (error) {
    handleFetchError(error);
  }
};

const adminService = {
  getDashboardSummary,
  getTeamMembers, // Mapping to endpoints identically to reuse component logic
  getTeamAttendance,
  getTeamWorkSessions,
  getTeamCurrentActivity,
  getTeamReports,
  addEmployee,
  addManager,
  updateUser,
  updateUserStatus
};

export default adminService;
