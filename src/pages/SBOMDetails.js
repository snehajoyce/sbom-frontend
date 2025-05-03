import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSBOMByFilename, searchComponents } from '../services/api';

const SBOMDetails = () => {
  const { filename } = useParams();
  const [sbom, setSBOM] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchSBOMDetails = async () => {
      try {
        setLoading(true);
        const response = await getSBOMByFilename(filename);
        setSBOM(response.sbom_data);
        setMetadata(response.metadata || {});
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
      setSearchResults(results.results || []);
      setActiveTab('search');
    } catch (error) {
      console.error('Error searching components:', error);
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

  const components = extractComponents(sbom);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-warning">SBOM Details: {metadata.app_name || filename}</h2>
        <Link to="/search" className="btn btn-outline-light">Back to Search</Link>
      </div>

      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card bg-dark text-light">
            <div className="card-body">
              <h5 className="card-title text-warning">Metadata</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>App Name:</strong> {metadata.app_name || 'N/A'}</p>
                  <p><strong>Category:</strong> {metadata.category || 'N/A'}</p>
                  <p><strong>OS:</strong> {metadata.operating_system || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Binary Type:</strong> {metadata.binary_type || 'N/A'}</p>
                  <p><strong>Supplier:</strong> {metadata.supplier || 'N/A'}</p>
                  <p><strong>Manufacturer:</strong> {metadata.manufacturer || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-dark text-light">
            <div className="card-body">
              <h5 className="card-title text-warning">Stats</h5>
              <p><strong>Total Components:</strong> {metadata.total_components || components.length}</p>
              <p><strong>Unique Licenses:</strong> {metadata.unique_licenses || 'N/A'}</p>
              <p><strong>Version:</strong> {metadata.version || 'N/A'}</p>
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
            Components ({components.length})
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
            <div className="mb-3">
              <h6>File Information</h6>
              <p><strong>Filename:</strong> {filename}</p>
              {sbom?.bomFormat && <p><strong>SBOM Format:</strong> {sbom.bomFormat}</p>}
              {sbom?.specVersion && <p><strong>Spec Version:</strong> {sbom.specVersion}</p>}
            </div>
            
            {sbom?.metadata && (
              <div className="mb-3">
                <h6>SBOM Metadata</h6>
                <pre className="bg-secondary text-white p-3 rounded" style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(sbom.metadata, null, 2)}
                </pre>
              </div>
            )}
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
                            {license.license?.id || license.expression || 'Unknown'}
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
            
            <div className="table-responsive">
              <table className="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Version</th>
                    <th>Type</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((component, idx) => (
                    <tr key={idx}>
                      <td>{component.name || 'N/A'}</td>
                      <td>{component.version || 'N/A'}</td>
                      <td>{component.type || 'N/A'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => {
                            const componentDetails = document.getElementById(`details-${idx}`);
                            if (componentDetails) {
                              componentDetails.classList.toggle('d-none');
                            }
                          }}
                        >
                          View Details
                        </button>
                        <div id={`details-${idx}`} className="d-none mt-2">
                          <pre className="bg-secondary text-white p-2 rounded" style={{ maxHeight: '150px', overflow: 'auto' }}>
                            {JSON.stringify(component, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SBOMDetails; 