import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSBOMByFilename, searchComponents } from '../services/api';

const SBOMDetails = () => {
  const { filename } = useParams();
  const [sbom, setSBOM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [componentTypes, setComponentTypes] = useState({});
  const [licenseCount, setLicenseCount] = useState({});

  useEffect(() => {
    const fetchSBOMDetails = async () => {
      try {
        setLoading(true);
        const response = await getSBOMByFilename(filename);
        
        if (response && response.data) {
          setSBOM(response.data);
          
          // Process components to get statistics
          const components = extractComponents(response.data.content);
          const typesCount = {};
          const licenseMap = {};
          
          components.forEach(comp => {
            // Count component types
            const type = comp.type || 'Unknown';
            typesCount[type] = (typesCount[type] || 0) + 1;
            
            // Count licenses
            if (comp.licenses && Array.isArray(comp.licenses)) {
              comp.licenses.forEach(lic => {
                const licenseId = typeof lic === 'string' 
                  ? lic 
                  : (lic.license?.id || lic.expression || 'Unknown');
                licenseMap[licenseId] = (licenseMap[licenseId] || 0) + 1;
              });
            }
          });
          
          setComponentTypes(typesCount);
          setLicenseCount(licenseMap);
        } else {
          setError('Invalid SBOM data received');
        }
      } catch (error) {
        console.error('Error fetching SBOM details:', error);
        setError('Failed to load SBOM details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (filename) {
      fetchSBOMDetails();
    }
  }, [filename]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchComponents(searchTerm, filename);
      if (results && results.data) {
        setSearchResults(results.data || []);
        setActiveTab('search');
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching components:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const extractComponents = (sbomData) => {
    if (!sbomData) return [];
    
    // Try CycloneDX format
    if (sbomData.components) {
      return sbomData.components;
    }
    
    // Try SPDX format
    if (sbomData.packages) {
      return sbomData.packages;
    }
    
    // Try Syft format
    if (sbomData.artifacts) {
      return sbomData.artifacts;
    }
    
    return [];
  };

  const renderLicenseDistribution = () => {
    const sortedLicenses = Object.entries(licenseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Show top 10 licenses
    
    return (
      <div className="mt-4">
        <h5 className="text-warning">Top Licenses</h5>
        <div className="table-responsive">
          <table className="table table-dark table-hover">
            <thead>
              <tr>
                <th>License</th>
                <th>Count</th>
                <th>Proportion</th>
              </tr>
            </thead>
            <tbody>
              {sortedLicenses.map(([license, count], idx) => {
                const total = Object.values(licenseCount).reduce((a, b) => a + b, 0);
                const percentage = ((count / total) * 100).toFixed(1);
                
                return (
                  <tr key={idx}>
                    <td>{license}</td>
                    <td>{count}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="progress flex-grow-1 bg-secondary me-2" style={{ height: '10px' }}>
                          <div 
                            className="progress-bar bg-warning" 
                            style={{ width: `${percentage}%` }}
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        {percentage}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderComponentTypesDistribution = () => {
    const sortedTypes = Object.entries(componentTypes)
      .sort((a, b) => b[1] - a[1]);
    
    return (
      <div className="mt-4">
        <h5 className="text-warning">Component Types</h5>
        <div className="table-responsive">
          <table className="table table-dark table-hover">
            <thead>
              <tr>
                <th>Type</th>
                <th>Count</th>
                <th>Proportion</th>
              </tr>
            </thead>
            <tbody>
              {sortedTypes.map(([type, count], idx) => {
                const total = Object.values(componentTypes).reduce((a, b) => a + b, 0);
                const percentage = ((count / total) * 100).toFixed(1);
                
                return (
                  <tr key={idx}>
                    <td>{type}</td>
                    <td>{count}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="progress flex-grow-1 bg-secondary me-2" style={{ height: '10px' }}>
                          <div 
                            className="progress-bar bg-warning" 
                            style={{ width: `${percentage}%` }}
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        {percentage}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-light mt-3">Loading SBOM details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/search" className="btn btn-warning">Back to Search</Link>
      </div>
    );
  }

  const components = sbom?.content ? extractComponents(sbom.content) : [];
  const totalComponents = components.length;
  const totalLicenses = Object.keys(licenseCount).length;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-warning">SBOM Details: {sbom?.appName || filename}</h2>
        <Link to="/search" className="btn btn-outline-light">Back to Search</Link>
      </div>

      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card bg-dark text-light">
            <div className="card-body">
              <h5 className="card-title text-warning">Metadata</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>App Name:</strong> {sbom?.appName || 'N/A'}</p>
                  <p><strong>App Version:</strong> {sbom?.appVersion || 'N/A'}</p>
                  <p><strong>Category:</strong> {sbom?.category || 'N/A'}</p>
                  <p><strong>OS:</strong> {sbom?.operatingSystem || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Binary Type:</strong> {sbom?.binaryType || 'N/A'}</p>
                  <p><strong>Supplier:</strong> {sbom?.supplier || 'N/A'}</p>
                  <p><strong>Component Count:</strong> {totalComponents}</p>
                  <p><strong>License Count:</strong> {totalLicenses}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-dark text-light h-100">
            <div className="card-body d-flex flex-column justify-content-center align-items-center text-center">
              <h5 className="card-title text-warning">Component Breakdown</h5>
              {Object.keys(componentTypes).length > 0 ? (
                <div className="w-100">
                  {Object.entries(componentTypes)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([type, count], idx) => {
                      const percentage = ((count / totalComponents) * 100).toFixed(1);
                      return (
                        <div key={idx} className="mb-2">
                          <div className="d-flex justify-content-between">
                            <small>{type}</small>
                            <small>{percentage}%</small>
                          </div>
                          <div className="progress bg-secondary" style={{ height: '8px' }}>
                            <div 
                              className="progress-bar bg-warning" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p>No component type data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <form className="d-flex" onSubmit={handleSearch}>
          <input
            type="text"
            className="form-control me-2"
            placeholder="Search for components in this SBOM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-warning"
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active bg-warning text-dark' : 'text-light'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'components' ? 'active bg-warning text-dark' : 'text-light'}`}
            onClick={() => setActiveTab('components')}
          >
            Components ({totalComponents})
          </button>
        </li>
        {searchResults.length > 0 && (
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'search' ? 'active bg-warning text-dark' : 'text-light'}`}
              onClick={() => setActiveTab('search')}
            >
              Search Results ({searchResults.length})
            </button>
          </li>
        )}
      </ul>

      {activeTab === 'overview' && (
        <div className="card bg-dark text-light">
          <div className="card-body">
            <h5 className="card-title text-warning">SBOM Overview</h5>
            
            <div className="row">
              <div className="col-md-6">
                {renderComponentTypesDistribution()}
              </div>
              <div className="col-md-6">
                {renderLicenseDistribution()}
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="text-warning">File Information</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Filename:</strong> {filename}</p>
                  {sbom?.content?.bomFormat && <p><strong>SBOM Format:</strong> {sbom.content.bomFormat}</p>}
                  {sbom?.content?.specVersion && <p><strong>Spec Version:</strong> {sbom.content.specVersion}</p>}
                </div>
                <div className="col-md-6">
                  <p><strong>File Size:</strong> {Math.round((JSON.stringify(sbom?.content || {}).length / 1024))} KB</p>
                  <p><strong>Created:</strong> {new Date(sbom?.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'components' && (
        <div className="table-responsive">
          <table className="table table-dark table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Version</th>
                <th>Type</th>
                <th>Licenses</th>
                <th>PURL</th>
              </tr>
            </thead>
            <tbody>
              {components.map((component, idx) => (
                <tr key={idx}>
                  <td>{component.name || 'N/A'}</td>
                  <td>{component.version || 'N/A'}</td>
                  <td>{component.type || 'N/A'}</td>
                  <td>
                    {component.licenses ? (
                      <ul className="list-unstyled mb-0">
                        {component.licenses.map((license, i) => (
                          <li key={i}>
                            {typeof license === 'string' 
                              ? license 
                              : (license.license?.id || license.expression || 'Unknown')}
                          </li>
                        ))}
                      </ul>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <small className="text-truncate d-inline-block" style={{ maxWidth: '250px' }}>
                      {component.purl || 'N/A'}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="card bg-dark text-light">
          <div className="card-body">
            <h5 className="card-title text-warning">Search Results for "{searchTerm}"</h5>
            <p>Found {searchResults.length} component(s) matching your search.</p>
            
            {searchResults.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-dark table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Version</th>
                      <th>Type</th>
                      <th>Licenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((result, idx) => (
                      <tr key={idx}>
                        <td>{result.name || 'N/A'}</td>
                        <td>{result.version || 'N/A'}</td>
                        <td>{result.type || 'N/A'}</td>
                        <td>
                          {result.licenses ? (
                            <ul className="list-unstyled mb-0">
                              {result.licenses.map((license, i) => (
                                <li key={i}>
                                  {typeof license === 'string' 
                                    ? license 
                                    : (license.license?.id || license.expression || 'Unknown')}
                                </li>
                              ))}
                            </ul>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No matching components found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SBOMDetails; 