import { handleResponse, handleFetchError } from './apiHelper';
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
  try {
    const response = await fetch(`${BASE_URL}?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to fetch notifications');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async () => {
  try {
    const response = await fetch(`${BASE_URL}/unread-count`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to fetch unread count');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to mark notification as read');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

// PUT /api/notifications/read-all
const markAllAsRead = async () => {
  try {
    const response = await fetch(`${BASE_URL}/read-all`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to mark all notifications as read');
      return data;
  } catch (error) {
    handleFetchError(error);
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
