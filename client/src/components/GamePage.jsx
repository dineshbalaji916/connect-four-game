import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../contexts/GameContext.jsx";
import GameBoard from "./GameBoard.jsx";
import GameOverModal from "./GameOverModal.jsx";
import TurnIndicator from "./TurnIndicator.jsx";
import RoomDisplay from "./RoomDisplay.jsx";
import "./../styles/GamePage.css";

const GamePage = () => {
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();
  const {
    roomId,
    playerIdentifier,
    players,
    board,
    currentTurn,
    gameStatus,
    winner,
    message,
    error,
    isConnected,
    makeGameMove,
    requestReplay,
    exitGameRoom,
    getPlayerName,
    joinExistingRoom,
    setError,
    setMessage
  } = useGame();

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current && !roomId && urlRoomId && isConnected && gameStatus === 'lobby' && window.location.pathname === `/game/${urlRoomId}`) {
      joinExistingRoom(urlRoomId);
      setError(null);
      setMessage('');
    }
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [roomId, urlRoomId, isConnected, joinExistingRoom, gameStatus, setError, setMessage]);

  useEffect(() => {
    if (gameStatus === 'lobby' && !roomId && urlRoomId) {
      navigate('/');
      setError(null);
      setMessage('');
    }
  }, [gameStatus, roomId, urlRoomId, navigate, setError, setMessage]);

  if (!isConnected) {
    return <div className="game-page loading">Connecting to server...</div>;
  }

  if (urlRoomId && !roomId) {
    return (
      <div className="game-page loading">
        <h2>Joining Room {urlRoomId}...</h2>
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }

  if (gameStatus === 'lobby' && !roomId) {
    navigate('/');
    return null;
  }

  if (gameStatus === 'waiting' && roomId) {
    return (
      <div className="game-page waiting-screen">
        {error && <p className="error-message">{error}</p>}
        <RoomDisplay
          roomId={roomId}
          gameStatus={gameStatus}
          isCreator={playerIdentifier === players?.player1?.id}
          exitGameRoom={exitGameRoom}
        />
      </div>
    );
  }

  if (gameStatus === 'opponent-left') {
    return (
      <div className="game-page opponent-left-screen">
        <h2>Opponent Left!</h2>
        <p className="message-text">{message || 'Your opponent has disconnected.'}</p>
        <button onClick={exitGameRoom} className="btn-primary">Back to Lobby</button>
      </div>
    );
  }

  return (
    <div className="game-page">

      <TurnIndicator
        currentTurn={currentTurn}
        playerIdentifier={playerIdentifier}
        gameStatus={gameStatus}
        players={players}
        getPlayerName={getPlayerName}
      />

      <GameBoard
        board={board}
        onCellClick={makeGameMove}
        gameStatus={gameStatus}
        currentTurn={currentTurn}
        playerIdentifier={playerIdentifier}
      />

      {(gameStatus === 'game-over' && winner) && (
        <GameOverModal
          winnerId={winner}
          isDraw={winner === 'draw'}
          playerIdentifier={playerIdentifier}
          players={players}
          onExit={exitGameRoom}
          onReplay={requestReplay}
          getPlayerName={getPlayerName}
          gameStatus={gameStatus}
        />
      )}
    </div>
  );
};

export default GamePage;
