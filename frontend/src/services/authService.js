import { handleResponse, handleFetchError } from './apiHelper';
const API_URL = 'http://localhost:5000/api/auth';

const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
    const data = await handleResponse(response, 'Login failed');
    return data.data;
  } catch (error) {
    handleFetchError(error);
  }
};

const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

    const data = await handleResponse(response, 'Registration failed');
    return data.data;
  } catch (error) {
    handleFetchError(error);
  }
};

const getCurrentUser = async (token) => {
  try {
    const response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

    const data = await handleResponse(response, 'Failed to fetch user');
    return data.data;
  } catch (error) {
    handleFetchError(error);
  }
};

const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });
    const data = await handleResponse(response, 'Failed to update profile');
    return data;
  } catch (error) {
    handleFetchError(error);
  }
};

const changePassword = async (passwordData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(passwordData),
  });
    const data = await handleResponse(response, 'Failed to change password');
    return data;
  } catch (error) {
    handleFetchError(error);
  }
};

export default {
  login,
  register,
  getCurrentUser,
  updateProfile,
  changePassword,
};
