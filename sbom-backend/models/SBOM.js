const mongoose = require('mongoose');

// Schema for SBOM metadata
const SBOMSchema = new mongoose.Schema(
  {
    // Basic file information
    filename: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    
    // SBOM Document Properties
    bomFormat: {
      type: String,
      required: true,
      default: 'CycloneDX',
    },
    specVersion: {
      type: String,
      required: true,
    },
    serialNumber: {
      type: String,
    },
    
    // Application metadata
    appName: {
      type: String,
      required: true,
      index: true,
    },
    appVersion: {
      type: String,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
      index: true,
    },
    
    // Operating system and application type
    operatingSystem: {
      type: String, 
      required: true,
      enum: ['ios', 'android', 'macos', 'windows', 'linux'],
      index: true,
    },
    binaryType: {
      type: String,
      required: true,
      enum: ['mobile', 'desktop', 'web', 'server', 'iot', 'other'],
      index: true,
    },
    
    // Component statistics
    componentCount: {
      type: Number,
      required: true,
      default: 0,
    },
    componentTypes: {
      type: Map,
      of: Number,
      default: {},
    },
    
    // License statistics
    licenseCount: {
      type: Number,
      default: 0,
    },
    licenses: [String],
    
    // Additional metadata
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      index: true,
    },
    tags: [String],
    
    // Full content stored as JSON
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text search indexes
SBOMSchema.index({ appName: 'text', supplier: 'text', description: 'text', tags: 'text' });

// Create a filename-based slug for URL-friendly identifiers
SBOMSchema.virtual('slug').get(function() {
  return this.filename.replace(/\.json$/, '');
});

// Virtual field for combined search
SBOMSchema.virtual('fullSearchText').get(function() {
  return `${this.appName} ${this.supplier} ${this.operatingSystem} ${this.binaryType} ${this.category || ''} ${this.tags.join(' ')}`;
});

// Middleware to extract metadata from SBOM content
SBOMSchema.pre('save', function(next) {
  // Only run this if content is present and componentCount needs updating
  if (this.content && (!this.componentCount || this.isModified('content'))) {
    try {
      // Extract component count
      if (this.content.components && Array.isArray(this.content.components)) {
        this.componentCount = this.content.components.length;
        
        // Count component types
        const typeCount = {};
        this.content.components.forEach(component => {
          if (component.type) {
            typeCount[component.type] = (typeCount[component.type] || 0) + 1;
          }
        });
        this.componentTypes = typeCount;
        
        // Extract licenses
        const licenses = new Set();
        this.content.components.forEach(component => {
          if (component.licenses && Array.isArray(component.licenses)) {
            component.licenses.forEach(license => {
              if (license.license && license.license.id) {
                licenses.add(license.license.id);
              }
            });
          }
        });
        this.licenses = [...licenses];
        this.licenseCount = licenses.size;
      }
    } catch (err) {
      console.error('Error processing SBOM content:', err);
    }
  }
  next();
});

module.exports = mongoose.model('SBOM', SBOMSchema); 