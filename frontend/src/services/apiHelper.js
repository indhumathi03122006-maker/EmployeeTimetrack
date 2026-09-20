export const handleResponse = async (response, defaultErrorMsg) => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Authentication required');
    if (response.status === 403) throw new Error('Access denied');
    if (response.status >= 500 || !data) throw new Error('Server error. Please try again.');
    throw new Error(data.message || defaultErrorMsg);
  }
  return data;
};

export const handleFetchError = (error) => {
  if (error.name === 'TypeError') throw new Error('Server error. Please try again.');
  throw error;
};
