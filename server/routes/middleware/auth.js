const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const requireUser = async (req, res, next) => {
  try {
    console.log('Auth middleware: Starting authentication check');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth middleware: No valid authorization header found');
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.substring(7);
    console.log('Auth middleware: Token extracted, length:', token.length);

    if (!process.env.JWT_SECRET) {
      console.error('Auth middleware: JWT_SECRET not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Token decoded successfully, user ID:', decoded.sub);

    // Add timeout and error handling for database query
    const user = await Promise.race([
      User.findById(decoded.sub).lean(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 8000)
      )
    ]);

    if (!user) {
      console.log('Auth middleware: User not found in database for ID:', decoded.sub);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('Auth middleware: User found and authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.message === 'Database query timeout') {
      return res.status(503).json({ message: 'Database connection timeout' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid access token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token expired' });
    }
    
    return res.status(500).json({ message: 'Authentication error' });
  }
};

module.exports = { requireUser };