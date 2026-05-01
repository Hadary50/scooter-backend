const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Simple login using a password from environment variables
router.post('/login', async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Default for safety during setup

  if (password === adminPassword) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'secret_key_123', { expiresIn: '7d' });
    return res.json({ token });
  }

  res.status(401).json({ message: 'كلمة المرور غير صحيحة' });
});

module.exports = router;
