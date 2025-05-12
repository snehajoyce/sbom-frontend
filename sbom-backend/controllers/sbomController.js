const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const SBOM = require('../models/SBOM');
const path = require('path');
const fs = require('fs').promises;

/**
 * @desc    Get all SBOMs metadata
 * @route   GET /api/sboms/metadata
 * @access  Public
 */
exports.getSBOMsMetadata = asyncHandler(async (req, res, next) => {
  // Get all SBOMs but exclude the large content field
  const sboms = await SBOM.find().select('-content');
  
  res.status(200).json({
    success: true,
    count: sboms.length,
    data: sboms
  });
});

/**
 * @desc    Get all SBOMs (full data)
 * @route   GET /api/sboms
 * @access  Public
 */
exports.getSBOMs = asyncHandler(async (req, res, next) => {
  // Get all SBOMs with full content
  const sboms = await SBOM.find();
  
  res.status(200).json({
    success: true,
    count: sboms.length,
    data: sboms
  });
});

/**
 * @desc    Get single SBOM by ID
 * @route   GET /api/sbom/:id
 * @access  Public
 */
exports.getSBOM = asyncHandler(async (req, res, next) => {
  const sbom = await SBOM.findById(req.params.id);
  
  if (!sbom) {
    return next(new ErrorResponse(`SBOM not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: sbom
  });
});

/**
 * @desc    Get SBOM by filename
 * @route   GET /api/sbom-file/:filename
 * @access  Public
 */
exports.getSBOMByFilename = asyncHandler(async (req, res, next) => {
  const sbom = await SBOM.findOne({
    filename: req.params.filename
  });
  
  if (!sbom) {
    return next(new ErrorResponse(`SBOM not found with filename ${req.params.filename}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: sbom
  });
});

/**
 * @desc    Import SBOMs from directory
 * @route   POST /api/sboms/import
 * @access  Admin
 */
exports.importSBOMs = asyncHandler(async (req, res, next) => {
  const { sourcePath } = req.body;
  
  if (!sourcePath) {
    return next(new ErrorResponse('Please provide a source directory path', 400));
  }
  
  // Get list of JSON files
  const files = await fs.readdir(sourcePath);
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  let imported = 0;
  let errors = [];
  
  // Process each file
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(sourcePath, file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const sbomData = JSON.parse(fileContent);
      
      // Extract metadata from the SBOM
      const metadata = extractSBOMMetadata(sbomData, file);
      
      // Check if SBOM already exists
      const existingSBOM = await SBOM.findOne({ filename: file });
      
      if (existingSBOM) {
        // Update existing record
        existingSBOM.content = sbomData;
        await existingSBOM.save();
      } else {
        // Create new record
        await SBOM.create({
          ...metadata,
          content: sbomData,
          filename: file,
          originalFilename: file,
          filePath: filePath
        });
      }
      
      imported++;
    } catch (error) {
      console.error(`Error importing ${file}:`, error);
      errors.push({ file, error: error.message });
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      total: jsonFiles.length,
      imported,
      errors
    }
  });
});

/**
 * @desc    Delete SBOM
 * @route   DELETE /api/sbom/:id
 * @access  Admin
 */
exports.deleteSBOM = asyncHandler(async (req, res, next) => {
  const sbom = await SBOM.findById(req.params.id);
  
  if (!sbom) {
    return next(new ErrorResponse(`SBOM not found with id of ${req.params.id}`, 404));
  }
  
  await sbom.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * Helper function to extract metadata from SBOM content
 */
function extractSBOMMetadata(sbomData, filename) {
  let metadata = {
    bomFormat: sbomData.bomFormat || 'Unknown',
    specVersion: sbomData.specVersion || '1.0',
    serialNumber: sbomData.serialNumber || null,
    appName: 'Unknown',
    appVersion: 'Unknown',
    supplier: 'Unknown',
    operatingSystem: 'unknown',
    binaryType: 'unknown',
    category: '',
    tags: []
  };
  
  // Extract metadata from the SBOM component section
  if (sbomData.metadata && sbomData.metadata.component) {
    const component = sbomData.metadata.component;
    
    metadata.appName = component.name || 'Unknown';
    metadata.appVersion = component.version || 'Unknown';
    
    if (component.supplier && component.supplier.name) {
      metadata.supplier = component.supplier.name;
    }
    
    // Extract OS and binary type from properties
    if (component.properties && Array.isArray(component.properties)) {
      component.properties.forEach(prop => {
        if (prop.name === 'os' && prop.value) {
          metadata.operatingSystem = prop.value.toLowerCase();
        }
        if (prop.name === 'type' && prop.value) {
          metadata.binaryType = prop.value.toLowerCase();
        }
        if (prop.name === 'category' && prop.value) {
          metadata.category = prop.value;
        }
        if (prop.name === 'tags' && prop.value) {
          try {
            if (typeof prop.value === 'string') {
              metadata.tags = prop.value.split(',').map(tag => tag.trim());
            } else if (Array.isArray(prop.value)) {
              metadata.tags = prop.value;
            }
          } catch (e) {
            console.error('Error parsing tags:', e);
          }
        }
      });
    }
  }
  
  // Try to extract from filename if metadata is not available
  if (metadata.appName === 'Unknown' || metadata.supplier === 'Unknown') {
    const filenameParts = filename.replace('.json', '').split('-');
    if (filenameParts.length >= 3) {
      // Format: supplier-appname-os-type.json (e.g., microsoft-office-windows-desktop.json)
      metadata.supplier = filenameParts[0] || metadata.supplier;
      metadata.appName = filenameParts[1] || metadata.appName;
      metadata.operatingSystem = filenameParts[2] || metadata.operatingSystem;
      metadata.binaryType = filenameParts[3] || metadata.binaryType;
    }
  }
  
  return metadata;
} 