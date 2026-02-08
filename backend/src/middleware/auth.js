const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId; // Main usage
    req.auth = { userId: decoded.userId }; // Backward compatibility
    req.user = decoded; // Backward compatibility
    next();
  } catch (error) {
    console.error('JWT Error:', error.message);
    return res.status(401).json({ error: 'Invalid Token' });
  }
};

const logUser = (req, res, next) => {
  if (req.userId) {
    // console.log('User:', req.userId);
  }
  next();
};

module.exports = { requireAuth, logUser, JWT_SECRET };
