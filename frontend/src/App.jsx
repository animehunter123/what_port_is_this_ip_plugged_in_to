import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [finalTarget, setFinalTarget] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await axios.post('http://localhost:5000/find-device', {
        final_target: finalTarget,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response ? err.response.data.error : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setFinalTarget('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="App">
      <nav className="navbar">
        <h1>Device Finder</h1>
        <button onClick={handleRefresh}>Refresh</button>
      </nav>
      <div className="search-container">
        <input
          type="text"
          value={finalTarget}
          onChange={(e) => setFinalTarget(e.target.value)}
          placeholder="Enter IP or Hostname"
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <h2>Device Found:</h2>
          <p><strong>Switch:</strong> {result.switch}</p>
          <p><strong>MAC:</strong> {result.dev_mac}</p>
          <p><strong>Port:</strong> {result.port}</p>
          <p><strong>IP:</strong> {result.dev_ip}</p>
          <p><strong>Hostname:</strong> {result.dev_hostname}</p>
        </div>
      )}
    </div>
  );
}

export default App;