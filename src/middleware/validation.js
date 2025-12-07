const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const { UNPROCESSABLE_ENTITY } = require('../constants/httpStatusCodes');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    return next(new ApiError(UNPROCESSABLE_ENTITY, 'Validation failed', true, {
      errors: extractedErrors
    }));
  };
};

// Dynamic validation based on config
const dynamicValidation = async (req, res, next) => {
  try {
    const Config = require('../models/Config');
    
    // Get validation rules from config
    const validationRules = await Config.getValue('validation_rules', {});
    
    // Apply dynamic validation based on route
    const route = req.path;
    const method = req.method;
    
    if (validationRules[route] && validationRules[route][method]) {
      const rules = validationRules[route][method];
      // Apply rules dynamically
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validate,
  dynamicValidation
};