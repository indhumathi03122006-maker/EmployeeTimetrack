const BASE_URL = 'http://localhost:5000/api/notifications';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// GET /api/notifications?page=1&limit=20
const getNotifications = async (page = 1, limit = 20) => {
  const response = await fetch(`${BASE_URL}?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch notifications');
  }
  return data;
};

// GET /api/notifications/unread-count
const getUnreadCount = async () => {
  const response = await fetch(`${BASE_URL}/unread-count`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch unread count');
  }
  return data;
};

// PUT /api/notifications/:id/read
const markAsRead = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to mark notification as read');
  }
  return data;
};

// PUT /api/notifications/read-all
const markAllAsRead = async () => {
  const response = await fetch(`${BASE_URL}/read-all`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to mark all notifications as read');
  }
  return data;
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
