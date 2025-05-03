import React, { useState, useEffect } from 'react';
import { searchSBOMs, getSuggestions } from '../services/api';

const Search = () => {
  const [searchParams, setSearchParams] = useState({
    name: '',
    category: '',
    os: '',
    binary_type: '',
    supplier: '',
    manufacturer: ''
  });
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [totalResults, setTotalResults] = useState(0);

  // Load initial suggestions for dropdowns
  useEffect(() => {
    const loadSuggestions = async () => {
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
    
    loadSuggestions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      // Filter out empty parameters
      const searchCriteria = Object.entries(searchParams)
        .filter(([_, value]) => value.trim() !== '')
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});

      const response = await searchSBOMs(searchCriteria);
      setResults(response.results || []);
      setTotalResults(response.count || 0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = () => {
    setSearchParams({
      name: '',
      category: '',
      os: '',
      binary_type: '',
      supplier: '',
      manufacturer: ''
    });
    setResults([]);
    setTotalResults(0);
  };

  return (
    <div className="container mt-4">
      <h2 className="text-warning mb-4">Advanced SBOM Search</h2>
      
      <div className="bg-secondary p-4 rounded mb-4">
        <form onSubmit={handleSearch}>
          <div className="row mb-3">
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">Application Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter name or part of name"
                name="name"
                value={searchParams.name}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">Category</label>
              <select
                className="form-select"
                name="category"
                value={searchParams.category}
                onChange={handleInputChange}
              >
                <option value="">All Categories</option>
                {suggestions.category?.map((category, idx) => (
                  <option key={idx} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">Operating System</label>
              <select
                className="form-select"
                name="os"
                value={searchParams.os}
                onChange={handleInputChange}
              >
                <option value="">All Operating Systems</option>
                {suggestions.operating_system?.map((os, idx) => (
                  <option key={idx} value={os}>{os}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">Binary Type</label>
              <select
                className="form-select"
                name="binary_type"
                value={searchParams.binary_type}
                onChange={handleInputChange}
              >
                <option value="">All Binary Types</option>
                {suggestions.app_binary_type?.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">Supplier</label>
              <select
                className="form-select"
                name="supplier"
                value={searchParams.supplier}
                onChange={handleInputChange}
              >
                <option value="">All Suppliers</option>
                {suggestions.supplier?.map((supplier, idx) => (
                  <option key={idx} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">Manufacturer</label>
              <select
                className="form-select"
                name="manufacturer"
                value={searchParams.manufacturer}
                onChange={handleInputChange}
              >
                <option value="">All Manufacturers</option>
                {suggestions.manufacturer?.map((manufacturer, idx) => (
                  <option key={idx} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-warning"
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={resetSearch}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
      
      {results.length > 0 && (
        <div className="bg-dark p-3 rounded border border-secondary">
          <h4 className="text-warning mb-3">Search Results ({totalResults})</h4>
          <div className="table-responsive">
            <table className="table table-dark table-hover">
              <thead>
                <tr>
                  <th>App Name</th>
                  <th>Category</th>
                  <th>OS</th>
                  <th>Type</th>
                  <th>Components</th>
                  <th>Licenses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.app_name}</td>
                    <td>{item.category || 'N/A'}</td>
                    <td>{item.operating_system || 'N/A'}</td>
                    <td>{item.binary_type || 'N/A'}</td>
                    <td>{item.total_components}</td>
                    <td>{item.unique_licenses}</td>
                    <td>
                      <a href={`/sbom-details/${item.filename}`} className="btn btn-sm btn-outline-warning me-2">
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {totalResults === 0 && !isSearching && Object.values(searchParams).some(value => value.trim() !== '') && (
        <div className="alert alert-info">No results found matching your search criteria.</div>
      )}
    </div>
  );
};

export default Search;
