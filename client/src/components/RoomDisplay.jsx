import React, { useState, useEffect } from 'react';
import './../styles/RoomDisplay.css';

const RoomDisplay = ({ roomId, message, isCreator, gameStatus }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const [roomUrl, setRoomUrl] = useState('');

  useEffect(() => {
    // Dynamically set the room URL based on current window location
    if (roomId) {
      setRoomUrl(`${window.location.origin}/game/${roomId}`);
    }
  }, [roomId]);

  const handleCopy = () => {
    if (roomUrl) {
      navigator.clipboard.writeText(roomUrl).then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      }).catch(err => {
        setCopySuccess('Failed to copy');
        console.error('Failed to copy URL:', err);
      });
    }
  };

  return (
    <div className="room-display">
      {gameStatus === 'waiting' && (
        <>
          <h2>{message || "Waiting for opponent to join..."}</h2>
          <p>Room ID: <strong>{roomId}</strong></p>
          <button onClick={handleCopy} className="copy-button">
            Copy Room Link
          </button>
          {copySuccess && <span className="copy-feedback">{copySuccess}</span>}
          {isCreator && <p className="hint">Share this link or ID with a friend to play!</p>}
        </>
      )}
      {gameStatus === 'opponent-left' && (
          <div className="opponent-left-message">
              <h2>Opponent Disconnected</h2>
              <p>{message || "Your opponent has left the game. You can go back to the home page to start a new game."}</p>
              {/* No replay/exit buttons here as GamePage handles navigation based on gameStatus */}
          </div>
      )}
    </div>
  );
};

export default RoomDisplay;