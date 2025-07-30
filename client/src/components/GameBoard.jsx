import React from 'react';
import GameCell from './GameCell.jsx';
import './../styles/GameBoard.css';

const GameBoard = ({ board, onCellClick, gameStatus, currentTurn, playerIdentifier }) => {
  return (
    <div className="game-board">
      {board.map((column, colIndex) => (
        <div
          key={colIndex}
          className="game-column"
          onClick={() => {
            if (gameStatus === 'playing' && currentTurn === playerIdentifier && column.length < 6) {
              onCellClick(colIndex);
            }
          }}
        >
          {Array(6).fill(null).map((_, visualRowIndex) => {
            const backendColumnIndex = 5 - visualRowIndex;
            const cellValue = column[backendColumnIndex] || null;

            return (
              <GameCell key={`${colIndex}-${visualRowIndex}`} value={cellValue} />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;
