import React from 'react'; // Removed useState, useEffect as copy feature is gone
import './../styles/RoomDisplay.css';

// Removed message, error from props destructuring
const RoomDisplay = ({ roomId, isCreator, gameStatus, exitGameRoom }) => { 
  // Removed: useState for copySuccess, roomUrl
  // Removed: useEffect for roomUrl
  // Removed: handleCopy function

  return (
    <div className="room-display card">
      {/* REMOVED: {error && <div className="error-message">{error}</div>} */}
      {/* REMOVED: {message && <div className="info-message">{message}</div>} */}

      {gameStatus === 'waiting' && (
        <>
          <h2>Waiting for an opponent...</h2>
          <p className="room-id-text">Room ID: <strong>{roomId}</strong></p>
          {/* REMOVED: Copy Room Link button and feedback */}
          {/* REMOVED: {copySuccess && <span className="copy-feedback">{copySuccess}</span>} */}

          {isCreator && <p className="hint">Share this ID with a friend to play!</p>}
          <button onClick={exitGameRoom} className="btn-primary">Leave Room</button>
        </>
      )}
    </div>
  );
};

export default RoomDisplay;