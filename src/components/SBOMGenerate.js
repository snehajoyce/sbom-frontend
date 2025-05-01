// src/components/SBOMGenerate.js
import React, { useState } from 'react';
import axios from 'axios';

const SBOMGenerate = ({ onGenerateSuccess }) => {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({
    category: '',
    operating_system: '',
    supplier: '',
    version: '',
    cost: ''
  });
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus('⚠️ Please select a file to analyze.');
      setIsError(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    for (const key in metadata) {
      formData.append(key, metadata[key]);
    }

    setStatus('⏳ Generating SBOM...');
    try {
      const res = await axios.post('http://localhost:5001/api/generate', formData);
      setStatus(`✅ ${res.data.message}`);
      setIsError(false);
      setFile(null);
      onGenerateSuccess();
    } catch (err) {
      console.error(err);
      setStatus('❌ Generation failed. Please check the backend.');
      setIsError(true);
    }
  };

  return (
    <div className="bg-secondary text-light p-4 rounded mb-4">
      <h3 className="text-warning mb-3">Generate SBOM using Syft</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Executable File/Folder</label>
          <input type="file" className="form-control" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <div className="mb-3 row">
          {['category', 'operating_system', 'supplier', 'version', 'cost'].map((field) => (
            <div className="col-md-6 mb-2" key={field}>
              <input
                className="form-control"
                type="text"
                placeholder={field.replace('_', ' ').toUpperCase()}
                name={field}
                value={metadata[field]}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>
        <button className="btn btn-outline-light" type="submit">Generate SBOM</button>
      </form>
      {status && (
        <div className={`alert mt-3 ${isError ? 'alert-danger' : 'alert-success'}`} role="alert">
          {status}
        </div>
      )}
    </div>
  );
};

export default SBOMGenerate;
