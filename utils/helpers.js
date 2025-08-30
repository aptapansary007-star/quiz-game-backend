// Generate random room ID
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffle array in place using Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Format time in MM:SS format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Generate unique player ID
function generatePlayerId() {
  return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Validate room ID format
function isValidRoomId(roomId) {
  return typeof roomId === 'string' && /^[A-Z0-9]{6}$/.test(roomId);
}

// Validate player name
function isValidPlayerName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 20;
}

// Calculate percentage
function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Generate random string
function generateRandomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Deep clone object
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Remove duplicates from array
function removeDuplicates(array) {
  return [...new Set(array)];
}

// Check if object is empty
function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

// Sanitize string (remove special characters)
function sanitizeString(str) {
  return str.replace(/[^a-zA-Z0-9\s]/g, '').trim();
}

// Calculate time difference in seconds
function getTimeDifference(startTime, endTime = new Date()) {
  return Math.floor((endTime - startTime) / 1000);
}

// Generate safe random number for crypto operations
function getSecureRandom(min, max) {
  const range = max - min + 1;
  const randomBytes = require('crypto').randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0) / (0xFFFFFFFF + 1);
  return Math.floor(randomValue * range) + min;
}

// Validate email format (basic)
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get random element from array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Delay function (promise-based)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if value is numeric
function isNumeric(value) {
  return !isNaN(value) && !isNaN(parseFloat(value));
}

// Convert seconds to human readable format
function secondsToHumanReadable(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

module.exports = {
  generateRoomId,
  getRandomInt,
  shuffleArray,
  formatTime,
  generatePlayerId,
  isValidRoomId,
  isValidPlayerName,
  calculatePercentage,
  getCurrentTimestamp,
  generateRandomString,
  deepClone,
  removeDuplicates,
  isEmptyObject,
  sanitizeString,
  getTimeDifference,
  getSecureRandom,
  isValidEmail,
  getRandomElement,
  capitalizeFirst,
  delay,
  isNumeric,
  secondsToHumanReadable
};
