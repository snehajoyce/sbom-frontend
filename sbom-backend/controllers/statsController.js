const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const SBOM = require('../models/SBOM');

/**
 * @desc    Get general SBOM statistics
 * @route   GET /api/statistics
 * @access  Public
 */
exports.getStatistics = asyncHandler(async (req, res, next) => {
  const { category, operating_system, supplier, binary_type } = req.query;
  
  console.log('Stats Query:', req.query);
  
  // Build match query for filtering
  const matchQuery = {};
  
  if (category && category !== 'All Categories') {
    matchQuery.category = { $regex: new RegExp(category, 'i') };
  }
  
  if (operating_system && operating_system !== 'All Operating Systems') {
    matchQuery.operatingSystem = { $regex: new RegExp(operating_system, 'i') };
  }
  
  if (supplier && supplier !== 'All Suppliers') {
    matchQuery.supplier = { $regex: new RegExp(supplier, 'i') };
  }
  
  if (binary_type && binary_type !== 'All Binary Types') {
    matchQuery.binaryType = { $regex: new RegExp(binary_type, 'i') };
  }
  
  console.log('Match Query:', JSON.stringify(matchQuery));
  
  // Get total SBOM count
  const totalCount = await SBOM.countDocuments(matchQuery);
  console.log('Total matching SBOMs:', totalCount);
  
  // Get total components count
  const componentCountResult = await SBOM.aggregate([
    { $match: matchQuery },
    { $group: { _id: null, totalComponents: { $sum: "$componentCount" } } }
  ]);
  
  const totalComponents = componentCountResult.length > 0 ? componentCountResult[0].totalComponents : 0;
  
  // Get component count statistics
  const componentCountStats = await SBOM.aggregate([
    { $match: matchQuery },
    { 
      $group: { 
        _id: null, 
        average: { $avg: "$componentCount" },
        min: { $min: "$componentCount" },
        max: { $max: "$componentCount" },
        total: { $sum: "$componentCount" }
      } 
    }
  ]);
  
  // Get average licenses per SBOM
  const licenseStats = await SBOM.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        averageLicenses: { $avg: "$licenseCount" }
      }
    }
  ]);
  
  // Get component type distribution
  const componentTypesAgg = await SBOM.aggregate([
    { $match: matchQuery },
    { $unwind: { path: "$componentTypes", preserveNullAndEmptyArrays: true } },
    { 
      $group: { 
        _id: "$componentTypes.k", 
        count: { $sum: "$componentTypes.v" } 
      } 
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } }
  ]);
  
  // Get license distribution
  const licenseDistribution = await SBOM.aggregate([
    { $match: matchQuery },
    { $unwind: { path: "$licenses", preserveNullAndEmptyArrays: true } },
    { 
      $group: { 
        _id: "$licenses", 
        count: { $sum: 1 } 
      } 
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // Get operating system distribution
  const osDistribution = await SBOM.aggregate([
    { $match: matchQuery },
    { 
      $group: { 
        _id: "$operatingSystem", 
        count: { $sum: 1 } 
      } 
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } }
  ]);
  
  // Get binary type distribution
  const binaryTypeDistribution = await SBOM.aggregate([
    { $match: matchQuery },
    { 
      $group: { 
        _id: "$binaryType", 
        count: { $sum: 1 } 
      } 
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } }
  ]);
  
  // Get category distribution
  const categoryDistribution = await SBOM.aggregate([
    { $match: matchQuery },
    { 
      $group: { 
        _id: "$category", 
        count: { $sum: 1 } 
      } 
    },
    { $match: { _id: { $ne: null, $ne: "" } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // Format the results
  const statistics = {
    totalSBOMs: totalCount,
    totalComponents: totalComponents,
    avgComponents: componentCountStats.length > 0 
      ? Math.round(componentCountStats[0].average) || 0
      : 0,
    avgLicenses: licenseStats.length > 0 
      ? Math.round(licenseStats[0].averageLicenses) || 0 
      : 0,
    componentTypes: componentTypesAgg.map(item => ({
      type: item._id || 'Unknown',
      count: item.count || 0
    })),
    licenses: licenseDistribution.map(item => ({
      license: item._id || 'Unknown',
      count: item.count || 0
    })),
    operatingSystems: osDistribution.map(item => ({
      os: item._id || 'Unknown',
      count: item.count || 0
    })),
    binaryTypes: binaryTypeDistribution.map(item => ({
      type: item._id || 'Unknown',
      count: item.count || 0
    })),
    categories: categoryDistribution.map(item => ({
      category: item._id || 'Unknown',
      count: item.count || 0
    })),
    componentCountStats: componentCountStats.length > 0 ? {
      average: Math.round(componentCountStats[0].average) || 0,
      min: componentCountStats[0].min || 0,
      max: componentCountStats[0].max || 0,
      total: componentCountStats[0].total || 0
    } : {
      average: 0,
      min: 0,
      max: 0,
      total: 0
    }
  };
  
  res.status(200).json({
    success: true,
    data: statistics
  });
});

/**
 * @desc    Get platform-specific statistics
 * @route   GET /api/platform-stats
 * @access  Public
 */
exports.getPlatformStatistics = asyncHandler(async (req, res, next) => {
  const { category, operating_system, supplier, binary_type } = req.query;
  
  console.log('Platform Stats Query:', req.query);
  
  // Build match query for filtering
  const matchQuery = {};
  
  if (category && category !== 'All Categories') {
    matchQuery.category = { $regex: new RegExp(category, 'i') };
  }
  
  if (operating_system && operating_system !== 'All Operating Systems') {
    matchQuery.operatingSystem = { $regex: new RegExp(operating_system, 'i') };
  }
  
  if (supplier && supplier !== 'All Suppliers') {
    matchQuery.supplier = { $regex: new RegExp(supplier, 'i') };
  }
  
  if (binary_type && binary_type !== 'All Binary Types') {
    matchQuery.binaryType = { $regex: new RegExp(binary_type, 'i') };
  }
  
  console.log('Platform Match Query:', JSON.stringify(matchQuery));

  // First check if we have any SBOMs at all that match the filters
  const sbomCount = await SBOM.countDocuments(matchQuery);
  console.log('Matching SBOMs for platform stats:', sbomCount);
  
  if (sbomCount === 0) {
    return res.status(200).json({
      success: true,
      data: {
        platforms: [],
        message: "No SBOMs found in the database to analyze with the current filters"
      }
    });
  }

  // Get unique platforms (combination of OS and binary type)
  const platforms = await SBOM.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { platform: { $ifNull: ["$supplier", "Unknown"] } },
        sboms: { $sum: 1 },
        components: { $sum: { $ifNull: ["$componentCount", 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        platform: "$_id.platform",
        sboms: "$sboms",
        components: "$components",
        avgComponents: { 
          $cond: [
            { $eq: ["$sboms", 0] },
            0,
            { $divide: ["$components", "$sboms"] }
          ]
        }
      }
    },
    { $sort: { sboms: -1 } }
  ]);
  
  // For each platform, find the top binary type and license
  const platformsWithDetails = await Promise.all(
    platforms.map(async (platform) => {
      // Create a match query that includes both the platform and the original filters
      const platformMatchQuery = {
        ...matchQuery,
        supplier: platform.platform
      };
      
      // Find top binary type for this platform
      const topBinaryType = await SBOM.aggregate([
        { $match: platformMatchQuery },
        { $group: { _id: "$binaryType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);
      
      // Find top license for this platform
      const topLicense = await SBOM.aggregate([
        { $match: platformMatchQuery },
        { $unwind: { path: "$licenses", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$licenses", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);
      
      return {
        ...platform,
        avgComponents: Math.round(platform.avgComponents) || 0,
        topBinaryType: topBinaryType.length > 0 ? topBinaryType[0]._id || 'N/A' : 'N/A',
        topLicense: topLicense.length > 0 ? topLicense[0]._id || 'N/A' : 'N/A'
      };
    })
  );
  
  res.status(200).json({
    success: true,
    data: {
      platforms: platformsWithDetails
    }
  });
}); 