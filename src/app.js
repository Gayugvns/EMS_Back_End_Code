// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const configRoutes = require('./routes/configRoutes');

// Create Express app
const app = express();

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/config', configRoutes);

// ========== HEALTH CHECK ROUTES ==========

// Test route
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'EMS API is working!',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me'
            },
            employees: {
                getAll: 'GET /api/employees',
                create: 'POST /api/employees',
                getOne: 'GET /api/employees/:id',
                update: 'PUT /api/employees/:id',
                delete: 'DELETE /api/employees/:id'
            },
            config: 'GET /api/config'
        }
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Employee Management System API',
        version: '1.0.0',
        status: 'running',
        documentation: 'Visit /api/test for endpoints',
        support: {
            auth: 'Register and login users',
            employees: 'CRUD operations for employees',
            uploads: 'File uploads at /uploads'
        }
    });
});

// ========== ERROR HANDLING ==========

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`,
        availableRoutes: [
            'GET  /',
            'GET  /api/test',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET  /api/employees',
            'GET  /api/config'
        ]
    });
});

// Export the app
module.exports = app;