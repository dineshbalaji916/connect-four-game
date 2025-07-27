// client/src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GameProvider, useGame } from './contexts/GameContext';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';
import './styles/App.css';

const AppContent = () => {
  const {
    gameStatus,
    roomId,
    isConnected,
    error: globalError,
    message: globalMessage,
    setError, // IMPORTANT: Ensure setError is destructured
    setMessage // IMPORTANT: Ensure setMessage is destructured
  } = useGame();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If gameStatus changes to lobby and there's no active room, navigate to home.
    // This handles clean transitions back to the lobby after a game ends or is exited.
    // Only navigate if we are NOT already on the home page.
    if (gameStatus === 'lobby' && !roomId && location.pathname !== '/') {
      console.log(`[App useEffect] Navigating to / due to gameStatus=${gameStatus}, roomId=${roomId}`);
      navigate('/');
      // CRITICAL: Clear any lingering errors or messages when navigating back to home.
      setError(null);
      setMessage('');
    }
    // You might have other navigation logic here, ensure it doesn't conflict.
    // Example: If a game becomes 'playing' or 'waiting' and we're not on the game page
    if (gameStatus !== 'lobby' && gameStatus !== 'opponent-left' && roomId && location.pathname !== `/game/${roomId}`) {
        navigate(`/game/${roomId}`);
    }
  }, [gameStatus, roomId, navigate, location.pathname, setError, setMessage]);

  // Display global connection error or messages if exists
  if (!isConnected) {
    return (
      <div className="loading-screen">
        <h2>Connecting to server...</h2>
        {globalError && <p className="error-message">{globalError}</p>}
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Connect Four</h1>
      </header>
      <main>
        {globalError && (
          <div className="app-global-error">
            <p>{globalError}</p>
            <button onClick={() => setError(null)} className="clear-error-btn">X</button>
          </div>
        )}
        {globalMessage && <div className="app-global-message">{globalMessage}</div>}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="*" element={<div className="not-found"><h2>404 - Page Not Found</h2><p>The page you are looking for does not exist.</p></div>} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <Router>
    <GameProvider>
      <AppContent />
    </GameProvider>
  </Router>
);

export default App;