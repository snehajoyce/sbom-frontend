require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const SBOM = require('../models/SBOM');

// Function to extract metadata from SBOM content
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
      if (filenameParts.length > 3) {
        metadata.binaryType = filenameParts[3] || metadata.binaryType;
      }
    }
  }
  
  return metadata;
}

// Main import function
async function importSBOMs() {
  try {
    // Source directory for SBOM files
    const sourcePath = path.join(__dirname, '../../sbom-frontend/src/SBOM');
    
    // Get list of JSON files
    const files = await fs.readdir(sourcePath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} JSON files to import`);
    
    // List all files to be imported
    console.log("Files to be imported:");
    jsonFiles.forEach(file => console.log(`- ${file}`));
    
    // Connect to MongoDB
    try {
      await connectDB();
      console.log('Connected to MongoDB');
    } catch (dbError) {
      console.error(`Error connecting to MongoDB: ${dbError.message}`);
      console.log('Continuing in preview mode only...');
      return;
    }
    
    let imported = 0;
    let errors = [];
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!await fs.stat(uploadsDir).catch(() => false)) {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    // Process each file
    for (const file of jsonFiles) {
      try {
        console.log(`Processing ${file}...`);
        
        const filePath = path.join(sourcePath, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const sbomData = JSON.parse(fileContent);
        
        // Extract metadata from the SBOM
        const metadata = extractSBOMMetadata(sbomData, file);
        
        // Check if SBOM already exists
        const existingSBOM = await SBOM.findOne({ filename: file });
        
        // Destination path in uploads directory
        const destPath = path.join(uploadsDir, file);
        
        // Copy file to uploads directory
        await fs.copyFile(filePath, destPath);
        
        if (existingSBOM) {
          // Update existing record
          console.log(`Updating existing SBOM: ${file}`);
          existingSBOM.content = sbomData;
          existingSBOM.filePath = destPath;
          await existingSBOM.save();
        } else {
          // Create new record
          console.log(`Creating new SBOM: ${file}`);
          await SBOM.create({
            ...metadata,
            content: sbomData,
            filename: file,
            originalFilename: file,
            filePath: destPath
          });
        }
        
        imported++;
        console.log(`Successfully imported ${file}`);
      } catch (error) {
        console.error(`Error importing ${file}:`, error.message);
        errors.push({ file, error: error.message });
      }
    }
    
    console.log(`\nImport Summary:`);
    console.log(`Total Files: ${jsonFiles.length}`);
    console.log(`Successfully Imported: ${imported}`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => {
        console.log(`- ${err.file}: ${err.error}`);
      });
    }
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the import function
importSBOMs(); 
