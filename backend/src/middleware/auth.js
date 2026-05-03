import { verifyToken } from '../utils/jwt.js';

// Protects routes — checks for a valid JWT in the Authorization header
export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;

  // Header should look like: "Bearer eyJhbGci..."
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  try {
    const token = header.slice(7); // Strip "Bearer " prefix
    const { userId } = verifyToken(token);
    req.userId = userId; // Attach to request so controllers can use it
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};