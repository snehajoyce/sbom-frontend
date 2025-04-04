import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SBOMCompare = () => {
  const [sboms, setSboms] = useState([]);
  const [sbom1, setSbom1] = useState('');
  const [sbom2, setSbom2] = useState('');
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5001/api/sboms')
      .then(res => setSboms(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleCompare = async () => {
    if (!sbom1 || !sbom2 || sbom1 === sbom2) {
      alert('Please select two different SBOMs to compare.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/compare', {
        file1: sbom1,
        file2: sbom2,
      });
      setComparison(response.data);
    } catch (error) {
      console.error(error);
      alert('Comparison failed.');
    }
  };

  return (
    <div className="mt-5 p-4 border rounded bg-light shadow-sm">
      <h2 className="mb-4 text-dark">Compare SBOM Files</h2>
      <div className="d-flex flex-column flex-md-row align-items-center gap-3">
        <select
          className="form-select"
          value={sbom1}
          onChange={e => setSbom1(e.target.value)}
        >
          <option value="">Select SBOM 1</option>
          {sboms.map((sbom, i) => (
            <option key={i} value={sbom}>
              {sbom}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={sbom2}
          onChange={e => setSbom2(e.target.value)}
        >
          <option value="">Select SBOM 2</option>
          {sboms.map((sbom, i) => (
            <option key={i} value={sbom}>
              {sbom}
            </option>
          ))}
        </select>

        <button className="btn btn-warning" onClick={handleCompare}>
          Compare
        </button>
      </div>

      {comparison && (
        <div className="mt-4">
          <h4 className="text-success">Only in {sbom1}:</h4>
          <ul className="list-group mb-3">
            {comparison.only_in_first.map((item, idx) => (
              <li className="list-group-item" key={idx}>
                <code>{JSON.stringify(item)}</code>
              </li>
            ))}
          </ul>

          <h4 className="text-danger">Only in {sbom2}:</h4>
          <ul className="list-group">
            {comparison.only_in_second.map((item, idx) => (
              <li className="list-group-item" key={idx}>
                <code>{JSON.stringify(item)}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SBOMCompare