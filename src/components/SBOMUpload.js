// src/components/SBOMUpload.js
import React, { useState } from 'react';
import axios from 'axios';

const SBOMUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(response.data.message || 'Upload successful!');
      setFile(null);
      onUploadSuccess(); // Refresh SBOM list
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage('Upload failed. Please check the backend.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-secondary p-4 rounded shadow-sm text-light mb-4">
      <h3 className="text-warning mb-3">Upload SBOM File</h3>
      <form onSubmit={handleUpload}>
        <div className="mb-3">
          <input
            type="file"
            accept=".json"
            className="form-control"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file && <small className="text-muted">Selected File: {file.name}</small>}
        </div>
        <button type="submit" className="btn btn-outline-light" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload SBOM'}
        </button>
      </form>
      {message && (
        <div className={`alert mt-3 ${uploading ? 'alert-secondary' : 'alert-success'}`} role="alert">
          {message}
        </div>
      )}
    </div>
  );
};

export default SBOMUpload;
