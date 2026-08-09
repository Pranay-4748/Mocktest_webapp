import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    res.status(201).json({ token: generateToken(user._id), user: userResponse(user) });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({ token: generateToken(user._id), user: userResponse(user) });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Login failed' });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json(userResponse(req.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
