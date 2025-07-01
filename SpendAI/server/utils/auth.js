const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  console.log('Token Generation: Creating access token for user:', user.email);
  console.log('Token Generation: User ID:', user._id);
  console.log('Token Generation: User account type:', user.accountType);

  // Check if the secret is available - use JWT_SECRET from .env
  if (!process.env.JWT_SECRET) {
    console.error('Token Generation: JWT_SECRET is missing from environment variables');
    throw new Error('JWT_SECRET environment variable is required');
  }

  const payload = {
    sub: user._id.toString(), // Make sure we convert ObjectId to string
    email: user.email,
    accountType: user.accountType
  };

  console.log('Token Generation: Token payload:', payload);
  console.log('Token Generation: Using JWT_SECRET (length):', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Token Generation: Generated token successfully');
    return token;
  } catch (error) {
    console.error('Token Generation: Error generating access token:', error.message);
    throw error;
  }
};

const generateRefreshToken = (user) => {
  console.log('Token Generation: Creating refresh token for user:', user.email);
  console.log('Token Generation: User ID:', user._id);

  // Check if the secret is available - use REFRESH_TOKEN_SECRET from .env
  if (!process.env.REFRESH_TOKEN_SECRET) {
    console.error('Token Generation: REFRESH_TOKEN_SECRET is missing from environment variables');
    throw new Error('REFRESH_TOKEN_SECRET environment variable is required');
  }

  const payload = {
    sub: user._id.toString(), // Make sure we convert ObjectId to string
  };

  console.log('Token Generation: Refresh token payload:', payload);
  console.log('Token Generation: Using REFRESH_TOKEN_SECRET (length):', process.env.REFRESH_TOKEN_SECRET ? process.env.REFRESH_TOKEN_SECRET.length : 'undefined');

  try {
    const token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
    console.log('Token Generation: Generated refresh token successfully');
    return token;
  } catch (error) {
    console.error('Token Generation: Error generating refresh token:', error.message);
    throw error;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};