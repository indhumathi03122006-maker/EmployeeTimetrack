const fs = require('fs');
const path = require('path');

let token = '';
try {
  const tokenPath = path.join(__dirname, 'local-token.txt');
  if (fs.existsSync(tokenPath)) {
    token = fs.readFileSync(tokenPath, 'utf8').trim();
  }
} catch (err) {
  // Ignore
}

module.exports = {
  BACKEND_URL: 'http://localhost:5000',
  DEVELOPMENT_JWT: token
};
