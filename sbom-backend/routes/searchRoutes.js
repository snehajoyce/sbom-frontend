const express = require('express');
const router = express.Router();
const {
  searchSBOMs,
  searchComponents,
  compareSBOMs,
  getSuggestions
} = require('../controllers/searchController');

// Search SBOMs
router.get('/search', searchSBOMs);

// Search components within SBOMs
router.post('/search-components', searchComponents);

// Compare two SBOMs
router.post('/compare', compareSBOMs);

// Get autocomplete suggestions
router.get('/suggestions', getSuggestions);

module.exports = router; 