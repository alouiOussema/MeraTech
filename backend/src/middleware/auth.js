const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Strict authentication: Request must have a valid session
const requireAuth = ClerkExpressRequireAuth({
  onError: (err, req, res, next) => {
    console.error('Clerk Auth Error:', err);
    res.status(401).json({ error: 'Unauthenticated' });
  }
});

// Middleware to log user info for debugging (optional)
const logUser = (req, res, next) => {
  if (req.auth) {
    // console.log('User:', req.auth.userId);
  }
  next();
};

module.exports = { requireAuth, logUser };
