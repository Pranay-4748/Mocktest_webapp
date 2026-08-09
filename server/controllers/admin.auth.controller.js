import Admin from '../models/Admin.js';
import { generateToken } from '../utils/jwt.js';

// Strips sensitive fields for response
const adminPayload = (admin) => ({
  _id: admin._id,
  name: admin.name,
  email: admin.email,
  createdAt: admin.createdAt,
});

// POST /api/admin/auth/register
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await Admin.findOne({ email });
    if (exists)
      return res.status(409).json({ message: 'Email already registered' });

    const admin = await Admin.create({ name, email, password });
    const token = generateToken(admin._id, 'admin');

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token,
      admin: adminPayload(admin),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
};

// POST /api/admin/auth/login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(admin._id, 'admin');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: adminPayload(admin),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Login failed' });
  }
};

// GET /api/admin/auth/me  (protected)
export const getAdminMe = async (req, res) => {
  try {
    res.json({ success: true, admin: adminPayload(req.admin) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/auth/logout  (protected)
// JWT is stateless — logout is handled client-side by discarding the token.
// This endpoint exists so the client has a consistent API call to hook into.
export const logoutAdmin = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
