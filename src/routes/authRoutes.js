const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  registerUser,
  loginUser,
  getCurrentUser,
} = require('../services/authService');

// ================= HELPER =================
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Registration request received:', req.body.email);

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email and password',
      });
    }

    const result = await registerUser({
      name,
      email,
      password,
      role: role || 'user',
    });

    console.log('✅ User registered successfully');

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error during registration',
    });
  }
});

// ================= LOGIN (✅ FULL DATA FIX) =================
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    // ✅ Authenticate user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // ✅ Generate JWT
    const token = generateToken(user._id, user.role);

    // ✅ FINAL RESPONSE (THIS FIXES YOUR ISSUE)
    const responseBody = {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    };

    console.log('🔥 FINAL LOGIN RESPONSE BEING SENT:', responseBody);

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error('❌ Login error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Server error during login',
    });
  }
});

// ================= GET CURRENT USER (TEST) =================
router.get('/me', async (req, res) => {
  try {
    const user = await User.findOne().sort({ createdAt: -1 });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No users found in database',
      });
    }

    return res.json({
      success: true,
      message: 'Latest user from database',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error getting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// ================= DEBUG USERS =================
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    console.log(`📊 Found ${users.length} users in database`);

    return res.json({
      success: true,
      count: users.length,
      data: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message,
    });
  }
});

// ================= CHECK EMAIL =================
router.get('/check/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });

    return res.json({
      success: true,
      exists: !!user,
      data: user
        ? {
            id: user._id,
            name: user.name,
            email: user.email,
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

module.exports = router;
