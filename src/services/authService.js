// services/authService.js
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register user
// @return  { user, token }
const registerUser = asyncHandler(async (userData) => {
  const { name, email, password, role } = userData;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, "User already exists with this email");
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || "user",
  });

  // Generate token
  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
});

// @desc    Login user
// @return  { user, token }
const loginUser = asyncHandler(async (email, password) => {
  // Validate input
  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Check if password matches
  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate token
  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
});

// @desc    Get current user
// @return  { user }
const getCurrentUser = asyncHandler(async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
});

// @desc    Update user details
// @return  { user }
const updateUserDetails = asyncHandler(async (userId, updateData) => {
  const allowedUpdates = ["name", "email"];
  const updates = {};

  // Filter allowed updates
  Object.keys(updateData).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      updates[key] = updateData[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  // Update user
  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
});

// @desc    Update password
// @return  { success: true }
const updatePassword = asyncHandler(
  async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(401, "Current password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { success: true };
  }
);

// @desc    Get all users (admin only)
// @return  { users, total, page, pages }
const getAllUsers = asyncHandler(async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  // Execute queries
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-__v")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  const pages = Math.ceil(total / limit);

  return {
    users,
    total,
    page,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
});

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserDetails,
  updatePassword,
  getAllUsers,
};
