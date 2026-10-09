import { handleResponse, handleFetchError } from './apiHelper';
const BASE_URL = '/api/app-activity';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// GET /api/app-activity?date=YYYY-MM-DD&employeeId=...
const getAppActivities = async (dateStr, employeeId = '') => {
  try {
    let url = `${BASE_URL}?date=${encodeURIComponent(dateStr || '')}`;
    if (employeeId) {
      url += `&employeeId=${encodeURIComponent(employeeId)}`;
    }
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response, 'Failed to fetch application activity');
    return data;
  } catch (error) {
    handleFetchError(error);
  }
};

export default {
  getAppActivities,
};
