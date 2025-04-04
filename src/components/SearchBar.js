import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');

  const handleSearch = () => {
    if (!keyword.trim()) return;
    onSearch(keyword);
  };

  return (
    <div className="d-flex flex-column flex-md-row align-items-center gap-2 mb-4">
      <input
        type="text"
        className="form-control"
        placeholder="Search keyword (e.g., openssl)"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <button className="btn btn-primary w-100 w-md-auto" onClick={handleSearch}>
        Search
      </button>
    </div>
  );
};

export default SearchBar;

