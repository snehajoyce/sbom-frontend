// src/pages/Compare.js
import React, { useState, useEffect } from 'react';
import { fetchSBOMs, compareSBOMs } from '../services/api';

const Compare = () => {
  const [sboms, setSboms] = useState([]);
  const [compare1, setCompare1] = useState('');
  const [compare2, setCompare2] = useState('');
  const [compareResults, setCompareResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSBOMList = async () => {
      try {
        const data = await fetchSBOMs();
        setSboms(data);
        if (data.length > 1) {
          setCompare1(data[0]);
          setCompare2(data[1]);
        }
      } catch (err) {
        console.error('Error fetching SBOMs:', err);
        setError('Failed to load SBOM list. Please try again later.');
      }
    };

    fetchSBOMList();
  }, []);

  const handleCompare = async () => {
    if (!compare1 || !compare2) {
      setError('Please select two SBOM files to compare.');
      return;
    }

    if (compare1 === compare2) {
      setError('Please select two different SBOM files to compare.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await compareSBOMs(compare1, compare2);
      setCompareResults(results);
    } catch (err) {
      console.error('Compare error:', err);
      setError('Failed to compare SBOMs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-warning mb-4">Compare SBOMs</h2>
      
      <div className="card bg-dark text-light mb-4">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-5">
              <label className="form-label">SBOM 1</label>
              <select
                className="form-select"
                value={compare1}
                onChange={(e) => setCompare1(e.target.value)}
              >
                <option value="">Select an SBOM file</option>
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
                <option value="">Select an SBOM file</option>
                {sboms.map((file, idx) => (
                  <option key={idx} value={file}>{file}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button 
                className="btn btn-warning w-100" 
                onClick={handleCompare}
                disabled={loading || !compare1 || !compare2}
              >
                {loading ? 'Comparing...' : 'Compare'}
              </button>
            </div>
          </div>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>
      </div>

      {compareResults && (
        <div className="comparison-results">
          <div className="card bg-dark text-light mb-4">
            <div className="card-body">
              <h4 className="text-warning mb-3">Comparison Results</h4>
              
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card bg-secondary text-light">
                    <div className="card-header">
                      <h5 className="mb-0">{compareResults.sbom1_meta?.app_name || compare1}</h5>
                    </div>
                    <div className="card-body">
                      <p><strong>Category:</strong> {compareResults.sbom1_meta?.category || 'N/A'}</p>
                      <p><strong>OS:</strong> {compareResults.sbom1_meta?.operating_system || 'N/A'}</p>
                      <p><strong>Components:</strong> {compareResults.comparison_stats?.first_total_components || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-secondary text-light">
                    <div className="card-header">
                      <h5 className="mb-0">{compareResults.sbom2_meta?.app_name || compare2}</h5>
                    </div>
                    <div className="card-body">
                      <p><strong>Category:</strong> {compareResults.sbom2_meta?.category || 'N/A'}</p>
                      <p><strong>OS:</strong> {compareResults.sbom2_meta?.operating_system || 'N/A'}</p>
                      <p><strong>Components:</strong> {compareResults.comparison_stats?.second_total_components || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card bg-secondary text-light mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Comparison Statistics</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="text-center mb-3">
                        <h2 className="text-warning">{compareResults.comparison_stats?.similarity_percentage || 0}%</h2>
                        <p>Similarity</p>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <div className="text-center">
                            <h3 className="text-warning">{compareResults.comparison_stats?.common_component_count || 0}</h3>
                            <p>Common Components</p>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="text-center">
                            <h3 className="text-danger">{compareResults.comparison_stats?.only_in_first_count || 0}</h3>
                            <p>Only in SBOM 1</p>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="text-center">
                            <h3 className="text-info">{compareResults.comparison_stats?.only_in_second_count || 0}</h3>
                            <p>Only in SBOM 2</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* License comparison */}
              <div className="card bg-secondary text-light mb-4">
                <div className="card-header">
                  <h5 className="mb-0">License Comparison</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-center mb-3">SBOM 1 Licenses</h6>
                      <ul className="list-group">
                        {Object.entries(compareResults.sbom1_licenses || {}).map(([license, count], idx) => (
                          <li key={idx} className="list-group-item bg-dark text-light d-flex justify-content-between align-items-center">
                            {license}
                            <span className="badge bg-warning rounded-pill">{count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-center mb-3">SBOM 2 Licenses</h6>
                      <ul className="list-group">
                        {Object.entries(compareResults.sbom2_licenses || {}).map(([license, count], idx) => (
                          <li key={idx} className="list-group-item bg-dark text-light d-flex justify-content-between align-items-center">
                            {license}
                            <span className="badge bg-warning rounded-pill">{count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Component differences */}
              <ul className="nav nav-tabs mb-3" role="tablist">
                <li className="nav-item" role="presentation">
                  <button 
                    className="nav-link active text-warning" 
                    id="common-tab" 
                    data-bs-toggle="tab" 
                    data-bs-target="#common" 
                    type="button" 
                    role="tab"
                  >
                    Common Components ({compareResults.common_components?.length || 0})
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button 
                    className="nav-link text-danger" 
                    id="only1-tab" 
                    data-bs-toggle="tab" 
                    data-bs-target="#only1" 
                    type="button" 
                    role="tab"
                  >
                    Only in SBOM 1 ({compareResults.only_in_first?.length || 0})
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button 
                    className="nav-link text-info" 
                    id="only2-tab" 
                    data-bs-toggle="tab" 
                    data-bs-target="#only2" 
                    type="button" 
                    role="tab"
                  >
                    Only in SBOM 2 ({compareResults.only_in_second?.length || 0})
                  </button>
                </li>
              </ul>
              
              <div className="tab-content">
                <div className="tab-pane fade show active" id="common" role="tabpanel">
                  <div className="table-responsive">
                    <table className="table table-dark table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Version</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compareResults.common_components?.map((comp, idx) => (
                          <tr key={idx}>
                            <td>{comp.name}</td>
                            <td>{comp.version}</td>
                            <td>{comp.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="tab-pane fade" id="only1" role="tabpanel">
                  <div className="table-responsive">
                    <table className="table table-dark table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Version</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compareResults.only_in_first?.map((comp, idx) => (
                          <tr key={idx}>
                            <td>{comp.name}</td>
                            <td>{comp.version}</td>
                            <td>{comp.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="tab-pane fade" id="only2" role="tabpanel">
                  <div className="table-responsive">
                    <table className="table table-dark table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Version</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compareResults.only_in_second?.map((comp, idx) => (
                          <tr key={idx}>
                            <td>{comp.name}</td>
                            <td>{comp.version}</td>
                            <td>{comp.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compare;