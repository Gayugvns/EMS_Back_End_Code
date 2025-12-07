const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Config = require('../models/Config');
const { validate } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules
const configValidation = [
  body('key')
    .trim()
    .notEmpty().withMessage('Key is required')
    .matches(/^[a-z0-9_]+$/).withMessage('Key can only contain lowercase letters, numbers and underscores')
    .isLength({ max: 50 }).withMessage('Key cannot exceed 50 characters'),
  
  body('value')
    .notEmpty().withMessage('Value is required'),
  
  body('type')
    .optional()
    .isIn(['string', 'number', 'boolean', 'array', 'object', 'date'])
    .withMessage('Invalid type'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  
  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic must be boolean'),
  
  body('isEditable')
    .optional()
    .isBoolean().withMessage('isEditable must be boolean')
];

// @desc    Get all configs (Admin only)
// @route   GET /api/config
// @access  Private/Admin
const getAllConfigs = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admin can view all configurations');
  }

  const configs = await Config.find({})
    .populate('updatedBy', 'name email')
    .sort({ category: 1, key: 1 });
  
  res.status(200).json(
    new ApiResponse(200, configs, 'Configurations retrieved successfully')
  );
});

// @desc    Get public configs
// @route   GET /api/config/public
// @access  Public
const getPublicConfigs = asyncHandler(async (req, res) => {
  const configs = await Config.getAllPublicConfigs();
  
  res.status(200).json(
    new ApiResponse(200, configs, 'Public configurations retrieved successfully')
  );
});

// @desc    Get config by key
// @route   GET /api/config/:key
// @access  Private
const getConfigByKey = asyncHandler(async (req, res) => {
  const config = await Config.findOne({ key: req.params.key });
  
  if (!config) {
    throw new ApiError(404, 'Configuration not found');
  }

  // Check if user can view
  if (!config.isPublic && req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied to this configuration');
  }
  
  res.status(200).json(
    new ApiResponse(200, config, 'Configuration retrieved successfully')
  );
});

// @desc    Create or update config
// @route   POST /api/config
// @access  Private/Admin
const createOrUpdateConfig = [
  validate(configValidation),
  asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Only admin can manage configurations');
    }

    const { key, value, type = 'string', category, description, isPublic, isEditable } = req.body;
    
    const config = await Config.setValue(
      key,
      value,
      type,
      {
        category: category || 'general',
        description: description || '',
        isPublic: isPublic || false,
        isEditable: isEditable !== false,
        userId: req.user.id
      }
    );
    
    res.status(200).json(
      new ApiResponse(200, config, 'Configuration saved successfully')
    );
  })
];

// @desc    Delete config
// @route   DELETE /api/config/:key
// @access  Private/Admin
const deleteConfig = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admin can delete configurations');
  }

  const config = await Config.findOneAndDelete({ key: req.params.key });
  
  if (!config) {
    throw new ApiError(404, 'Configuration not found');
  }
  
  res.status(200).json(
    new ApiResponse(200, null, 'Configuration deleted successfully')
  );
});

// @desc    Get configs by category
// @route   GET /api/config/category/:category
// @access  Private
const getConfigsByCategory = asyncHandler(async (req, res) => {
  const configs = await Config.getConfigByCategory(req.params.category);
  
  res.status(200).json(
    new ApiResponse(200, configs, 'Configurations retrieved successfully')
  );
});

// @desc    Initialize default configurations
// @route   POST /api/config/initialize
// @access  Private/Admin
const initializeDefaults = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admin can initialize configurations');
  }

  await Config.initializeDefaults(req.user.id);
  
  res.status(200).json(
    new ApiResponse(200, null, 'Default configurations initialized successfully')
  );
});

module.exports = {
  getAllConfigs,
  getPublicConfigs,
  getConfigByKey,
  createOrUpdateConfig,
  deleteConfig,
  getConfigsByCategory,
  initializeDefaults
};