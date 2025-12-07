const Employee = require('../models/Employee');
const uploadProfileImage = require('../middleware/upload');

// @desc    Get all employees with search, filter, sort, pagination
// @route   GET /api/employees
// @access  Private
exports.getEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      designation = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by designation
    if (designation) {
      query.designation = designation;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get employees with pagination
    const [employees, total] = await Promise.all([
      Employee.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name email'),
      Employee.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: employees.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private/Admin
exports.createEmployee = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can create employees'
      });
    }

    // Handle file upload
    uploadProfileImage(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      const employeeData = { ...req.body };
      
      // Add profile image if uploaded
      if (req.file) {
        employeeData.profileImage = req.file.filename;
      }

      // Add createdBy field
      employeeData.createdBy = req.user._id;

      const employee = await Employee.create(employeeData);
      
      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employee
      });
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
exports.updateEmployee = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update employees'
      });
    }

    let employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Handle file upload
    uploadProfileImage(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      const updateData = { ...req.body };
      
      // Add profile image if uploaded
      if (req.file) {
        updateData.profileImage = req.file.filename;
      }

      employee = await Employee.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
      
      res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: employee
      });
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
exports.deleteEmployee = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete employees'
      });
    }

    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get designations for filter dropdown
// @route   GET /api/employees/designations
// @access  Private
exports.getDesignations = async (req, res) => {
  try {
    const designations = await Employee.distinct('designation');
    
    res.status(200).json({
      success: true,
      data: designations.filter(Boolean).sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};