const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  try {
    console.log('Password Utils: Hashing password...');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('Password Utils: Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    console.error('Password Utils: Error hashing password:', error.message);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match
 */
async function comparePassword(password, hashedPassword) {
  try {
    console.log('Password Utils: Comparing password...');
    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log('Password Utils: Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password Utils: Error comparing password:', error.message);
    throw new Error('Failed to compare password');
  }
}

/**
 * Check if a string is a valid bcrypt hash
 * @param {string} hash - String to check
 * @returns {boolean} - True if valid bcrypt hash
 */
function isPasswordHash(hash) {
  if (typeof hash !== 'string') {
    return false;
  }
  
  // bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$ followed by cost and salt
  const bcryptRegex = /^\$2[abxy]?\$\d{1,2}\$[A-Za-z0-9./]{53}$/;
  return bcryptRegex.test(hash);
}

module.exports = {
  hashPassword,
  comparePassword,
  isPasswordHash
};