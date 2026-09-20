const { net } = require('electron');
const config = require('../config');

// Helper to make requests using Electron's native net module
// Using net is better for Electron main process than fetch for native OS networking
function makeRequest(method, endpoint, token, body = null) {
  return new Promise((resolve, reject) => {
    if (!token) {
      return reject(new Error('Authentication Required'));
    }

    const url = `${config.BACKEND_URL}${endpoint}`;
    let request;
    
    try {
      request = net.request({
        method: String(method),
        url: String(url)
      });
      console.log(`[DEBUG] net.request created: ${method} ${url}`);
    } catch (err) {
      console.log(`[DEBUG] ERROR in net.request:`, err.message);
      return reject(new Error(`net.request Error: ${err.message}`));
    }

    try {
      request.setHeader('Authorization', String(`Bearer ${token}`));
      console.log(`[DEBUG] setHeader Authorization: SUCCESS`);
    } catch (err) {
      console.log(`[DEBUG] ERROR in setHeader Authorization:`, err.message);
      return reject(new Error(`setHeader Auth Error: ${err.message}`));
    }
    
    let bodyString = null;
    if (body) {
      bodyString = String(JSON.stringify(body));
      try {
        request.setHeader('Content-Type', 'application/json');
        console.log(`[DEBUG] setHeader Content-Type: SUCCESS`);
      } catch (err) {
        console.log(`[DEBUG] ERROR in setHeader Content-Type:`, err.message);
        return reject(new Error(`setHeader Content-Type Error: ${err.message}`));
      }

      if (method === 'POST') {
        console.log(`[DEBUG] POST ${endpoint} - Sending status:`, body.status, 'Body length:', bodyString.length);
      }
    }

    request.on('response', (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk.toString();
      });

      response.on('end', () => {
        if (method === 'POST') {
           console.log(`[DEBUG] POST ${endpoint} - Response Status:`, response.statusCode);
           console.log(`[DEBUG] POST ${endpoint} - Response Body:`, data);
        }
        
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: response.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: response.statusCode,
            data: { message: data || 'No response body' }
          });
        }
      });
    });

    request.on('error', (error) => {
      console.log(`[DEBUG] makeRequest Network Error for ${endpoint}:`, error.message);
      reject(new Error(`Network Error: ${error.message}`));
    });

    if (bodyString) {
      try {
        request.write(bodyString);
        console.log(`[DEBUG] request.write: SUCCESS`);
      } catch (err) {
        console.log(`[DEBUG] ERROR in request.write:`, err.message);
        return reject(new Error(`request.write Error: ${err.message}`));
      }
    }
    
    try {
      request.end();
      console.log(`[DEBUG] request.end: SUCCESS`);
    } catch (err) {
      console.log(`[DEBUG] ERROR in request.end:`, err.message);
      return reject(new Error(`request.end Error: ${err.message}`));
    }
  });
}

async function getCurrentSession(token) {
  return makeRequest('GET', '/api/work-session/current', token);
}

async function sendActivityStatus(token, status) {
  return makeRequest('POST', '/api/work-session/activity', token, { status });
}

module.exports = {
  getCurrentSession,
  sendActivityStatus
};
