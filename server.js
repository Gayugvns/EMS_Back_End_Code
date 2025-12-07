// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// Create Express app
const app = express();

// ========== DATABASE CONNECTION ==========
mongoose.set('strictQuery', false);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_management',
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== ROUTES ==========

// Test route
// app.get('/api/test', (req, res) => {
//     res.json({
//         success: true,
//         message: 'EMS API is working!',
//         timestamp: new Date(),
//         endpoints: {
//             auth: {
//                 register: 'POST /api/auth/register',
//                 login: 'POST /api/auth/login',
//                 getMe: 'GET /api/auth/me'
//             },
//             employees: {
//                 getAll: 'GET /api/employees',
//                 create: 'POST /api/employees',
//                 getOne: 'GET /api/employees/:id',
//                 update: 'PUT /api/employees/:id',
//                 delete: 'DELETE /api/employees/:id',
//                 stats: 'GET /api/employees/stats/dashboard',
//                 search: 'GET /api/employees/search/:keyword'
//             }
//         }
//     });
// });

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Employee Management System API',
        version: '1.0.0',
        status: 'running',
        database: 'MongoDB',
        documentation: 'Visit /api/test for endpoints'
    });
});

// Load routes dynamically
try {
    const employeeRoutes = require('./src/routes/employeeRoutes');
    app.use('/api/employees', employeeRoutes);
    console.log('✅ Employee routes loaded');
} catch (error) {
    console.log('⚠️ Employee routes not loaded:', error.message);
}

try {
    const authRoutes = require('./src/routes/authRoutes');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');
} catch (error) {
    console.log('⚠️ Auth routes not loaded:', error.message);
}

// ========== ERROR HANDLING ==========
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
    });
});

// ========== START SERVER ==========
const startServer = async () => {
    try {
        await connectDB();
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`🌐 http://localhost:${PORT}`);
            console.log(`📊 MongoDB: Connected`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();