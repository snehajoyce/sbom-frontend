import axios from 'axios';

// Determine API base URL based on environment - no env files needed for Vercel
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? 'https://sbom-finder-backend.vercel.app' // Production URL
  : 'http://localhost:5001'; // Local development URL

console.log('Using API URL:', API_BASE_URL);

// Export API base URL for use in other components
export { API_BASE_URL };

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add longer timeout for uploads
  timeout: 30000,
});

// Fetch list of all SBOMs
export const fetchSBOMs = async () => {
  const response = await apiClient.get('/api/sboms');
  return response.data;
};

// Fetch metadata for all SBOMs
export const fetchSBOMsMetadata = async () => {
  const response = await apiClient.get('/api/sboms/metadata');
  return response.data;
};

// Get specific SBOM file content by filename
export const getSBOMByFilename = async (filename) => {
  const response = await apiClient.get(`/api/sbom/${filename}`);
  return response.data;
};

// Search for SBOMs by various criteria
export const searchSBOMs = async (criteria) => {
  const response = await apiClient.get('/api/search', {
    params: criteria
  });
  return response.data;
};

// Search for components within a specific SBOM file
export const searchComponents = async (keyword, sbomFile) => {
  const response = await apiClient.post('/api/search-components', {
    keyword,
    sbom_file: sbomFile
  });
  return response.data;
};

// Compare two SBOMs
export const compareSBOMs = async (sbom1, sbom2) => {
  const response = await apiClient.post('/api/compare', { sbom1, sbom2 });
  return response.data;
};

// Get statistical information about SBOMs
export const getSBOMStatistics = async (filters = {}) => {
  const response = await apiClient.get('/api/statistics', {
    params: filters
  });
  return response.data;
};

// Get platform-specific statistics
export const getPlatformStatistics = async () => {
  const response = await apiClient.get('/api/platform-stats');
  return response.data;
};

// Get autocomplete suggestions for search fields
export const getSuggestions = async (field, prefix = '') => {
  const response = await apiClient.get('/api/suggestions', {
    params: { field, prefix }
  });
  return response.data;
};

// Upload SBOM with metadata - improved with better error handling
export const uploadSBOM = async (formData) => {
  // Debug log of form data entries (excluding file content)
  console.log('Upload form data keys:', [...formData.keys()]);
  if (formData.get('file')) {
    const file = formData.get('file');
    console.log('File details:', { 
      name: file.name, 
      type: file.type, 
      size: `${Math.round(file.size / 1024)} KB` 
    });
  } else {
    console.error('No file attached to formData');
  }

  try {
    // Use a custom axios instance specifically for form data uploads
    const uploadResponse = await axios({
      method: 'post',
      url: `${API_BASE_URL}/api/upload`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // For debugging request details
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });
    
    console.log('Upload successful, response:', uploadResponse.data);
    return uploadResponse.data;
  } catch (error) {
    console.error('Upload API error:', error);
    if (error.response) {
      // The server responded with an error status
      console.error('Server error data:', error.response.data);
      console.error('Server error status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    }
    throw error;
  }
};

// Auto-generate SBOM from uploaded executable - improved
export const generateSBOM = async (formData) => {
  try {
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/api/generate-sbom`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Generate SBOM upload progress: ${percentCompleted}%`);
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Generate SBOM error:', error);
    throw error;
  }
};
