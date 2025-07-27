import React from 'react';
import GameCell from './GameCell.jsx'; // Ensure .jsx extension
import './../styles/GameBoard.css'; // Ensure path is correct

const GameBoard = ({ board, onCellClick, gameStatus, currentTurn, playerIdentifier }) => {
  return (
    <div className="game-board">
      {board.map((column, colIndex) => (
        <div
          key={colIndex}
          className="game-column"
          onClick={() => {
            // Only allow clicks if the game is playing, and it's the current player's turn
            // and if the column is not full (i.e., column.length < 6 for a 6-row board)
            if (gameStatus === 'playing' && currentTurn === playerIdentifier && column.length < 6) {
              onCellClick(colIndex); // Use onCellClick here
            }
          }}
        >
          {/*
            To make disks appear to stack from the bottom:
            1. Iterate from the top row (index 5) down to the bottom row (index 0).
            2. For each visual row, check if there's a disk in the backend's column array
               at that corresponding index.
          */}
          {Array(6).fill(null).map((_, visualRowIndex) => {
            // `visualRowIndex` goes from 0 (top of the rendered column) to 5 (bottom of rendered column).
            // However, our backend `column` array has index 0 as the bottom-most disk, and index 5 as the top-most.
            // So, to display visual row 0 (top), we need to check backend column index 5.
            // To display visual row 5 (bottom), we need to check backend column index 0.
            // The mapping is: backend_array_index = 5 - visual_row_index.
            const backendColumnIndex = 5 - visualRowIndex;
            const cellValue = column[backendColumnIndex] || null; // Get value from backend's column array

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