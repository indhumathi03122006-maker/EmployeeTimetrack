const BASE_URL = 'http://localhost:5000/api/work-session';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// POST /api/work-session/start
const startWorkSession = async () => {
  const response = await fetch(`${BASE_URL}/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to start work session');
  }
  return data;
};

// POST /api/work-session/activity
// status must be "active" or "idle"
const updateActivity = async (status) => {
  const response = await fetch(`${BASE_URL}/activity`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update activity status');
  }
  return data;
};

// GET /api/work-session/current
const getCurrentWorkSession = async () => {
  const response = await fetch(`${BASE_URL}/current`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch current work session');
  }
  return data;
};

// POST /api/work-session/end
const endWorkSession = async () => {
  const response = await fetch(`${BASE_URL}/end`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to end work session');
  }
  return data;
};

export default {
  startWorkSession,
  updateActivity,
  getCurrentWorkSession,
  endWorkSession,
};
