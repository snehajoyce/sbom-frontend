// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSBOMsMetadata, fetchSBOMs } from '../services/api';

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
        
        // Create a Set to store unique filenames and prevent duplicates
        const uniqueSboms = new Map();
        let hasError = false;
        
        // Try all available sources to get the most comprehensive list
        try {
          // 1. Try metadata endpoint (has the most details)
          const metadataResponse = await fetchSBOMsMetadata();
          
          if (metadataResponse && metadataResponse.data && Array.isArray(metadataResponse.data)) {
            metadataResponse.data.forEach(sbom => {
              if (sbom.filename) {
                uniqueSboms.set(sbom.filename, sbom);
              }
            });
          } else if (Array.isArray(metadataResponse)) {
            metadataResponse.forEach(sbom => {
              if (sbom.filename) {
                uniqueSboms.set(sbom.filename, sbom);
              }
            });
          }
        } catch (err) {
          console.error('Error fetching SBOM metadata:', err);
          hasError = true;
        }
        
        try {
          // 2. Try basic SBOM list
          const basicList = await fetchSBOMs();
          
          if (basicList && basicList.data && Array.isArray(basicList.data)) {
            basicList.data.forEach(sbom => {
              if (sbom.filename) {
                uniqueSboms.set(sbom.filename, sbom);
              }
            });
          } else if (Array.isArray(basicList)) {
            basicList.forEach(filename => {
              if (!uniqueSboms.has(filename)) {
                uniqueSboms.set(filename, {
                  filename,
                  app_name: filename.replace('.json', '')
                });
              }
            });
          }
        } catch (err) {
          console.error('Error fetching basic SBOM list:', err);
          hasError = true;
        }
        
        // Convert the Map to an array
        const allSboms = Array.from(uniqueSboms.values());
        
        if (allSboms.length > 0) {
          setSboms(allSboms);
          setError(null);
        } else if (hasError) {
          setError('Could not load SBOM data. Please try again later.');
        } else {
          setError(null);
        }
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
      <h1 className="display-5 text-warning mb-4">Welcome to SBOM Finder</h1>
      
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
                  No SBOMs available. Use the navigation bar to upload or generate an SBOM.
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label htmlFor="sbomSelect" className="form-label">Select an SBOM to view details ({sboms.length} available):</label>
                    <select 
                      id="sbomSelect" 
                      className="form-select"
                      onChange={handleSbomChange}
                      defaultValue=""
                    >
                      <option value="" disabled>Choose an SBOM...</option>
                      {sboms.map((sbom, index) => (
                        <option key={index} value={sbom.filename}>
                          {sbom.app_name || sbom.filename} {sbom.version ? `(v${sbom.version})` : ''} 
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSbom && (
                    <div className="mt-3 p-3 border border-secondary rounded">
                      <h6 className="text-warning">{selectedSbom.app_name || selectedSbom.filename} Details</h6>
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
                        {selectedSbom.total_components && (
                          <div className="col-md-6">
                            <p className="mb-1"><small className="text-muted">Components:</small></p>
                            <p className="mb-2">{selectedSbom.total_components}</p>
                          </div>
                        )}
                        {selectedSbom.unique_licenses && (
                          <div className="col-md-6">
                            <p className="mb-1"><small className="text-muted">Licenses:</small></p>
                            <p className="mb-2">{selectedSbom.unique_licenses}</p>
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
