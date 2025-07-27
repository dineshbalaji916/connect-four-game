import React, { useState, useEffect } from "react";
import { useGame } from "../contexts/GameContext.jsx";
import { useNavigate } from "react-router-dom";
import "./../styles/HomePage.css";

const HomePage = () => {
  const {
    roomId,
    gameStatus,
    playerIdentifier,
    players,
    createNewRoom,
    joinExistingRoom,
    exitGameRoom,
    error,
    message,
    isConnected,
  } = useGame();
  const navigate = useNavigate();
  const [inputRoomId, setInputRoomId] = useState("");

  const handleCreateRoom = () => {
    if (isConnected) {
      createNewRoom();
    } else {
      console.error("Not connected to server. Cannot create room.");
    }
  };

  const handleJoinRoom = () => {
    if (isConnected && inputRoomId.trim()) {
      joinExistingRoom(inputRoomId.trim());
    } else if (!inputRoomId.trim()) {
      alert("Please enter a Room ID to join.");
    } else {
      console.error("Not connected to server. Cannot join room.");
    }
  };

  // Ensure players is an object before calling Object.keys()
  const currentPlayersCount = players ? Object.keys(players).length : 0;


  return (
    <div className="home-page">
      <h2>Welcome to Connect Four!</h2>
      {error && <div className="error-message">{error}</div>}
      {message && <div className="info-message">{message}</div>}

      {!isConnected && (
        <div className="connection-status">
          <p>Connecting to game server...</p>
          <p>Please ensure your backend server is running.</p>
        </div>
      )}

      {/* Only show lobby controls if in 'lobby' or 'opponent-left' state (after a game) */}
      {(isConnected && (gameStatus === 'lobby' || gameStatus === 'opponent-left')) && (
        <div className="lobby-controls">
          <button onClick={handleCreateRoom} className="btn-primary">Create New Game</button>
          <div className="join-room">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              className="room-input"
            />
            <button onClick={handleJoinRoom} className="btn-secondary">Join Game</button>
          </div>
        </div>
      )}

      {/* Display room info if a room is active, but not for navigation purposes here */}
      {(gameStatus === 'waiting' || gameStatus === 'playing' || gameStatus === 'game-over') && roomId && (
        <div className="room-info">
          <p>You are in Room: <strong>{roomId}</strong></p>
          {gameStatus === 'waiting' && <p>Waiting for an opponent...</p>}
          {gameStatus === 'playing' && <p>Game in progress...</p>}
          {gameStatus === 'game-over' && <p>Game has ended.</p>}
        </div>
      )}

      {/* Provide an explicit "Start New Game" button after opponent leaves */}
      {gameStatus === 'opponent-left' && (
        <div className="post-game-options">
            <p className="info-message">Your opponent has left the game. You can start a new one.</p>
            <button onClick={exitGameRoom} className="btn-primary">Start New Game</button>
        </div>
      )}
    </div>
  );
};

export default HomePage;