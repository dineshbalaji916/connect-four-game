import React from 'react';
import './../styles/GameOverModal.css';

const GameOverModal = ({ winnerId, isDraw, playerIdentifier, players, onExit, onReplay, getPlayerName }) => {
  let message;
  let resultClass = '';

  if (isDraw) {
    message = "It's a Draw!";
    resultClass = 'draw';
  } else if (winnerId === playerIdentifier) {
    message = "You Win!";
    resultClass = 'win';
  } else {
    message = `${getPlayerName(winnerId)} Wins!`;
    resultClass = 'lose';
  }

  return (
    <div className="game-over-modal-overlay">
      <div className="game-over-modal-content">
        <h2>Game Over!</h2>
        <p className={`result-message ${resultClass}`}>{message}</p>
        <div className="modal-actions">
          <button onClick={onReplay} className="replay-button">Replay</button>
          <button onClick={onExit} className="exit-button">Exit</button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
