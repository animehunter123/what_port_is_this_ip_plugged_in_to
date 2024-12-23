import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/hello'); // Proxy will handle this
        setMessage(response.data.message);
      } catch (error) {
        console.error('Error fetching message:', error);
        setMessage('Error fetching message from backend');
      }
    };

    fetchMessage();
  }, []);

  return (
    <div className="App">
      <h1>{message}</h1>
    </div>
  );
}

export default App;
