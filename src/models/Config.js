const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object', 'date'],
    required: true,
    default: 'string'
  },
  category: {
    type: String,
    trim: true,
    index: true,
    default: 'general'
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validTo: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if config is active
configSchema.virtual('isActive').get(function() {
  const now = new Date();
  return (!this.validFrom || this.validFrom <= now) && 
         (!this.validTo || this.validTo >= now);
});

// Static Methods
configSchema.statics.getValue = async function(key, defaultValue = null) {
  const config = await this.findOne({ 
    key, 
    $or: [
      { validTo: { $exists: false } },
      { validTo: { $gte: new Date() } }
    ]
  });
  
  if (!config) return defaultValue;
  
  // Convert value based on type
  switch (config.type) {
    case 'number':
      return Number(config.value);
    case 'boolean':
      return config.value === 'true' || config.value === true;
    case 'array':
      return Array.isArray(config.value) ? config.value : JSON.parse(config.value || '[]');
    case 'object':
      return typeof config.value === 'object' ? config.value : JSON.parse(config.value || '{}');
    default:
      return config.value;
  }
};

configSchema.statics.setValue = async function(key, value, type = 'string', options = {}) {
  const { category = 'general', description = '', isPublic = false, userId = null } = options;
  
  const config = await this.findOneAndUpdate(
    { key },
    {
      value,
      type,
      category,
      description,
      isPublic,
      updatedBy: userId,
      validFrom: new Date()
    },
    { 
      upsert: true, 
      new: true,
      runValidators: true 
    }
  );
  
  return config;
};

configSchema.statics.getConfigByCategory = async function(category) {
  const configs = await this.find({ 
    category,
    $or: [
      { validTo: { $exists: false } },
      { validTo: { $gte: new Date() } }
    ]
  });
  
  const result = {};
  configs.forEach(config => {
    result[config.key] = config.value;
  });
  
  return result;
};

configSchema.statics.getAllPublicConfigs = async function() {
  return await this.find({ 
    isPublic: true,
    $or: [
      { validTo: { $exists: false } },
      { validTo: { $gte: new Date() } }
    ]
  }).select('key value type category description');
};

configSchema.statics.incrementSequence = async function(key) {
  const sequenceKey = `sequence_${key}`;
  const result = await this.findOneAndUpdate(
    { key: sequenceKey },
    { $inc: { value: 1 } },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true 
    }
  );
  
  return result.value || 1;
};

// Initialize default configurations
configSchema.statics.initializeDefaults = async function(userId) {
  const defaults = [
    // Application Config
    { key: 'app_name', value: 'Employee Management System', type: 'string', category: 'app', isPublic: true },
    { key: 'company_name', value: 'Dynamic Tech Solutions', type: 'string', category: 'app', isPublic: true },
    
    // Employee Config
    { key: 'employee_id_prefix', value: 'EMP', type: 'string', category: 'employee' },
    { key: 'default_currency', value: 'USD', type: 'string', category: 'employee', isPublic: true },
    { key: 'max_file_size_mb', value: 5, type: 'number', category: 'employee', isPublic: true },
    
    // Roles and Permissions (Dynamic from DB)
    { key: 'available_roles', value: ['admin', 'manager', 'employee', 'hr'], type: 'array', category: 'security' },
    { key: 'role_admin_permissions', value: ['create', 'read', 'update', 'delete', 'manage_users'], type: 'array', category: 'security' },
    { key: 'role_employee_permissions', value: ['read'], type: 'array', category: 'security' },
    
    // Designations (Will be populated dynamically)
    { key: 'available_designations', value: [], type: 'array', category: 'employee', isPublic: true },
    { key: 'available_departments', value: [], type: 'array', category: 'employee', isPublic: true },
    
    // Pagination
    { key: 'default_page_size', value: 10, type: 'number', category: 'app', isPublic: true },
    { key: 'max_page_size', value: 100, type: 'number', category: 'app' },
    
    // Sequences
    { key: 'sequence_employee_sequence', value: 1000, type: 'number', category: 'system' }
  ];

  for (const config of defaults) {
    await this.setValue(
      config.key,
      config.value,
      config.type,
      {
        category: config.category,
        isPublic: config.isPublic || false,
        userId: userId
      }
    );
  }
  
};

// Indexes for performance
configSchema.index({ key: 1, category: 1 });
configSchema.index({ category: 1, isPublic: 1 });
configSchema.index({ validFrom: 1, validTo: 1 });
configSchema.index({ updatedBy: 1, updatedAt: -1 });

module.exports = mongoose.model('Config', configSchema);