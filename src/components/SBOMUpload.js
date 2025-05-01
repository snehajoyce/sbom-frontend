import React, { useState } from 'react';
import axios from 'axios';

const SBOMUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    operating_system: '',
    supplier: '',
    version: '',
    cost: ''
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('⚠️ Please select a file to upload.');
      setIsError(true);
      return;
    }

    const payload = new FormData();
    payload.append('file', file);
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value);
    });

    setUploading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await axios.post('http://localhost:5001/api/upload', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(`✅ ${response.data.message}`);
      setIsError(false);
      setFile(null);
      setFormData({ category: '', operating_system: '', supplier: '', version: '', cost: '' });
      onUploadSuccess();
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage(
        err.response?.data?.error
          ? `❌ ${err.response.data.error}`
          : '❌ Upload failed. Please try again.'
      );
      setIsError(true);
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
          {file && <small className="text-light d-block mt-1">Selected File: {file.name}</small>}
        </div>

        <div className="row g-2">
          <div className="col-md-6">
            <input
              type="text"
              placeholder="Category (e.g., Appliance)"
              className="form-control"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              placeholder="Operating System (e.g., Linux)"
              className="form-control"
              value={formData.operating_system}
              onChange={(e) => setFormData({ ...formData, operating_system: e.target.value })}
              required
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              placeholder="Supplier"
              className="form-control"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              placeholder="Version"
              className="form-control"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              type="number"
              step="0.01"
              placeholder="Cost (USD)"
              className="form-control"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="mt-3">
          <button type="submit" className="btn btn-outline-light w-100" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload SBOM'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`alert mt-3 ${isError ? 'alert-danger' : 'alert-success'}`} role="alert">
          {message}
        </div>
      )}
    </div>
  );
};

export default SBOMUpload;
