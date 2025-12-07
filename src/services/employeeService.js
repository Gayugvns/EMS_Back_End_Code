// services/employeeService.js
const Employee = require("../models/Employee");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Create new employee
// @return  Employee object
const createEmployee = asyncHandler(async (employeeData) => {
  // Check if employee with email already exists
  const existingEmployee = await Employee.findOne({
    email: employeeData.email,
  });
  if (existingEmployee) {
    throw new ApiError(400, "Employee with this email already exists");
  }

  // Create employee
  const employee = await Employee.create(employeeData);

  return employee;
});

// @desc    Get all employees
// @return  { employees, total, page, pages }
const getAllEmployees = asyncHandler(async (filters = {}, pagination = {}) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};

  // Search by name or email
  if (filters.search) {
    filter.$or = [
      { firstName: { $regex: filters.search, $options: "i" } },
      { lastName: { $regex: filters.search, $options: "i" } },
      { email: { $regex: filters.search, $options: "i" } },
    ];
  }

  // Filter by department
  if (filters.department) {
    filter.department = filters.department;
  }

  // Filter by position
  if (filters.position) {
    filter.position = filters.position;
  }

  // Filter by status
  if (filters.status) {
    filter.status = filters.status;
  }

  // Sort options
  let sort = {};
  if (pagination.sortBy) {
    const sortOrder = pagination.sortOrder === "desc" ? -1 : 1;
    sort[pagination.sortBy] = sortOrder;
  } else {
    sort = { createdAt: -1 }; // Default sort by latest
  }

  // Execute queries
  const [employees, total] = await Promise.all([
    Employee.find(filter).select("-__v").skip(skip).limit(limit).sort(sort),
    Employee.countDocuments(filter),
  ]);

  const pages = Math.ceil(total / limit);

  return {
    employees,
    pagination: {
      total,
      page,
      pages,
      limit,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
});

// @desc    Get single employee by ID
// @return  Employee object
const getEmployeeById = asyncHandler(async (id) => {
  const employee = await Employee.findById(id);

  if (!employee) {
    throw new ApiError(404, `Employee not found with id ${id}`);
  }

  return employee;
});

// @desc    Update employee
// @return  Updated employee object
const updateEmployee = asyncHandler(async (id, updateData) => {
  // Check if email is being updated and if it's already taken
  if (updateData.email) {
    const existingEmployee = await Employee.findOne({
      email: updateData.email,
      _id: { $ne: id }, // Exclude current employee
    });

    if (existingEmployee) {
      throw new ApiError(400, "Employee with this email already exists");
    }
  }

  const employee = await Employee.findByIdAndUpdate(id, updateData, {
    new: true, // Return updated document
    runValidators: true, // Run model validators
  });

  if (!employee) {
    throw new ApiError(404, `Employee not found with id ${id}`);
  }

  return employee;
});

// @desc    Delete employee
// @return  { success: true }
const deleteEmployee = asyncHandler(async (id) => {
  const employee = await Employee.findByIdAndDelete(id);

  if (!employee) {
    throw new ApiError(404, `Employee not found with id ${id}`);
  }

  return { success: true, message: "Employee deleted successfully" };
});

// @desc    Get employee statistics
// @return  Statistics object
const getEmployeeStats = asyncHandler(async () => {
  const stats = await Employee.aggregate([
    {
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        totalSalary: { $sum: "$salary" },
        avgSalary: { $avg: "$salary" },
      },
    },
    {
      $project: {
        _id: 0,
        totalEmployees: 1,
        totalSalary: 1,
        avgSalary: { $round: ["$avgSalary", 2] },
      },
    },
  ]);

  // Department wise count
  const departmentStats = await Employee.aggregate([
    {
      $group: {
        _id: "$department",
        count: { $sum: 1 },
        avgSalary: { $avg: "$salary" },
      },
    },
    {
      $project: {
        department: "$_id",
        count: 1,
        avgSalary: { $round: ["$avgSalary", 2] },
        _id: 0,
      },
    },
    { $sort: { count: -1 } },
  ]);

  return {
    ...(stats[0] || { totalEmployees: 0, totalSalary: 0, avgSalary: 0 }),
    byDepartment: departmentStats,
    lastUpdated: new Date(),
  };
});

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
};
