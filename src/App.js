import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Search from './pages/Search';
import Compare from './pages/Compare';
import SBOMDetails from './pages/SBOMDetails';
import Statistics from './pages/Statistics';

function App() {
  return (
    <Router>
      <div className="bg-dark text-light min-vh-100">
        <header className="bg-black py-3 shadow-sm mb-4">
          <div className="container d-flex justify-content-between align-items-center">
            <h2 className="text-warning m-0">SBOM Finder</h2>
            <nav>
              <Link className="btn btn-outline-light mx-1" to="/">Home</Link>
              <Link className="btn btn-outline-light mx-1" to="/upload">Upload</Link>
              <Link className="btn btn-outline-light mx-1" to="/search">Search</Link>
              <Link className="btn btn-outline-light mx-1" to="/compare">Compare</Link>
              <Link className="btn btn-outline-light mx-1" to="/statistics">Statistics</Link>
            </nav>
          </div>
        </header>

        <main className="container mb-5">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/search" element={<Search />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/sbom-details/:filename" element={<SBOMDetails />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
