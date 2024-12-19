#!/bin/bash

# Create backend directory and initialize Node.js project
mkdir backend
cd backend
npm init -y
npm install express cors

# Create backend server file (server.js)
cat << EOF > server.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.listen(port, () => {
  console.log(\`Server listening on port \${port}\`);
});
EOF

# Go back to the parent directory
cd ..

# Create frontend directory and initialize Vite React project
mkdir frontend
cd frontend
npm create vite@latest . --template react

# Install necessary packages
npm install axios

# Replace App.jsx with example code to fetch from backend
cat << EOF > src/App.jsx
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
EOF

# Configure Vite proxy to point to the backend
cat << EOF > vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5000', // Backend server
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
})
EOF


# Add start scripts to package.json files for easier running

# Backend
cd backend
npm pkg set scripts.start="node server.js"
cd ..

# Frontend
cd frontend
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="vite build"
npm pkg set scripts.preview="vite preview"
cd ..

# Move the .gitignore of both to top level in case you git init later, to already ignore ./node_modules
mv frontend/.gitignore .
mv backend/.gitignore .

echo "Project setup complete. To run:"
echo "1. In the 'backend' directory: npm run start"
echo "2. In the 'frontend' directory: npm run dev"