const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const SBOM = require('../models/SBOM');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueId = uuidv4().substring(0, 8);
    const fileExt = path.extname(file.originalname);
    const newFilename = `${uniqueId}-${Date.now()}${fileExt}`;
    cb(null, newFilename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only JSON files
  if (file.mimetype === 'application/json') {
    cb(null, true);
  } else {
    cb(new ErrorResponse('Only JSON files are allowed', 400), false);
  }
};

// Initialize multer
exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: fileFilter
}).single('file');

/**
 * @desc    Upload SBOM File
 * @route   POST /api/upload
 * @access  Public
 */
exports.uploadSBOM = asyncHandler(async (req, res, next) => {
  // File is already uploaded and available in req.file
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }
  
  // Extract SBOM metadata from the request body
  const {
    appName,
    appVersion,
    supplier,
    operatingSystem,
    binaryType,
    category,
    description,
    tags
  } = req.body;
  
  // Read uploaded file
  const fileContent = await fs.readFile(req.file.path, 'utf8');
  
  // Parse JSON content
  let sbomData;
  try {
    sbomData = JSON.parse(fileContent);
  } catch (error) {
    await fs.unlink(req.file.path); // Delete invalid file
    return next(new ErrorResponse('Invalid JSON file', 400));
  }
  
  // Validate minimum SBOM structure
  if (!sbomData.bomFormat || !sbomData.specVersion) {
    await fs.unlink(req.file.path); // Delete invalid file
    return next(new ErrorResponse('Invalid SBOM format', 400));
  }
  
  // Check if SBOM format is supported
  if (sbomData.bomFormat !== 'CycloneDX') {
    await fs.unlink(req.file.path); // Delete unsupported file
    return next(new ErrorResponse('Only CycloneDX format is supported', 400));
  }
  
  // Generate unique filename for storage
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `${supplier}-${appName}-${operatingSystem}-${binaryType}-${uniqueSuffix}.json`;
  
  // Create clean file path for storage
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Move/rename the file
  await fs.rename(req.file.path, filePath);
  
  // Update metadata in the SBOM content
  if (!sbomData.metadata) {
    sbomData.metadata = {};
  }
  
  if (!sbomData.metadata.component) {
    sbomData.metadata.component = {};
  }
  
  sbomData.metadata.component.name = appName;
  sbomData.metadata.component.version = appVersion;
  
  if (!sbomData.metadata.component.supplier) {
    sbomData.metadata.component.supplier = {};
  }
  sbomData.metadata.component.supplier.name = supplier;
  
  // Update component properties
  if (!sbomData.metadata.component.properties) {
    sbomData.metadata.component.properties = [];
  }
  
  // Add or update OS property
  const osPropertyIndex = sbomData.metadata.component.properties.findIndex(
    prop => prop.name === 'os'
  );
  
  if (osPropertyIndex >= 0) {
    sbomData.metadata.component.properties[osPropertyIndex].value = operatingSystem;
  } else {
    sbomData.metadata.component.properties.push({
      name: 'os',
      value: operatingSystem
    });
  }
  
  // Add or update binary type property
  const typePropertyIndex = sbomData.metadata.component.properties.findIndex(
    prop => prop.name === 'type'
  );
  
  if (typePropertyIndex >= 0) {
    sbomData.metadata.component.properties[typePropertyIndex].value = binaryType;
  } else {
    sbomData.metadata.component.properties.push({
      name: 'type',
      value: binaryType
    });
  }
  
  // Add or update category property
  if (category) {
    const categoryPropertyIndex = sbomData.metadata.component.properties.findIndex(
      prop => prop.name === 'category'
    );
    
    if (categoryPropertyIndex >= 0) {
      sbomData.metadata.component.properties[categoryPropertyIndex].value = category;
    } else {
      sbomData.metadata.component.properties.push({
        name: 'category',
        value: category
      });
    }
  }
  
  // Save updated JSON back to file
  await fs.writeFile(filePath, JSON.stringify(sbomData, null, 2));
  
  // Process tags
  const tagArray = tags ? 
    (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : 
    [];
  
  // Create SBOM record
  const sbom = await SBOM.create({
    filename,
    originalFilename: req.file.originalname,
    filePath,
    bomFormat: sbomData.bomFormat,
    specVersion: sbomData.specVersion,
    serialNumber: sbomData.serialNumber || null,
    appName,
    appVersion,
    supplier,
    operatingSystem,
    binaryType,
    category: category || '',
    description: description || '',
    tags: tagArray,
    content: sbomData,
  });
  
  res.status(201).json({
    success: true,
    data: sbom
  });
});

/**
 * @desc    Generate SBOM from binary
 * @route   POST /api/generate-sbom
 * @access  Public
 */
exports.generateSBOM = asyncHandler(async (req, res, next) => {
  // Setup mock SBOM generation since this would typically be a complex process
  // with binary analysis tools like Syft, CycloneDX tools, etc.
  
  if (!req.file) {
    return next(new ErrorResponse('Please upload a binary file', 400));
  }
  
  // Extract metadata from the request body
  const {
    appName,
    appVersion,
    supplier,
    operatingSystem,
    binaryType,
    category
  } = req.body;
  
  if (!appName || !appVersion || !supplier || !operatingSystem || !binaryType) {
    await fs.unlink(req.file.path); // Delete uploaded file
    return next(new ErrorResponse('All metadata fields are required', 400));
  }
  
  // Generate a skeleton SBOM
  const generatedSBOM = {
    bomFormat: "CycloneDX",
    specVersion: "1.4",
    version: 1,
    serialNumber: `urn:uuid:${uuidv4()}`,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: "SBOM Finder",
          name: "SBOM Generator",
          version: "1.0.0"
        }
      ],
      component: {
        type: "application",
        "bom-ref": `pkg:${supplier.toLowerCase()}/${appName.toLowerCase()}@${appVersion}`,
        name: appName,
        version: appVersion,
        supplier: {
          name: supplier
        },
        properties: [
          {
            name: "os",
            value: operatingSystem
          },
          {
            name: "type",
            value: binaryType
          }
        ]
      }
    },
    components: [
      // This is a mockup - in a real implementation, these components would be 
      // detected by analyzing the binary file
      {
        type: "library",
        "bom-ref": `pkg:generic/${appName}-core@1.0.0`,
        name: `${appName}-core`,
        version: "1.0.0",
        purl: `pkg:generic/${appName}-core@1.0.0`,
        licenses: [
          {
            license: {
              id: "MIT"
            }
          }
        ]
      },
      {
        type: "framework",
        "bom-ref": `pkg:generic/${supplier}-framework@2.0.0`,
        name: `${supplier}-framework`,
        version: "2.0.0",
        purl: `pkg:generic/${supplier}-framework@2.0.0`,
        licenses: [
          {
            license: {
              id: "Apache-2.0"
            }
          }
        ]
      }
    ]
  };
  
  // Add category if provided
  if (category) {
    generatedSBOM.metadata.component.properties.push({
      name: "category",
      value: category
    });
  }
  
  // Generate unique filename for storage
  const filename = `${supplier}-${appName}-${operatingSystem}-${binaryType}-generated.json`;
  
  // Create file path for storage
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Write generated SBOM to file
  await fs.writeFile(filePath, JSON.stringify(generatedSBOM, null, 2));
  
  // Create SBOM record
  const sbom = await SBOM.create({
    filename,
    originalFilename: req.file.originalname,
    filePath,
    bomFormat: generatedSBOM.bomFormat,
    specVersion: generatedSBOM.specVersion,
    serialNumber: generatedSBOM.serialNumber,
    appName,
    appVersion,
    supplier,
    operatingSystem,
    binaryType,
    category: category || '',
    description: `Generated SBOM for ${appName}`,
    tags: ['generated', appName.toLowerCase(), supplier.toLowerCase()],
    content: generatedSBOM,
  });
  
  // Delete the uploaded binary file
  await fs.unlink(req.file.path);
  
  res.status(201).json({
    success: true,
    data: sbom
  });
}); 