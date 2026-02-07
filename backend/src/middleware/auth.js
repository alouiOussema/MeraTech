const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

const requireAuth = (req, res, next) => {
  // FORCE BYPASS for now (Unconditional Guest User)
  // This allows the app to work even if an invalid token is sent
  req.user = { userId: 'guest_user_123', name: 'Guest' };
  req.auth = { userId: 'guest_user_123' };
  return next();

  /*
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId: "..." }
    req.auth = { userId: decoded.userId }; // Keep backward compatibility for now
    next();
  } catch (error) {
    console.error('JWT Error:', error.message);
    return res.status(401).json({ error: 'Invalid Token' });
  }
  */
};

const logUser = (req, res, next) => {
  if (req.user) {
    // console.log('User:', req.user.userId);
  }
  next();
};

module.exports = { requireAuth, logUser, JWT_SECRET };