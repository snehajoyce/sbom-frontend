import React, { useState, useEffect, useCallback } from 'react';
import { getSBOMStatistics, getPlatformStatistics, getSuggestions } from '../services/api';

const DEFAULT_OPTIONS = {
  category: ['Browser', 'Media Player', 'Utility', 'Security'],
  operating_system: ['Windows', 'Linux', 'macOS', 'Android', 'iOS'],
  manufacturer: ['Mozilla Foundation', 'Microsoft Corp', 'Apple Inc', 'Google LLC'],
  app_binary_type: ['desktop', 'mobile', 'web', 'server', 'embedded', 'library']
};

const Statistics = () => {
  const [statsData, setStatsData] = useState(null);
  const [platformData, setPlatformData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    operating_system: '',
    supplier: '',
    manufacturer: '',
    binary_type: ''
  });
  const [suggestions, setSuggestions] = useState({});
  const [activeFilters, setActiveFilters] = useState([]);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create filter parameters with proper mapping for backend
      const filterParams = {};
      const activeFiltersList = [];
      
      if (filters.category.trim() !== '') {
        filterParams.category = filters.category;
        activeFiltersList.push(`Category: ${filters.category}`);
      }
      
      if (filters.operating_system.trim() !== '') {
        // Convert operating system to lowercase to match the model's enum values
        filterParams.operating_system = filters.operating_system.toLowerCase();
        activeFiltersList.push(`OS: ${filters.operating_system}`);
      }
      
      if (filters.supplier.trim() !== '') {
        filterParams.supplier = filters.supplier;
        activeFiltersList.push(`Supplier: ${filters.supplier}`);
      }
      
      // Map manufacturer to supplier if supplier isn't set
      if (filters.manufacturer.trim() !== '' && !filterParams.supplier) {
        filterParams.supplier = filters.manufacturer;
        activeFiltersList.push(`Manufacturer: ${filters.manufacturer}`);
      }
      
      if (filters.binary_type.trim() !== '') {
        // Convert binary type to lowercase to match the model's enum values
        filterParams.binary_type = filters.binary_type.toLowerCase();
        activeFiltersList.push(`Binary Type: ${filters.binary_type}`);
      }
      
      setActiveFilters(activeFiltersList);
      console.log('Sending filter params:', filterParams);
      
      // Fetch statistics with filters
      const statsResponse = await getSBOMStatistics(filterParams);
      console.log('Stats API response:', statsResponse);
      setStatsData(statsResponse);
      
      // Fetch platform statistics with the same filters
      const platformResponse = await getPlatformStatistics(filterParams);
      console.log('Platform API response:', platformResponse);
      setPlatformData(platformResponse);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to load statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      operating_system: '',
      supplier: '',
      manufacturer: '',
      binary_type: ''
    });
    setActiveFilters([]);
  };

  const categories = (suggestions.category?.filter(opt => opt && opt !== 'Unknown')?.length
    ? suggestions.category.filter(opt => opt && opt !== 'Unknown')
    : DEFAULT_OPTIONS.category
  );
  const operatingSystems = (suggestions.operating_system?.filter(opt => opt && opt !== 'Unknown')?.length
    ? suggestions.operating_system.filter(opt => opt && opt !== 'Unknown')
    : DEFAULT_OPTIONS.operating_system
  );
  const manufacturers = (suggestions.manufacturer?.filter(opt => opt && opt !== 'Unknown')?.length
    ? suggestions.manufacturer.filter(opt => opt && opt !== 'Unknown')
    : DEFAULT_OPTIONS.manufacturer
  );
  const binaryTypes = (suggestions.app_binary_type?.filter(opt => opt && opt !== 'Unknown')?.length
    ? suggestions.app_binary_type.filter(opt => opt && opt !== 'Unknown')
    : DEFAULT_OPTIONS.app_binary_type
  );
  const suppliers = (suggestions.supplier?.filter(opt => opt && opt !== 'Unknown')?.length
    ? suggestions.supplier.filter(opt => opt && opt !== 'Unknown')
    : ['Mozilla', 'Microsoft', 'Apple', 'Google']
  );

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

  // Parse the statistics data
  const stats = statsData?.data || {};
  const platforms = platformData?.data?.platforms || [];

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
                  {categories.map((category, idx) => (
                    <option key={idx} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="col-md">
              <div className="mb-3">
                <label className="form-label">Operating System</label>
                <select 
                  className="form-select" 
                  name="operating_system" 
                  value={filters.operating_system}
                  onChange={handleFilterChange}
                >
                  <option value="">All Operating Systems</option>
                  {operatingSystems.map((os, idx) => (
                    <option key={idx} value={os}>{os}</option>
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
                  {binaryTypes.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
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
                  {suppliers.map((item, idx) => (
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
                  {manufacturers.map((manufacturer, idx) => (
                    <option key={idx} value={manufacturer}>{manufacturer}</option>
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
          
          {activeFilters.length > 0 && (
            <div className="mt-3">
              <div className="d-flex flex-wrap gap-2">
                {activeFilters.map((filter, idx) => (
                  <span key={idx} className="badge bg-warning text-dark">{filter}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {!loading && stats && (
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card bg-dark text-light mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">General Statistics</h5>
                {activeFilters.length > 0 && (
                  <span className="badge bg-info">Filtered Results</span>
                )}
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="card bg-secondary text-center p-3">
                      <h2 className="text-warning">{stats.totalSBOMs || 0}</h2>
                      <p className="mb-0">Total SBOMs</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card bg-secondary text-center p-3">
                      <h2 className="text-warning">{stats.totalComponents || 0}</h2>
                      <p className="mb-0">Total Components</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card bg-secondary text-center p-3">
                      <h2 className="text-warning">{stats.avgComponents || 0}</h2>
                      <p className="mb-0">Avg. Components</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card bg-secondary text-center p-3">
                      <h2 className="text-warning">{stats.avgLicenses || 0}</h2>
                      <p className="mb-0">Avg. Licenses</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card bg-dark text-light mb-4 h-100">
            <div className="card-header">
              <h5 className="mb-0">Operating System Distribution</h5>
            </div>
            <div className="card-body">
              {stats && stats.operatingSystems && stats.operatingSystems.length > 0 ? (
                <ul className="list-group">
                  {stats.operatingSystems.map((item, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center bg-dark text-light border-secondary">
                      {item.os || 'Unknown'}
                      <span className="badge bg-warning rounded-pill">{item.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No operating system data available</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card bg-dark text-light mb-4 h-100">
            <div className="card-header">
              <h5 className="mb-0">Category Distribution</h5>
            </div>
            <div className="card-body">
              {stats && stats.categories && stats.categories.length > 0 ? (
                <ul className="list-group">
                  {stats.categories.map((item, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center bg-dark text-light border-secondary">
                      {item.category || 'Unknown'}
                      <span className="badge bg-warning rounded-pill">{item.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No category data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card bg-dark text-light mb-4 h-100">
            <div className="card-header">
              <h5 className="mb-0">Binary Type Distribution</h5>
            </div>
            <div className="card-body">
              {stats && stats.binaryTypes && stats.binaryTypes.length > 0 ? (
                <ul className="list-group">
                  {stats.binaryTypes.map((item, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center bg-dark text-light border-secondary">
                      {item.type || 'Unknown'}
                      <span className="badge bg-warning rounded-pill">{item.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No binary type data available</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card bg-dark text-light mb-4 h-100">
            <div className="card-header">
              <h5 className="mb-0">Top 10 Licenses</h5>
            </div>
            <div className="card-body">
              {stats && stats.licenses && stats.licenses.length > 0 ? (
                <ul className="list-group">
                  {stats.licenses.map((item, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center bg-dark text-light border-secondary">
                      {item.license || 'Unknown'}
                      <span className="badge bg-warning rounded-pill">{item.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No license data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card bg-dark text-light mb-4">
        <div className="card-header">
          <h5 className="mb-0">Platform Comparison</h5>
        </div>
        <div className="card-body">
          {platforms && platforms.length > 0 ? (
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
                  {platforms.map((platform, idx) => (
                    <tr key={idx}>
                      <td>{platform.platform}</td>
                      <td>{platform.sboms}</td>
                      <td>{platform.components}</td>
                      <td>{platform.avgComponents}</td>
                      <td>{platform.topBinaryType}</td>
                      <td>{platform.topLicense}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">No platform comparison data available. Please upload more SBOMs with diverse platforms to see comparison.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics; 