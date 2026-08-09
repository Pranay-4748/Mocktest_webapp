import jwt from 'jsonwebtoken';

export const generateToken = (id, role = 'user') =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

export const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);
