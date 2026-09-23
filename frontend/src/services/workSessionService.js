import { handleResponse, handleFetchError } from './apiHelper';
const BASE_URL = '/api/work-session';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// POST /api/work-session/start
const startWorkSession = async () => {
  try {
    const response = await fetch(`${BASE_URL}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    let data;
    try { data = await response.json(); } catch(e) { data = null; }
    
    if (!response.ok) {
      if (response.status === 401) throw new Error('Authentication required');
      if (response.status === 403) throw new Error('Access denied');
      if (response.status >= 500 || !data) throw new Error('Server error. Please try again.');
      throw new Error(data.message || 'Failed to start work session');
    }
    return data;
  } catch (error) {
    if (error.name === 'TypeError') throw new Error('Server error. Please try again.');
    throw error;
  }
};

// POST /api/work-session/activity
// status must be "active" or "idle"
const updateActivity = async (status) => {
  try {
    const response = await fetch(`${BASE_URL}/activity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await handleResponse(response, 'Failed to update activity status');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

// GET /api/work-session/current
const getCurrentWorkSession = async () => {
  try {
    const response = await fetch(`${BASE_URL}/current`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to fetch current work session');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

// POST /api/work-session/end
const endWorkSession = async () => {
  try {
    const response = await fetch(`${BASE_URL}/end`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to end work session');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

export default {
  startWorkSession,
  updateActivity,
  getCurrentWorkSession,
  endWorkSession,
};
