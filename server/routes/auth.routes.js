const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Admin = require('../models/Admin');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    res.json({
      success: true,
      token,
      admin: admin.toJSON(),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// GET /api/auth/me — verify token and return admin info
router.get('/me', require('../middleware/auth.middleware'), (req, res) => {
  res.json({ success: true, admin: req.admin });
});

module.exports = router;
