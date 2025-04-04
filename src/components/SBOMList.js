import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SBOMList = () => {
  const [sboms, setSboms] = useState([]);
  const [selectedSBOM, setSelectedSBOM] = useState('');
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const fetchSboms = () => {
    axios.get('http://localhost:5001/api/sboms')
      .then(res => setSboms(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchSboms();
  }, []);

  const handleUpload = async () => {
    if (!file) return alert('Please select a file to upload.');
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:5001/api/upload', formData);
      setMessage('Upload successful!');
      setFile(null);
      fetchSboms();
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage('Upload failed!');
    }
  };

  const handleSearch = () => {
    if (!keyword.trim() || !selectedSBOM) return;

    axios.post('http://localhost:5001/api/search', {
      keyword: keyword,
      sbom_file: selectedSBOM
    })
      .then(res => setResults(res.data.results || []))
      .catch(err => console.log(err));
  };

  return (
    <div className="bg-light p-4 rounded shadow-sm mt-4">
      <h3 className="text-dark">Upload SBOM</h3>
      <div className="d-flex flex-column flex-md-row align-items-center gap-2 mb-3">
        <input
          type="file"
          className="form-control w-100 w-md-50"
          onChange={e => setFile(e.target.files[0])}
        />
        <button className="btn btn-dark" onClick={handleUpload}>Upload</button>
      </div>
      {message && <div className="alert alert-info">{message}</div>}

      <h4 className="text-secondary mt-4">Available SBOM Files</h4>
      <ul className="list-group mb-4">
        {sboms.map((file, index) => (
          <li className="list-group-item" key={index}>
            {file}
          </li>
        ))}
      </ul>

      <h4 className="text-secondary">Search Components</h4>
      <div className="row g-2 align-items-center mb-3">
        <div className="col-md-4">
          <select
            className="form-select"
            onChange={e => setSelectedSBOM(e.target.value)}
            value={selectedSBOM}
          >
            <option value="">-- Select SBOM --</option>
            {sboms.map((file, index) => (
              <option key={index} value={file}>{file}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="form-control"
            placeholder="Enter keyword (e.g., openssl)"
          />
        </div>
        <div className="col-md-4">
          <button className="btn btn-warning w-100" onClick={handleSearch}>Search</button>
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h5 className="text-success">Search Results:</h5>
          <ul className="list-group">
            {results.map((item, index) => (
              <li className="list-group-item" key={index}>
                {JSON.stringify(item)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SBOMList;
