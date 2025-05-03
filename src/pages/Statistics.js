import React, { useState, useEffect } from 'react';
import { getSBOMStatistics, getPlatformStatistics, getSuggestions } from '../services/api';

const Statistics = () => {
  const [statsData, setStatsData] = useState(null);
  const [platformData, setPlatformData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    os: '',
    supplier: '',
    manufacturer: '',
    binary_type: ''
  });
  const [suggestions, setSuggestions] = useState({});

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const fields = ['category', 'operating_system', 'app_binary_type', 'supplier', 'manufacturer'];
        const suggestionsData = {};
        
        for (const field of fields) {
          const response = await getSuggestions(field);
          suggestionsData[field] = response.suggestions || [];
        }
        
        setSuggestions(suggestionsData);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      }
    };

    fetchSuggestions();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Filter out empty parameters
        const filterParams = Object.entries(filters)
          .filter(([_, value]) => value.trim() !== '')
          .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {});
        
        // Fetch statistics with filters
        const statsResponse = await getSBOMStatistics(filterParams);
        setStatsData(statsResponse);
        
        // Fetch platform statistics
        const platformResponse = await getPlatformStatistics();
        setPlatformData(platformResponse);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      os: '',
      supplier: '',
      manufacturer: '',
      binary_type: ''
    });
  };

  if (loading && !statsData) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-light mt-3">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="text-warning mb-4">SBOM Statistics</h2>
      
      {error && <div className="alert alert-danger mb-4">{error}</div>}
      
      <div className="card bg-dark text-light mb-4">
        <div className="card-header">
          <h5 className="mb-0">Filter Statistics</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md">
              <div className="mb-3">
                <label className="form-label">Category</label>
                <select 
                  className="form-select" 
                  name="category" 
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Categories</option>
                  {suggestions.category?.map((item, idx) => (
                    <option key={idx} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="col-md">
              <div className="mb-3">
                <label className="form-label">Operating System</label>
                <select 
                  className="form-select" 
                  name="os" 
                  value={filters.os}
                  onChange={handleFilterChange}
                >
                  <option value="">All Operating Systems</option>
                  {suggestions.operating_system?.map((item, idx) => (
                    <option key={idx} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="col-md">
              <div className="mb-3">
                <label className="form-label">Binary Type</label>
                <select 
                  className="form-select" 
                  name="binary_type" 
                  value={filters.binary_type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Binary Types</option>
                  {suggestions.app_binary_type?.map((item, idx) => (
                    <option key={idx} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md">
              <div className="mb-3">
                <label className="form-label">Supplier</label>
                <select 
                  className="form-select" 
                  name="supplier" 
                  value={filters.supplier}
                  onChange={handleFilterChange}
                >
                  <option value="">All Suppliers</option>
                  {suggestions.supplier?.map((item, idx) => (
                    <option key={idx} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="col-md">
              <div className="mb-3">
                <label className="form-label">Manufacturer</label>
                <select 
                  className="form-select" 
                  name="manufacturer" 
                  value={filters.manufacturer}
                  onChange={handleFilterChange}
                >
                  <option value="">All Manufacturers</option>
                  {suggestions.manufacturer?.map((item, idx) => (
                    <option key={idx} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="col-md d-flex align-items-end">
              <button 
                className="btn btn-outline-warning w-100" 
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {statsData && (
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card bg-dark text-light mb-4">
              <div className="card-header">
                <h5 className="mb-0">General Statistics</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="card bg-secondary text-center p-3">
                      <h2 className="text-warning">{statsData.total_sboms}</h2>
                      <p className="mb-0">Total SBOMs</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card bg-secondary text-center p-3">
                      <h2 className="text-warning">{statsData.total_components}</h2>
                      <p className="mb-0">Total Components</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card bg-secondary text-center p-3">
                      <h2 className="text-warning">{statsData.average_components_per_sbom}</h2>
                      <p className="mb-0">Avg. Components</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card bg-secondary text-center p-3">
                      <h2 className="text-warning">{statsData.average_unique_licenses}</h2>
                      <p className="mb-0">Avg. Licenses</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {statsData && (
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card bg-dark text-light h-100">
              <div className="card-header">
                <h5 className="mb-0">Operating System Distribution</h5>
              </div>
              <div className="card-body">
                <ul className="list-group">
                  {Object.entries(statsData.os_distribution || {}).map(([os, count], idx) => (
                    <li key={idx} className="list-group-item bg-secondary text-light d-flex justify-content-between align-items-center">
                      {os}
                      <span className="badge bg-warning rounded-pill">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card bg-dark text-light h-100">
              <div className="card-header">
                <h5 className="mb-0">Category Distribution</h5>
              </div>
              <div className="card-body">
                <ul className="list-group">
                  {Object.entries(statsData.category_distribution || {}).map(([category, count], idx) => (
                    <li key={idx} className="list-group-item bg-secondary text-light d-flex justify-content-between align-items-center">
                      {category}
                      <span className="badge bg-warning rounded-pill">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {statsData && (
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card bg-dark text-light h-100">
              <div className="card-header">
                <h5 className="mb-0">Binary Type Distribution</h5>
              </div>
              <div className="card-body">
                <ul className="list-group">
                  {Object.entries(statsData.binary_type_distribution || {}).map(([type, count], idx) => (
                    <li key={idx} className="list-group-item bg-secondary text-light d-flex justify-content-between align-items-center">
                      {type}
                      <span className="badge bg-warning rounded-pill">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card bg-dark text-light h-100">
              <div className="card-header">
                <h5 className="mb-0">Top 10 Licenses</h5>
              </div>
              <div className="card-body">
                <ul className="list-group">
                  {Object.entries(statsData.license_distribution || {}).map(([license, count], idx) => (
                    <li key={idx} className="list-group-item bg-secondary text-light d-flex justify-content-between align-items-center">
                      {license}
                      <span className="badge bg-warning rounded-pill">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {platformData && (
        <div className="card bg-dark text-light mb-4">
          <div className="card-header">
            <h5 className="mb-0">Platform Comparison</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>SBOMs</th>
                    <th>Components</th>
                    <th>Avg. Components</th>
                    <th>Top Binary Type</th>
                    <th>Top License</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(platformData).map(([platform, data], idx) => {
                    // Find top binary type
                    const topBinaryType = data.count > 0 
                      ? Object.entries(data.binary_types || {}).sort((a, b) => b[1] - a[1])[0]?.[0] 
                      : 'N/A';
                    
                    // Find top license
                    const topLicense = data.count > 0 
                      ? Object.entries(data.top_licenses || {}).sort((a, b) => b[1] - a[1])[0]?.[0] 
                      : 'N/A';
                    
                    return (
                      <tr key={idx}>
                        <td>{platform}</td>
                        <td>{data.count}</td>
                        <td>{data.total_components || 0}</td>
                        <td>{data.average_components || 0}</td>
                        <td>{topBinaryType}</td>
                        <td>{topLicense}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics; 