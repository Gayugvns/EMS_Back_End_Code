// routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// ========== BASIC CRUD ROUTES ==========

// GET /api/employees - Get all ACTIVE employees (excludes soft-deleted)
router.get('/', async (req, res) => {
    try {
        // Filter: only show active employees by default
        let query = { status: { $ne: 'deleted' } };
        
        // If admin wants to see all including deleted
        if (req.query.showDeleted === 'true') {
            query = {};
        }
        
        // If only want deleted employees
        if (req.query.status === 'deleted') {
            query = { status: 'deleted' };
        }
        
        const employees = await Employee.find(query).sort({ createdAt: -1 });
        res.json({ 
            success: true, 
            count: employees.length,
            showActiveOnly: req.query.showDeleted !== 'true',
            data: employees 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/employees/:id - Get single employee (even if deleted)
router.get('/:id', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
        res.json({ success: true, data: employee });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/employees - Create employee
router.post('/', async (req, res) => {
    try {
        // Ensure new employees are active
        const employeeData = {
            ...req.body,
            status: 'active' // Force active status for new employees
        };
        
        const employee = await Employee.create(employeeData);
        res.status(201).json({ 
            success: true, 
            message: 'Employee created successfully',
            data: employee 
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email already exists' 
            });
        }
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// PUT /api/employees/:id - Update employee (ALL FIELDS)
router.put('/:id', async (req, res) => {
    try {
        // Check if email is being changed and if new email already exists
        if (req.body.email) {
            const existingEmployee = await Employee.findOne({
                email: req.body.email,
                _id: { $ne: req.params.id },
                status: { $ne: 'deleted' } // Don't check against deleted employees
            });
            
            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    error: 'Another active employee already has this email'
                });
            }
        }
        
        // Prepare update data
        const updateData = { ...req.body };
        
        // Handle address update
        if (req.body.address) {
            const currentEmployee = await Employee.findById(req.params.id);
            if (currentEmployee && currentEmployee.address) {
                updateData.address = {
                    ...currentEmployee.address.toObject(),
                    ...req.body.address
                };
            }
        }
        
        // Update employee
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            updateData,
            { 
                new: true,
                runValidators: true
            }
        );
        
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                error: 'Employee not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Employee updated successfully',
            data: employee 
        });
        
    } catch (error) {
        console.error('Update error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email already exists' 
            });
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                error: messages.join(', ') 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// DELETE /api/employees/:id - SOFT DELETE (mark as deleted)
router.delete('/:id', async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'deleted',
                deletedAt: new Date()
            },
            { new: true }
        );
        
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                error: 'Employee not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Employee soft deleted (marked as deleted)',
            data: {
                id: employee._id,
                name: `${employee.firstName} ${employee.lastName}`,
                email: employee.email,
                status: employee.status,
                deletedAt: employee.deletedAt
            }
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// PATCH /api/employees/:id/restore - RESTORE soft-deleted employee
router.patch('/:id/restore', async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'active',
                deletedAt: null
            },
            { new: true }
        );
        
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                error: 'Employee not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Employee restored successfully',
            data: employee 
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// DELETE /api/employees/:id/permanent - HARD DELETE (permanent removal)
router.delete('/:id/permanent', async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                error: 'Employee not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Employee permanently deleted from database',
            data: {
                id: employee._id,
                name: `${employee.firstName} ${employee.lastName}`,
                email: employee.email
            }
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

module.exports = router;