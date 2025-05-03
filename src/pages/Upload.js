import React, { useState } from 'react';
import { uploadSBOM } from '../services/api';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [metadata, setMetadata] = useState({
    app_name: '',
    category: '',
    operating_system: '',
    app_binary_type: 'desktop',
    supplier: '',
    manufacturer: '',
    version: '',
    cost: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  // Validate file before upload
  const validateFile = (file) => {
    if (!file) {
      setMessage('Please select a file to upload.');
      return false;
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      setMessage('Only JSON files are supported. Please select a .json file.');
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setMessage(`File is too large. Maximum size is 10MB. Your file is ${Math.round(file.size / (1024 * 1024))}MB.`);
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Clear previous error messages
      setMessage('');
      console.log(`File selected: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Validate file before proceeding
    if (!validateFile(file)) {
      return;
    }

    // Require app_name at minimum
    if (!metadata.app_name.trim()) {
      setMessage('Application Name is required.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata to form data
    Object.entries(metadata).forEach(([key, value]) => {
      if (value.trim()) { // Only append non-empty values
        formData.append(key, value.trim());
      }
    });
    
    setIsUploading(true);
    setMessage('Uploading file... Please wait.');

    try {
      const response = await uploadSBOM(formData);
      console.log('Upload response:', response);
      
      setMessage(`Upload successful! SBOM for ${metadata.app_name} has been added.`);
      setFile(null);
      setMetadata({
        app_name: '',
        category: '',
        operating_system: '',
        app_binary_type: 'desktop',
        supplier: '',
        manufacturer: '',
        version: '',
        cost: '',
        description: ''
      });
      
      // Clear the file input
      const fileInput = document.getElementById('sbomFile');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // The server responded with an error status
        const errorData = error.response.data || {};
        const errorMessage = errorData.error || errorData.message || `Server error: ${error.response.status}`;
        
        // Check for the specific readonly database error
        if (errorMessage.includes('readonly database') || errorMessage.includes('OperationalError')) {
          setMessage(
            'Server database error: The application database is in read-only mode. ' +
            'This is a server configuration issue that needs to be addressed by the administrator. ' +
            'The SBOM file upload may have succeeded, but metadata could not be saved to the database.'
          );
        } else {
          setMessage(`Upload failed: ${errorMessage}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setMessage('Upload failed: No response from the server. Please check if the backend is running.');
      } else {
        // Something happened in setting up the request
        setMessage(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-warning mb-4">Upload SBOM</h2>
      
      {/* Instructions card */}
      <div className="alert alert-info mb-4">
        <h5>Upload Instructions</h5>
        <p>Upload a valid SBOM JSON file in CycloneDX or SPDX format. The file should contain component information.</p>
        <p className="mb-0"><strong>Required fields:</strong> File and Application Name</p>
      </div>
      
      <div className="bg-dark p-4 rounded border border-secondary">
        <form onSubmit={handleUpload}>
          <div className="mb-3">
            <label htmlFor="sbomFile" className="form-label text-light">
              Select SBOM File (JSON format) <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              className="form-control"
              id="sbomFile"
              accept=".json"
              onChange={handleFileChange}
              required
            />
            <small className="text-light">Upload a CycloneDX or SPDX format SBOM file (max 10MB)</small>
          </div>
          
          <h5 className="text-warning mb-3 mt-4">SBOM Metadata</h5>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">
                Application Name <span className="text-danger">*</span>
              </label>
              <input 
                type="text" 
                className="form-control" 
                name="app_name"
                value={metadata.app_name}
                onChange={handleInputChange}
                placeholder="e.g., Firefox, Chrome"
                required
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">Category</label>
              <input 
                type="text" 
                className="form-control" 
                name="category"
                value={metadata.category}
                onChange={handleInputChange}
                placeholder="e.g., Browser, Media Player"
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label text-light">Operating System</label>
              <select 
                className="form-select"
                name="operating_system"
                value={metadata.operating_system}
                onChange={handleInputChange}
              >
                <option value="">Select OS</option>
                <option value="Windows">Windows</option>
                <option value="Linux">Linux</option>
                <option value="macOS">macOS</option>
                <option value="Android">Android</option>
                <option value="iOS">iOS</option>
                <option value="Cross-platform">Cross-platform</option>
              </select>
            </div>
            
            <div className="col-md-4 mb-3">
              <label className="form-label text-light">Binary Type</label>
              <select 
                className="form-select"
                name="app_binary_type"
                value={metadata.app_binary_type}
                onChange={handleInputChange}
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="web">Web</option>
                <option value="server">Server</option>
                <option value="embedded">Embedded</option>
                <option value="library">Library</option>
              </select>
            </div>
            
            <div className="col-md-4 mb-3">
              <label className="form-label text-light">Version</label>
              <input 
                type="text" 
                className="form-control" 
                name="version"
                value={metadata.version}
                onChange={handleInputChange}
                placeholder="e.g., 1.0.0"
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">Supplier</label>
              <input 
                type="text" 
                className="form-control" 
                name="supplier"
                value={metadata.supplier}
                onChange={handleInputChange}
                placeholder="e.g., Mozilla"
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">Manufacturer</label>
              <input 
                type="text" 
                className="form-control" 
                name="manufacturer"
                value={metadata.manufacturer}
                onChange={handleInputChange}
                placeholder="e.g., Mozilla Foundation"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label text-light">Description</label>
            <textarea 
              className="form-control" 
              name="description"
              value={metadata.description}
              onChange={handleInputChange}
              placeholder="Brief description of the software"
              rows="3"
            ></textarea>
          </div>
          
          <button
            type="submit"
            className="btn btn-warning"
            disabled={isUploading || !file}
          >
            {isUploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading...
              </>
            ) : 'Upload SBOM'}
          </button>
        </form>
        
        {message && (
          <div className={`alert mt-3 ${message.includes('successful') ? 'alert-success' : message.includes('Server database error') ? 'alert-danger' : 'alert-info'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
