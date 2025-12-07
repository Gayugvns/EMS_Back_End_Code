const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { auth, restrictTo } = require('../middleware/auth');

// Public route
router.get('/public', configController.getPublicConfigs);

// Protected routes
router.use(auth);

// Admin only routes
router.use(restrictTo('admin'));
router.get('/', configController.getAllConfigs);
router.get('/category/:category', configController.getConfigsByCategory);
router.get('/:key', configController.getConfigByKey);
router.post('/', configController.createOrUpdateConfig);
router.delete('/:key', configController.deleteConfig);
router.post('/initialize', configController.initializeDefaults);

module.exports = router;