import { handleResponse, handleFetchError } from './apiHelper';
const BASE_URL = '/api/attendance';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// POST /api/attendance/check-in
const checkIn = async () => {
  try {
    const response = await fetch(`${BASE_URL}/check-in`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Check-in failed');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

// POST /api/attendance/check-out
const checkOut = async () => {
  try {
    const response = await fetch(`${BASE_URL}/check-out`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Check-out failed');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

// GET /api/attendance/today
const getTodayAttendance = async () => {
  try {
    const response = await fetch(`${BASE_URL}/today`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to fetch today attendance');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

// GET /api/attendance/history?page=1&limit=10
const getAttendanceHistory = async (page = 1, limit = 10) => {
  try {
    const response = await fetch(`${BASE_URL}/history?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to fetch attendance history');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

// GET /api/attendance/report?startDate=...&endDate=...
const getReport = async (startDate, endDate) => {
  try {
    const response = await fetch(`${BASE_URL}/report?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to fetch report');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

export default {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  getReport,
};
