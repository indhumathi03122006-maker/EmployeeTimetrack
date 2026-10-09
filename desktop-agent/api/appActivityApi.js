const { net } = require('electron');
const config = require('../config');

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
    } catch (err) {
      return reject(new Error(`net.request Error: ${err.message}`));
    }

    try {
      request.setHeader('Authorization', String(`Bearer ${token}`));
    } catch (err) {
      return reject(new Error(`setHeader Auth Error: ${err.message}`));
    }
    
    let bodyString = null;
    if (body) {
      bodyString = String(JSON.stringify(body));
      try {
        request.setHeader('Content-Type', 'application/json');
      } catch (err) {
        return reject(new Error(`setHeader Content-Type Error: ${err.message}`));
      }
    }

    request.on('response', (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk.toString();
      });

      response.on('end', () => {
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
      reject(new Error(`Network Error: ${error.message}`));
    });

    if (bodyString) {
      try {
        request.write(bodyString);
      } catch (err) {
        return reject(new Error(`request.write Error: ${err.message}`));
      }
    }
    
    try {
      request.end();
    } catch (err) {
      return reject(new Error(`request.end Error: ${err.message}`));
    }
  });
}

async function sendAppActivity(token, activityData) {
  return makeRequest('POST', '/api/app-activity', token, activityData);
}

module.exports = {
  sendAppActivity,
};
