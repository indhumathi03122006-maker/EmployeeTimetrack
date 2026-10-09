import axios from 'axios';

const API_URL = '/api/shift';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const getShifts = async () => {
  const response = await axios.get(API_URL, getAuthHeaders());
  return response.data;
};

const createShift = async (shiftData) => {
  const response = await axios.post(API_URL, shiftData, getAuthHeaders());
  return response.data;
};

const updateShift = async (id, shiftData) => {
  const response = await axios.put(`${API_URL}/${id}`, shiftData, getAuthHeaders());
  return response.data;
};

const updateShiftStatus = async (id, status) => {
  const response = await axios.put(`${API_URL}/${id}/status`, { status }, getAuthHeaders());
  return response.data;
};

const getAssignedEmployees = async (shiftId) => {
  const response = await axios.get(`${API_URL}/${shiftId}/employees`, getAuthHeaders());
  return response.data;
};

const assignEmployees = async (shiftId, employeeIds) => {
  const response = await axios.post(`${API_URL}/${shiftId}/assign`, { employeeIds }, getAuthHeaders());
  return response.data;
};

const shiftService = {
  getShifts,
  createShift,
  updateShift,
  updateShiftStatus,
  getAssignedEmployees,
  assignEmployees
};

export default shiftService;
