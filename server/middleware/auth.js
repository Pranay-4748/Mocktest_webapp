import { verifyToken } from '../utils/jwt.js';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.split(' ')[1];
  return null;
};

// Protects admin-only routes
export const protectAdmin = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required' });

    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: 'Admin not found' });

    req.admin = admin;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ message });
  }
};

// Protects student/user routes
export const protectUser = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = verifyToken(token);
    if (decoded.role === 'admin')
      return res.status(403).json({ message: 'Student access only' });

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ message });
  }
};

// Legacy alias — kept for existing user auth routes
export const protect = protectUser;
