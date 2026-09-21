const { net } = require('electron');
const config = require('../config');

function makeRequest(method, endpoint, token, body = null) {
  return new Promise((resolve, reject) => {
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

    if (token) {
      try {
        request.setHeader('Authorization', String(`Bearer ${token}`));
      } catch (err) {
        return reject(new Error(`setHeader Auth Error: ${err.message}`));
      }
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
      request.write(bodyString);
    }
    
    request.end();
  });
}

async function pairAgent(code) {
  return makeRequest('POST', '/api/agent/pair', null, { code });
}

async function sendHeartbeat(token) {
  return makeRequest('POST', '/api/agent/heartbeat', token);
}

module.exports = {
  pairAgent,
  sendHeartbeat
};
