import express from 'express';
import {
  registerAdmin,
  loginAdmin,
  getAdminMe,
  logoutAdmin,
} from '../controllers/admin.auth.controller.js';
import { protectAdmin } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';

const router = express.Router();

// Public
router.post('/register', validateRegister, registerAdmin);
router.post('/login',    validateLogin,    loginAdmin);

// Protected
router.get('/me',     protectAdmin, getAdminMe);
router.post('/logout', protectAdmin, logoutAdmin);

export default router;
