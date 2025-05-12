const express = require('express');
const router = express.Router();
const {
  getSBOMs,
  getSBOMsMetadata,
  getSBOM,
  getSBOMByFilename,
  importSBOMs,
  deleteSBOM
} = require('../controllers/sbomController');
const SBOM = require('../models/SBOM');

// Get all SBOMs metadata
router.get('/sboms/metadata', getSBOMsMetadata);

// Get all SBOMs with full content
router.get('/sboms', getSBOMs);

// Get SBOM by ID
router.get('/sbom/:id', getSBOM);

// Get SBOM by filename - adding an async handler directly in case of import issues
router.get('/sbom-file/:filename', async (req, res, next) => {
  try {
    const sbom = await SBOM.findOne({
      filename: req.params.filename
    });
    
    if (!sbom) {
      return res.status(404).json({
        success: false,
        error: `SBOM not found with filename ${req.params.filename}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: sbom
    });
  } catch (error) {
    console.error('Error fetching SBOM by filename:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Import SBOMs from directory
router.post('/sboms/import', importSBOMs);

// Delete SBOM
router.delete('/sbom/:id', deleteSBOM);

// Add a debug endpoint to get all SBOMs with their basic fields
router.get('/sboms-debug', async (req, res) => {
  try {
    const sboms = await SBOM.find({}).select('filename appName appVersion supplier operatingSystem binaryType componentCount licenseCount');
    res.status(200).json({
      success: true,
      count: sboms.length,
      data: sboms
    });
  } catch (error) {
    console.error('Error fetching SBOM debug info:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 