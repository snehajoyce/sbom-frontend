// src/pages/Generate.js
import React from 'react';
import SBOMGenerate from '../components/SBOMGenerate';

const Generate = ({ onGenerationSuccess }) => {
  return (
    <div className="container mt-4">
      <h2 className="text-warning mb-4">Generate SBOM</h2>
      <SBOMGenerate onGenerationSuccess={onGenerationSuccess} />
    </div>
  );
};

export default Generate;