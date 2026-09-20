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

const adminService = {
  getDashboardSummary,
  getTeamMembers, // Mapping to endpoints identically to reuse component logic
  getTeamAttendance,
  getTeamWorkSessions,
  getTeamCurrentActivity,
  getTeamReports
};

export default adminService;
