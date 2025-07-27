import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Note: .js extension is good practice in Vite for JS files
import './styles/index.css'; // Global CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);