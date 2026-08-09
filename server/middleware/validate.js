const EMAIL_RE = /^\S+@\S+\.\S+$/;

export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push('Name must be at least 2 characters');

  if (!email || !EMAIL_RE.test(email))
    errors.push('Valid email is required');

  if (!password || password.length < 6)
    errors.push('Password must be at least 6 characters');

  if (!/[A-Z]/.test(password))
    errors.push('Password must contain at least one uppercase letter');

  if (!/[0-9]/.test(password))
    errors.push('Password must contain at least one number');

  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !EMAIL_RE.test(email))
    errors.push('Valid email is required');

  if (!password || password.length < 1)
    errors.push('Password is required');

  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  next();
};
