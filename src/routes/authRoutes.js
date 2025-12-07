const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  registerUser,
  loginUser,
  getCurrentUser,
} = require('../services/authService');

//helper
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};
//register
router.post('/register', async (req, res) => {
  try {

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


    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    console.error('Registration error:', error.message);

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
//login
router.post('/login', async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    //  Authenticate user
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

    // Generate JWT
    const token = generateToken(user._id, user.role);

    // FINAL RESPONSE 
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


    return res.status(200).json(responseBody);
  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Server error during login',
    });
  }
});
//current user
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
    console.error(' Error getting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});
//debug user
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });


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
//check mail

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
