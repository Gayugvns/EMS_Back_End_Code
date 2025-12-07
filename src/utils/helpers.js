const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

class Helpers {
  // Generate JWT token
  static generateToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  // Generate hash
  static async generateHash(data, saltRounds = 10) {
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(data, salt);
  }

  // Compare hash
  static async compareHash(data, hash) {
    return await bcrypt.compare(data, hash);
  }

  // Generate random string
  static generateRandomString(length = 10) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  // Format phone number
  static formatPhoneNumber(phone) {
    return phone.replace(/\D/g, '');
  }

  // Validate email
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Create directory if not exists
  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Remove file
  static removeFile(filePath) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Generate slug
  static generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Pagination helper
  static paginate(query, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
  }

  // Sort helper
  static sort(query, sortBy = 'createdAt', sortOrder = 'desc') {
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    return query.sort(sort);
  }

  // Filter helper
  static filter(query, filters = {}) {
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        if (typeof filters[key] === 'string') {
          query[key] = { $regex: filters[key], $options: 'i' };
        } else {
          query[key] = filters[key];
        }
      }
    });
    return query;
  }

  // Generate employee ID
  static async generateEmployeeId(prefix = 'EMP') {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomNum}`;
  }

  // Format currency
  static formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Calculate age from date
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Validate object against schema
  static validateAgainstSchema(obj, schema) {
    const errors = [];
    
    Object.keys(schema).forEach(key => {
      const fieldSchema = schema[key];
      
      if (fieldSchema.required && !obj[key]) {
        errors.push(`${key} is required`);
      }
      
      if (obj[key] && fieldSchema.type) {
        if (fieldSchema.type === 'number' && isNaN(Number(obj[key]))) {
          errors.push(`${key} must be a number`);
        }
        
        if (fieldSchema.type === 'email' && !this.isValidEmail(obj[key])) {
          errors.push(`${key} must be a valid email`);
        }
        
        if (fieldSchema.minLength && obj[key].length < fieldSchema.minLength) {
          errors.push(`${key} must be at least ${fieldSchema.minLength} characters`);
        }
        
        if (fieldSchema.maxLength && obj[key].length > fieldSchema.maxLength) {
          errors.push(`${key} cannot exceed ${fieldSchema.maxLength} characters`);
        }
      }
    });
    
    return errors;
  }
}

module.exports = Helpers;