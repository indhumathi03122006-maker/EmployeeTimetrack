const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, 'agent-token.enc');
const FALLBACK_FILE = path.join(__dirname, 'local-token.txt');

let memoryToken = '';

function loadToken() {
  const { safeStorage } = require('electron');
  
  if (fs.existsSync(TOKEN_FILE)) {
    try {
      const encrypted = fs.readFileSync(TOKEN_FILE);
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        memoryToken = safeStorage.decryptString(encrypted);
        return memoryToken;
      } else {
        // Fallback to plaintext if not encrypted properly? Let's just return memoryToken empty if encryption fails
        memoryToken = encrypted.toString('utf8');
        return memoryToken;
      }
    } catch (e) {
      console.log('Error reading token file', e);
    }
  }
  
  // Fallback
  if (fs.existsSync(FALLBACK_FILE)) {
    try {
      memoryToken = fs.readFileSync(FALLBACK_FILE, 'utf8').trim();
      return memoryToken;
    } catch (e) {
      console.log('Error reading fallback file', e);
    }
  }
  
  return memoryToken;
}

function saveToken(token) {
  const { safeStorage } = require('electron');
  memoryToken = token;
  
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(token);
      fs.writeFileSync(TOKEN_FILE, encrypted);
    } else {
      fs.writeFileSync(TOKEN_FILE, token);
    }
  } catch (e) {
    console.log('Error saving token', e);
  }
}

module.exports = {
  BACKEND_URL: 'http://localhost:5000',
  get DEVELOPMENT_JWT() {
    return loadToken();
  },
  saveToken
};
