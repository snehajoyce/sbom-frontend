const express = require('express');
const router = express.Router();
const {
  getStatistics,
  getPlatformStatistics
} = require('../controllers/statsController');

// Get general SBOM statistics
router.get('/statistics', getStatistics);

// Get platform-specific statistics
router.get('/platform-stats', getPlatformStatistics);

module.exports = router; 