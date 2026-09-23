import { handleResponse, handleFetchError } from './apiHelper';

const BASE_URL = '/api/agent';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const agentService = {
  getStatus: async () => {
    try {
      const response = await fetch(`${BASE_URL}/status`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to fetch agent status');
      return data;
    } catch (error) {
      console.error('Error checking agent status:', error);
      return { success: false, connected: false };
    }
  },

  requestPairingCode: async () => {
    try {
      const response = await fetch(`${BASE_URL}/pairing-code`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response, 'Failed to request pairing code');
      return data;
    } catch (error) {
      console.error('Error requesting pairing code:', error);
      throw error;
    }
  }
};

export default agentService;
