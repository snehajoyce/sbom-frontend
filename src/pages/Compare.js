// src/pages/Compare.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Compare = () => {
  const [sboms, setSboms] = useState([]);
  const [compare1, setCompare1] = useState('');
  const [compare2, setCompare2] = useState('');
  const [compareResults, setCompareResults] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5001/api/sboms')
      .then(res => {
        setSboms(res.data);
        if (res.data.length > 1) {
          setCompare1(res.data[0]);
          setCompare2(res.data[1]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleCompare = async () => {
    if (compare1 === compare2) {
      alert('Please select two different SBOM files to compare.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/compare', {
        file1: compare1,
        file2: compare2
      });
      setCompareResults(response.data);
    } catch (error) {
      console.error('Compare error:', error);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-warning mb-4">Compare SBOMs</h2>
      <div className="row g-2 mb-3">
        <div className="col-md-5">
          <label className="form-label">SBOM 1</label>
          <select
            className="form-select"
            value={compare1}
            onChange={(e) => setCompare1(e.target.value)}
          >
            {sboms.map((file, idx) => (
              <option key={idx} value={file}>{file}</option>
            ))}
          </select>
        </div>
        <div className="col-md-5">
          <label className="form-label">SBOM 2</label>
          <select
            className="form-select"
            value={compare2}
            onChange={(e) => setCompare2(e.target.value)}
          >
            {sboms.map((file, idx) => (
              <option key={idx} value={file}>{file}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-outline-light w-100" onClick={handleCompare}>
            Compare
          </button>
        </div>
      </div>

      {compareResults && (
        <div className="row">
          <div className="col-md-6">
            <h5 className="text-info">Only in {compare1}:</h5>
            <ul className="list-group">
              {compareResults.only_in_first.map((item, idx) => (
                <li className="list-group-item small" key={idx}>
                  <code>{JSON.stringify(item)}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-md-6">
            <h5 className="text-info">Only in {compare2}:</h5>
            <ul className="list-group">
              {compareResults.only_in_second.map((item, idx) => (
                <li className="list-group-item small" key={idx}>
                  <code>{JSON.stringify(item)}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compare;