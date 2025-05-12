/**
 * Middleware to handle async/await functions with error catching
 * @param {Function} fn The async function to wrap
 * @returns {Function} Express middleware
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler; 