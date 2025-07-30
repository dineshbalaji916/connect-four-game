import React from 'react';
import './../styles/TurnIndicator.css';

const TurnIndicator = ({ currentTurn, playerIdentifier, players, getPlayerName }) => {
  let turnMessage = '';
  let turnClass = '';

  if (!currentTurn || players.length === 0) {
    turnMessage = 'Game starting...';
  } else if (currentTurn === playerIdentifier) {
    turnMessage = "Your Turn!";
    turnClass = 'your-turn';
  } else {
    turnMessage = `${getPlayerName(currentTurn)}'s Turn`;
    turnClass = 'opponent-turn';
  }

  return (
    <div className={`turn-indicator ${turnClass}`}>
      <h3>{turnMessage}</h3>
    </div>
  );
};

export default TurnIndicator;