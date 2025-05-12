import React, { useState, useEffect, useCallback } from 'react';
import { searchSBOM, getSuggestions } from '../services/api';
import { Link } from 'react-router-dom';

const DEFAULT_OPTIONS = {
  category: ['Browser', 'Media Player', 'Utility', 'Security'],
  operating_system: ['Windows', 'Linux', 'macOS', 'Android', 'iOS'],
  manufacturer: ['Mozilla Foundation', 'Microsoft Corp', 'Apple Inc', 'Google LLC'],
  app_binary_type: ['desktop', 'mobile', 'web', 'server', 'embedded', 'library'],
  supplier: ['Mozilla', 'Microsoft', 'Apple', 'Google']
};

const Search = () => {
  const [searchParams, setSearchParams] = useState({
    name: '',
    category: '',
    operating_system: '',
    binary_type: '',
    supplier: '',
    manufacturer: ''
  });
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [totalResults, setTotalResults] = useState(0);
  const [activeFilters, setActiveFilters] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [initialLoad, setInitialLoad] = useState(true); // Track initial load

  // Move performSearch above useEffect
  const performSearch = useCallback(async (criteria) => {
    setIsSearching(true);
    setErrorMessage('');

    try {
      console.log('Searching with criteria:', criteria);
      const response = await searchSBOM(criteria);
      
      if (response && response.data) {
        setResults(response.data || []);
        setTotalResults(response.count || 0);
        
        if (response.data.length === 0) {
          setErrorMessage('No SBOMs match your search criteria.');
        }
      } else {
        setResults([]);
        setTotalResults(0);
        setErrorMessage('No results found.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setErrorMessage('Error performing search. Please try again.');
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Load initial suggestions for dropdowns
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const fields = ['category', 'operating_system', 'app_binary_type', 'supplier', 'manufacturer'];
        const suggestionsData = {};
        
        for (const field of fields) {
          try {
            const response = await getSuggestions(field);
            if (response && response.suggestions) {
              // Filter out null, undefined or empty values
              suggestionsData[field] = response.suggestions.filter(item => item && item !== '');
            } else {
              suggestionsData[field] = [];
            }
          } catch (error) {
            console.error(`Error loading ${field} suggestions:`, error);
            suggestionsData[field] = [];
          }
        }
        
        setSuggestions(suggestionsData);
      } catch (error) {
        console.error('Error loading suggestions:', error);
        setErrorMessage('Failed to load filter options. Please try again later.');
      }
    };
    
    loadSuggestions();
    
    // Load all SBOMs on initial page load
    if (initialLoad) {
      performSearch({ all: true });
      setInitialLoad(false);
    }
  }, [initialLoad, performSearch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // Map frontend keys to backend field names
    const searchCriteria = {};
    const activeFiltersList = [];
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value.trim() !== '') {
        let backendKey = key;
        if (key === 'operating_system') backendKey = 'operatingSystem';
        if (key === 'binary_type') backendKey = 'binaryType';
        if (key === 'manufacturer') return; // skip manufacturer, not supported in backend
        searchCriteria[backendKey] = value;
        // Format the filter for display
        const displayKey = key.replace(/_/g, ' ');
        const capitalizedKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1);
        activeFiltersList.push(`${capitalizedKey}: ${value}`);
      }
    });
    // Always use fuzzy search for partial matches
    searchCriteria.fuzzy = true;
    setActiveFilters(activeFiltersList);
    
    if (Object.keys(searchCriteria).length === 1 && searchCriteria.fuzzy) {
      // If no filters except fuzzy, do a search that returns all SBOMs
      performSearch({ all: true, fuzzy: true });
    } else {
      performSearch(searchCriteria);
    }
  };

  const resetSearch = () => {
    setSearchParams({
      name: '',
      category: '',
      operating_system: '',
      binary_type: '',
      supplier: '',
      manufacturer: ''
    });
    setActiveFilters([]);
    // Always use fuzzy search for reset
    performSearch({ all: true, fuzzy: true });
  };

  // Filter out empty or 'Unknown' values and use defaults if needed
  const categories = (suggestions.category?.length > 0)
    ? suggestions.category
    : DEFAULT_OPTIONS.category;

  const operatingSystems = (suggestions.operating_system?.length > 0)
    ? suggestions.operating_system
    : DEFAULT_OPTIONS.operating_system;

  const manufacturers = (suggestions.manufacturer?.length > 0)
    ? suggestions.manufacturer
    : DEFAULT_OPTIONS.manufacturer;

  const binaryTypes = (suggestions.app_binary_type?.length > 0)
    ? suggestions.app_binary_type
    : DEFAULT_OPTIONS.app_binary_type;

  const suppliers = (suggestions.supplier?.length > 0)
    ? suggestions.supplier
    : DEFAULT_OPTIONS.supplier;

  return (
    <div className="container mt-4">
      <h2 className="text-warning mb-4">Advanced SBOM Search</h2>
      
      <div className="bg-dark p-4 rounded mb-4 border border-secondary">
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
                {categories.map((category, idx) => (
                  <option key={idx} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label text-light">Operating System</label>
              <select
                className="form-select"
                name="operating_system"
                value={searchParams.operating_system}
                onChange={handleInputChange}
              >
                <option value="">All Operating Systems</option>
                {operatingSystems.map((os, idx) => (
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
                {binaryTypes.map((type, idx) => (
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
                {suppliers.map((supplier, idx) => (
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
                {manufacturers.map((manufacturer, idx) => (
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
          
          {activeFilters.length > 0 && (
            <div className="mt-3">
              <div className="d-flex flex-wrap gap-2">
                {activeFilters.map((filter, idx) => (
                  <span key={idx} className="badge bg-warning text-dark">{filter}</span>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
      
      {errorMessage && (
        <div className="alert alert-info">{errorMessage}</div>
      )}
      
      {isSearching ? (
        <div className="text-center my-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-light mt-3">Searching...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="bg-dark p-3 rounded border border-secondary">
          <h4 className="text-warning mb-3">Search Results ({totalResults})</h4>
          <div className="table-responsive">
            <table className="table table-dark table-hover">
              <thead>
                <tr>
                  <th>App Name</th>
                  <th>Version</th>
                  <th>Category</th>
                  <th>OS</th>
                  <th>Type</th>
                  <th>Components</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.appName || 'N/A'}</td>
                    <td>{item.appVersion || 'N/A'}</td>
                    <td>{item.category || 'N/A'}</td>
                    <td>{item.operatingSystem || 'N/A'}</td>
                    <td>{item.binaryType || 'N/A'}</td>
                    <td>{item.componentCount || 0}</td>
                    <td>
                      <Link to={`/sbom-details/${item.filename}`} className="btn btn-sm btn-outline-warning me-2">
                        View
                      </Link>
                      <Link to={`/components/${item.filename}`} className="btn btn-sm btn-outline-info">
                        Components
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      
      {!isSearching && results.length === 0 && activeFilters.length === 0 && !errorMessage && (
        <div className="text-center my-5 p-5 bg-dark rounded border border-secondary">
          <p className="text-light">Use the search filters above to find SBOMs.</p>
          <button 
            className="btn btn-outline-warning" 
            onClick={() => performSearch({ all: true })}
          >
            View All SBOMs
          </button>
        </div>
      )}
    </div>
  );
};

export default Search;
