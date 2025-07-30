import React from 'react';
import './../styles/RoomDisplay.css';

const RoomDisplay = ({ roomId, isCreator, gameStatus, exitGameRoom }) => {
  return (
    <div className="room-display card">
      {gameStatus === 'waiting' && (
        <>
          <h2>Waiting for an opponent...</h2>
          <p className="room-id-text">Room ID: <strong>{roomId}</strong></p>
          {isCreator && <p className="hint">Share this ID with a friend to play!</p>}
          <button onClick={exitGameRoom} className="btn-primary">Leave Room</button>
        </>
      )}
    </div>
  );
};

export default RoomDisplay;
