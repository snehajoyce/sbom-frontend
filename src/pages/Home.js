// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSBOMsMetadata, API_BASE_URL } from '../services/api';

const Home = () => {
  const [sboms, setSboms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSbom, setSelectedSbom] = useState(null);
  const [error, setError] = useState(null);

  // Fetch SBOM metadata on component mount
  useEffect(() => {
    const loadSBOMs = async () => {
      try {
        setLoading(true);
        const data = await fetchSBOMsMetadata();
        setSboms(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load SBOMs:', err);
        setError('Failed to load SBOM data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadSBOMs();
  }, []);

  // Handle dropdown selection change
  const handleSbomChange = (e) => {
    const selected = sboms.find(sbom => sbom.filename === e.target.value);
    setSelectedSbom(selected);
  };

  return (
    <div className="container mt-4">
      <div className="jumbotron bg-dark p-4 rounded border border-secondary mb-4">
        <h1 className="display-5 text-warning">Welcome to SBOM Finder</h1>
        <p className="lead text-light">
          A comprehensive tool for managing and analyzing Software Bill of Materials (SBOM).
        </p>
        <hr className="my-4 border-light" />
        <p className="text-light">
          You can upload, generate, search, and compare SBOMs for different software applications.
        </p>
        <div className="d-flex gap-2">
          <Link to="/upload" className="btn btn-warning">Upload SBOM</Link>
          <Link to="/generate" className="btn btn-outline-warning">Generate SBOM</Link>
          <Link to="/search" className="btn btn-outline-light">Search SBOMs</Link>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card bg-dark text-light h-100">
            <div className="card-header">
              <h5 className="mb-0">What is an SBOM?</h5>
            </div>
            <div className="card-body">
              <p>A Software Bill of Materials (SBOM) is a formal, machine-readable inventory of software components and dependencies, information about those components, and their hierarchical relationships.</p>
              <p>SBOMs help organizations:</p>
              <ul>
                <li>Track known vulnerabilities</li>
                <li>Identify licensing compliance issues</li>
                <li>Manage software supply chain risks</li>
                <li>Meet regulatory requirements</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card bg-dark text-light h-100">
            <div className="card-header">
              <h5 className="mb-0">Available SBOMs</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : sboms.length === 0 ? (
                <div className="alert alert-info">
                  No SBOMs available. Upload or generate an SBOM to get started.
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label htmlFor="sbomSelect" className="form-label">Select an SBOM to view details:</label>
                    <select 
                      id="sbomSelect" 
                      className="form-select"
                      onChange={handleSbomChange}
                      defaultValue=""
                    >
                      <option value="" disabled>Choose an SBOM...</option>
                      {sboms.map(sbom => (
                        <option key={sbom.filename} value={sbom.filename}>
                          {sbom.app_name} {sbom.version ? `(v${sbom.version})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSbom && (
                    <div className="mt-3 p-3 border border-secondary rounded">
                      <h6 className="text-warning">{selectedSbom.app_name} Details</h6>
                      <div className="row g-2">
                        {selectedSbom.category && (
                          <div className="col-md-6">
                            <p className="mb-1"><small className="text-muted">Category:</small></p>
                            <p className="mb-2">{selectedSbom.category}</p>
                          </div>
                        )}
                        {selectedSbom.operating_system && (
                          <div className="col-md-6">
                            <p className="mb-1"><small className="text-muted">OS:</small></p>
                            <p className="mb-2">{selectedSbom.operating_system}</p>
                          </div>
                        )}
                      </div>
                      <div className="d-grid gap-2 mt-2">
                        <Link 
                          to={`/sbom-details/${selectedSbom.filename}`} 
                          className="btn btn-sm btn-outline-warning"
                        >
                          View Full Details
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
