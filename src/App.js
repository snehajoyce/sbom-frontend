import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import SBOMList from './components/SBOMList';
import SearchBar from './components/SearchBar';
import SBOMUpload from './components/SBOMUpload';
import axios from 'axios';

function App() {
  const [results, setResults] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [sboms, setSboms] = useState([]);
  const [selectedSBOM, setSelectedSBOM] = useState('');
  const [compare1, setCompare1] = useState('');
  const [compare2, setCompare2] = useState('');
  const [compareResults, setCompareResults] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5001/api/sboms')
      .then(res => {
        setSboms(res.data);
        if (res.data.length > 0) {
          if (!selectedSBOM) setSelectedSBOM(res.data[0]);
          if (!compare1) setCompare1(res.data[0]);
          if (!compare2 && res.data.length > 1) setCompare2(res.data[1]);
        }
      })
      .catch(err => console.error(err));
  }, [refresh]);

  const handleSearch = async (keyword) => {
    try {
      const response = await axios.post('http://localhost:5001/api/search', {
        keyword,
        sbom_file: selectedSBOM,
      });
      setResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const triggerRefresh = () => setRefresh(!refresh);

  const handleCompare = async () => {
    if (compare1 === compare2) {
      alert('Please select two different SBOM files to compare.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/compare', {
        file1: compare1,
        file2: compare2,
      });
      setCompareResults(response.data);
    } catch (error) {
      console.error('Compare error:', error);
    }
  };

  return (
    <div className="bg-dark text-light min-vh-100">
      <header className="bg-black py-3 mb-4 shadow-sm">
        <div className="container">
          <h1 className="text-warning">SBOM Finder</h1>
          <p className="text-muted">Search, Upload, and Compare your SBOM files.</p>
        </div>
      </header>

      <main className="container">
        <div className="mb-4">
          <SBOMUpload onUploadSuccess={triggerRefresh} />
        </div>

        <div className="mb-3">
          <label htmlFor="sbom-select" className="form-label text-white">
            Select SBOM for Search
          </label>
          <select
            id="sbom-select"
            className="form-select"
            value={selectedSBOM}
            onChange={(e) => setSelectedSBOM(e.target.value)}
          >
            {sboms.map((file, idx) => (
              <option key={idx} value={file}>{file}</option>
            ))}
          </select>
        </div>

        <SearchBar onSearch={handleSearch} />
        <SBOMList results={results} refreshTrigger={refresh} />

        <hr className="border-secondary mt-5" />

        <div className="mt-4">
          <h2 className="text-warning">Compare SBOMs</h2>
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
      </main>

      <footer className="bg-black text-center text-muted py-3 mt-5">
        © {new Date().getFullYear()} UMBC SBOM Finder — Built with ❤️ and React
      </footer>
    </div>
  );
}

export default App;
