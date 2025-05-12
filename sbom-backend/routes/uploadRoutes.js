const express = require('express');
const router = express.Router();
const {
  upload,
  uploadSBOM,
  generateSBOM
} = require('../controllers/uploadController');

// Upload SBOM file
router.post('/upload', upload, uploadSBOM);

// Generate SBOM from binary
router.post('/generate-sbom', upload, generateSBOM);

module.exports = router; 