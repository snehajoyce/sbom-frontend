// src/pages/Generate.js
import React, { useState } from 'react';
import { generateSBOM } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Generate = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  // Validate file before generation
  const validateFile = (file) => {
    if (!file) {
      setMessage('Please select a file to process.');
      return false;
    }

    // Check file size (max 50MB for executables)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setMessage(`File is too large. Maximum size is 50MB. Your file is ${Math.round(file.size / (1024 * 1024))}MB.`);
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

  const handleGenerate = async (e) => {
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
    
    setIsGenerating(true);
    setMessage('Generating SBOM... This may take a few moments.');

    try {
      const response = await generateSBOM(formData);
      console.log('Generation response:', response);
      
      setMessage(`SBOM generated successfully: ${response.filename}`);
      
      // Redirect to the generated SBOM details page
      setTimeout(() => {
        navigate(`/sbom-details/${response.filename}`);
      }, 2000);
      
    } catch (error) {
      console.error('Generation error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with an error
        const errorData = error.response.data || {};
        const errorMessage = errorData.error || errorData.message || `Server error: ${error.response.status}`;
        
        // Check for the specific readonly database error
        if (errorMessage.includes('readonly database') || errorMessage.includes('OperationalError')) {
          setMessage(
            'Server database error: The application database is in read-only mode. ' +
            'This is a server configuration issue that needs to be addressed by the administrator. ' +
            'Please try the Upload feature instead, which might work if writing to filesystem is permitted.'
          );
        } else {
          setMessage(`Failed to generate SBOM: ${errorMessage}`);
        }
      } else if (error.request) {
        // No response received
        setMessage('Failed to generate SBOM: No response from server. Check if backend is running.');
      } else {
        // Request setup error
        setMessage(`Failed to generate SBOM: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-warning mb-4">Generate SBOM</h2>
      
      <div className="alert alert-info mb-4">
        <h5>About SBOM Generation</h5>
        <p>
          Upload an executable file to automatically generate a Software Bill of Materials (SBOM) using Syft.
          This process analyzes the file and identifies its components and dependencies.
        </p>
        <p className="mb-0">
          <strong>Supported file types:</strong> Executables (.exe, .dll), packages (.jar, .war, .apk), containers, libraries
        </p>
      </div>
      
      <div className="bg-dark p-4 rounded border border-secondary">
        <form onSubmit={handleGenerate}>
          <div className="mb-3">
            <label htmlFor="executableFile" className="form-label text-light">
              Upload Executable or Package <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              className="form-control"
              id="executableFile"
              onChange={handleFileChange}
              required
            />
            <small className="text-light">Maximum file size: 50MB</small>
          </div>
          
          <h5 className="text-warning mb-3 mt-4">Software Metadata</h5>
          
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
            disabled={isGenerating || !file}
          >
            {isGenerating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generating SBOM...
              </>
            ) : 'Generate SBOM'}
          </button>
        </form>
        
        {message && (
          <div className={`alert mt-3 ${message.includes('successfully') ? 'alert-success' : message.includes('Server database error') ? 'alert-danger' : 'alert-info'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Generate;