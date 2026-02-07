const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token, maybe allow guest? For now, strict auth for profile.
    // return res.status(401).json({ error: 'Unauthenticated' });
    
    // Fallback to guest for dev if needed, BUT for profile we need real user.
    // If we want to support both, we check token first.
    // For this task (Profile), we need the real user.
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
};

const logUser = (req, res, next) => {
  if (req.user) {
    // console.log('User:', req.user.userId);
  }
  next();
};

module.exports = { requireAuth, logUser, JWT_SECRET };