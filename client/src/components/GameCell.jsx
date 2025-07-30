import React from 'react';
import './../styles/GameCell.css';

const GameCell = ({ value, isLastMove }) => {
  let pieceClass = '';
  if (value === 'P1') {
    pieceClass = 'piece-player-one';
  } else if (value === 'P2') {
    pieceClass = 'piece-player-two';
  }

  const animationClass = isLastMove ? 'animate-drop' : '';

  return (
    <div className="game-cell">
      <div className="cell-hole">
        {value && <div className={`game-piece ${pieceClass} ${animationClass}`}></div>}
      </div>
    </div>
  );
};

export default GameCell;
