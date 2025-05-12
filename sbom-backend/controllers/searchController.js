const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const SBOM = require('../models/SBOM');

/**
 * @desc    Search SBOMs by criteria
 * @route   GET /api/search
 * @access  Public
 */
exports.searchSBOMs = asyncHandler(async (req, res, next) => {
  const {
    name,
    category,
    operating_system,
    binary_type,
    supplier,
    query,
    fuzzy
  } = req.query;

  // Build search query
  const searchQuery = {};
  
  // Text search (if query parameter exists)
  if (query) {
    if (fuzzy === 'true') {
      // Fuzzy search using regex with case insensitivity
      searchQuery.$or = [
        { appName: { $regex: query, $options: 'i' } },
        { supplier: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ];
    } else {
      // Use MongoDB text search (requires text index)
      searchQuery.$text = { $search: query };
    }
  }
  
  // Filter by specific fields if provided
  if (name) {
    searchQuery.appName = fuzzy === 'true' 
      ? { $regex: name, $options: 'i' }
      : name;
  }
  
  if (category) {
    searchQuery.category = fuzzy === 'true'
      ? { $regex: category, $options: 'i' }
      : category;
  }
  
  if (operating_system) {
    searchQuery.operatingSystem = operating_system;
  }
  
  if (binary_type) {
    searchQuery.binaryType = binary_type;
  }
  
  if (supplier) {
    searchQuery.supplier = fuzzy === 'true'
      ? { $regex: supplier, $options: 'i' }
      : supplier;
  }

  // Execute the search
  const sboms = await SBOM.find(searchQuery).select('-content');
  
  res.status(200).json({
    success: true,
    count: sboms.length,
    data: sboms
  });
});

/**
 * @desc    Search for components within SBOMs
 * @route   POST /api/search-components
 * @access  Public
 */
exports.searchComponents = asyncHandler(async (req, res, next) => {
  const { keyword, sbom_file } = req.body;
  
  if (!keyword) {
    return next(new ErrorResponse('Please provide a search keyword', 400));
  }
  
  let query = {};
  
  // If specific SBOM file is provided, only search within it
  if (sbom_file) {
    query.filename = sbom_file;
  }
  
  // Get SBOMs
  const sboms = await SBOM.find(query);
  
  // Perform search within components
  const results = sboms.map(sbom => {
    const components = sbom.content.components || [];
    
    // Filter components that match the keyword
    const matchedComponents = components.filter(component => {
      // Check component name
      if (component.name && component.name.toLowerCase().includes(keyword.toLowerCase())) {
        return true;
      }
      
      // Check component version
      if (component.version && component.version.toLowerCase().includes(keyword.toLowerCase())) {
        return true;
      }
      
      // Check component licenses
      if (component.licenses && Array.isArray(component.licenses)) {
        for (const license of component.licenses) {
          if (license.license && license.license.id && 
              license.license.id.toLowerCase().includes(keyword.toLowerCase())) {
            return true;
          }
        }
      }
      
      // Check purl
      if (component.purl && component.purl.toLowerCase().includes(keyword.toLowerCase())) {
        return true;
      }
      
      return false;
    });
    
    return {
      sbomId: sbom._id,
      filename: sbom.filename,
      appName: sbom.appName,
      appVersion: sbom.appVersion,
      supplier: sbom.supplier,
      matchCount: matchedComponents.length,
      matches: matchedComponents.map(comp => ({
        name: comp.name,
        version: comp.version,
        type: comp.type,
        purl: comp.purl,
        licenses: comp.licenses
      }))
    };
  }).filter(result => result.matchCount > 0);
  
  res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});

/**
 * @desc    Compare two SBOMs
 * @route   POST /api/compare
 * @access  Public
 */
exports.compareSBOMs = asyncHandler(async (req, res, next) => {
  const { file1, file2 } = req.body;
  
  if (!file1 || !file2) {
    return next(new ErrorResponse('Please provide two SBOM files to compare', 400));
  }
  
  // Fetch both SBOMs
  const sbom1 = await SBOM.findOne({ filename: file1 });
  const sbom2 = await SBOM.findOne({ filename: file2 });
  
  if (!sbom1) {
    return next(new ErrorResponse(`SBOM not found: ${file1}`, 404));
  }
  
  if (!sbom2) {
    return next(new ErrorResponse(`SBOM not found: ${file2}`, 404));
  }
  
  // Get components arrays, with fallbacks to empty arrays if not defined
  const components1 = (sbom1.content && sbom1.content.components) ? sbom1.content.components : [];
  const components2 = (sbom2.content && sbom2.content.components) ? sbom2.content.components : [];

  // Create maps for faster lookup
  const compMap1 = new Map();
  const compMap2 = new Map();
  
  components1.forEach(comp => {
    if (comp && comp.name) {
      const key = comp.version ? `${comp.name}@${comp.version}` : comp.name;
      compMap1.set(key, comp);
    }
  });
  
  components2.forEach(comp => {
    if (comp && comp.name) {
      const key = comp.version ? `${comp.name}@${comp.version}` : comp.name;
      compMap2.set(key, comp);
    }
  });
  
  // Find common and unique components
  const common = [];
  const uniqueToFirst = [];
  const uniqueToSecond = [];
  
  // Check components unique to first SBOM
  compMap1.forEach((comp, key) => {
    if (compMap2.has(key)) {
      common.push({
        name: comp.name || 'Unknown',
        version: comp.version || 'Unknown',
        type: comp.type || 'Unknown'
      });
    } else {
      uniqueToFirst.push({
        name: comp.name || 'Unknown',
        version: comp.version || 'Unknown',
        type: comp.type || 'Unknown'
      });
    }
  });
  
  // Check components unique to second SBOM
  compMap2.forEach((comp, key) => {
    if (!compMap1.has(key)) {
      uniqueToSecond.push({
        name: comp.name || 'Unknown',
        version: comp.version || 'Unknown',
        type: comp.type || 'Unknown'
      });
    }
  });
  
  // Get license information
  const sbom1Licenses = {};
  const sbom2Licenses = {};
  
  function extractLicenses(components, licenseMap) {
    components.forEach(comp => {
      if (comp.licenses && Array.isArray(comp.licenses)) {
        comp.licenses.forEach(licObj => {
          let licId = 'Unknown';
          
          if (licObj.license && licObj.license.id) {
            licId = licObj.license.id;
          } else if (typeof licObj === 'string') {
            licId = licObj;
          }
          
          licenseMap[licId] = (licenseMap[licId] || 0) + 1;
        });
      }
    });
  }
  
  extractLicenses(components1, sbom1Licenses);
  extractLicenses(components2, sbom2Licenses);
  
  // Calculate similarity
  const totalUniqueComponents = uniqueToFirst.length + uniqueToSecond.length + common.length;
  let similarityPercentage = 0;
  
  if (totalUniqueComponents > 0) {
    similarityPercentage = Math.round((common.length / totalUniqueComponents) * 100);
  }
  
  // Prepare response
  const response = {
    sbom1_meta: {
      app_name: sbom1.appName || file1.replace('.json', ''),
      app_version: sbom1.appVersion || 'Unknown',
      supplier: sbom1.supplier || 'Unknown',
      operating_system: sbom1.operatingSystem || 'Unknown',
      binary_type: sbom1.binaryType || 'Unknown',
      category: sbom1.category || 'Unknown'
    },
    sbom2_meta: {
      app_name: sbom2.appName || file2.replace('.json', ''),
      app_version: sbom2.appVersion || 'Unknown',
      supplier: sbom2.supplier || 'Unknown',
      operating_system: sbom2.operatingSystem || 'Unknown',
      binary_type: sbom2.binaryType || 'Unknown',
      category: sbom2.category || 'Unknown'
    },
    comparison_stats: {
      similarity_percentage: similarityPercentage,
      first_total_components: components1.length,
      second_total_components: components2.length,
      common_component_count: common.length,
      only_in_first_count: uniqueToFirst.length,
      only_in_second_count: uniqueToSecond.length,
    },
    common_components: common,
    only_in_first: uniqueToFirst,
    only_in_second: uniqueToSecond,
    sbom1_licenses: sbom1Licenses,
    sbom2_licenses: sbom2Licenses
  };
  
  res.status(200).json({
    success: true,
    data: response
  });
});

/**
 * @desc    Get field suggestions for search autocomplete
 * @route   GET /api/suggestions
 * @access  Public
 */
exports.getSuggestions = asyncHandler(async (req, res, next) => {
  const { field, prefix = '' } = req.query;
  
  if (!field) {
    return next(new ErrorResponse('Please provide a field to get suggestions for', 400));
  }
  
  let aggregationField;
  switch (field.toLowerCase()) {
    case 'name':
      aggregationField = 'appName';
      break;
    case 'category':
      aggregationField = 'category';
      break;
    case 'supplier':
      aggregationField = 'supplier';
      break;
    case 'os':
    case 'operating_system':
      aggregationField = 'operatingSystem';
      break;
    case 'type':
    case 'binary_type':
    case 'app_binary_type':
      aggregationField = 'binaryType';
      break;
    case 'manufacturer':
      aggregationField = 'supplier'; // Map manufacturer to supplier for backward compatibility
      break;
    default:
      // Instead of error, return empty array for unknown fields
      return res.status(200).json({
        success: true,
        count: 0,
        suggestions: []
      });
  }
  
  // Build match query based on prefix
  const matchQuery = {};
  if (prefix) {
    matchQuery[aggregationField] = { $regex: `^${prefix}`, $options: 'i' };
  }
  
  // Aggregate unique values
  const suggestions = await SBOM.aggregate([
    { $match: matchQuery },
    { $group: { _id: `$${aggregationField}` } },
    { $match: { _id: { $ne: null, $ne: '' } } },
    { $sort: { _id: 1 } },
    { $limit: 20 }
  ]);
  
  res.status(200).json({
    success: true,
    count: suggestions.length,
    suggestions: suggestions.map(item => item._id)
  });
}); 