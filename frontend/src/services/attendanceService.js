const BASE_URL = 'http://localhost:5000/api/attendance';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// POST /api/attendance/check-in
const checkIn = async () => {
  const response = await fetch(`${BASE_URL}/check-in`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Check-in failed');
  }
  return data;
};

// POST /api/attendance/check-out
const checkOut = async () => {
  const response = await fetch(`${BASE_URL}/check-out`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Check-out failed');
  }
  return data;
};

// GET /api/attendance/today
const getTodayAttendance = async () => {
  const response = await fetch(`${BASE_URL}/today`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch today attendance');
  }
  return data;
};

// GET /api/attendance/history?page=1&limit=10
const getAttendanceHistory = async (page = 1, limit = 10) => {
  const response = await fetch(`${BASE_URL}/history?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch attendance history');
  }
  return data;
};

// GET /api/attendance/report?startDate=...&endDate=...
const getReport = async (startDate, endDate) => {
  const response = await fetch(`${BASE_URL}/report?startDate=${startDate}&endDate=${endDate}`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch report');
  }
  return data;
};

export default {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  getReport,
};
