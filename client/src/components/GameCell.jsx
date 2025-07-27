import React from 'react';
import './../styles/GameCell.css';

const GameCell = ({ value, isLastMove }) => {
  // Determine CSS class based on player marker (P1, P2, BOT)
  let pieceClass = '';
  if (value === 'P1') {
    pieceClass = 'piece-player-one';
  } else if (value === 'P2') {
    pieceClass = 'piece-player-two';
  } else if (value === 'BOT') {
    pieceClass = 'piece-bot';
  }

  // Add 'animate-drop' class if it's the last move (for animation)
  const animationClass = isLastMove ? 'animate-drop' : '';

  return (
    <div className="game-cell">
      <div className={`cell-hole`}>
        {value && <div className={`game-piece ${pieceClass} ${animationClass}`}></div>}
      </div>
    </div>
  );
};

export default GameCell;