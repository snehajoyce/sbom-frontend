// src/pages/Home.js
import React from 'react';
import SBOMList from '../components/SBOMList';
import SearchBar from '../components/SearchBar';

const Home = ({ results, onSearch, sboms, selectedSBOM, setSelectedSBOM }) => {
  return (
    <div className="container mt-4">
      <h2 className="text-warning">Search SBOM</h2>
      <div className="mb-3">
        <label className="form-label text-white">Select SBOM for Search</label>
        <select
          className="form-select"
          value={selectedSBOM}
          onChange={(e) => setSelectedSBOM(e.target.value)}
        >
          {sboms.map((file, idx) => (
            <option key={idx} value={file}>{file}</option>
          ))}
        </select>
      </div>
      <SearchBar onSearch={onSearch} />
      <SBOMList results={results} />
    </div>
  );
};

export default Home;
