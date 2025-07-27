// client/src/components/GamePage.jsx
import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../contexts/GameContext.jsx";
import GameBoard from "./GameBoard.jsx";
import GameOverModal from "./GameOverModal.jsx";
import TurnIndicator from "./TurnIndicator.jsx";
import RoomDisplay from "./RoomDisplay.jsx"; // Keep this import for the waiting screen
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

  // Effect to handle initial room join if user directly navigates or refreshes
  useEffect(() => {
    console.log(`[GamePage useEffect evaluation] Initial State: roomId=${roomId}, urlRoomId=${urlRoomId}, isConnected=${isConnected}, gameStatus=${gameStatus}, pathname=${window.location.pathname}`);
    const condition1 = !roomId;
    const condition2 = !!urlRoomId;
    const condition3 = isConnected;
    const condition4 = gameStatus === 'lobby';
    const condition5 = window.location.pathname === `/game/${urlRoomId}`;

    console.log(`[GamePage useEffect evaluation] Condition Breakdown:
      1. !roomId (roomId is null): ${condition1}
      2. urlRoomId exists: ${condition2}
      3. isConnected: ${condition3}
      4. gameStatus === 'lobby': ${condition4}
      5. pathname === /game/${urlRoomId}: ${condition5}`);
    console.log(`[GamePage useEffect evaluation] isInitialMount.current: ${isInitialMount.current}`);

    if (isInitialMount.current && !roomId && urlRoomId && isConnected && gameStatus === 'lobby' && condition5) {
      console.log(`[GamePage useEffect] ENTERING initial join logic for room: ${urlRoomId}`);
      joinExistingRoom(urlRoomId);
      setError(null);
      setMessage('');
    } else {
      console.log(`[GamePage useEffect] NOT entering initial join logic. isInitialMount.current: ${isInitialMount.current}, current gameStatus: ${gameStatus}`);
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

  }, [roomId, urlRoomId, isConnected, joinExistingRoom, gameStatus, setError, setMessage]);

  // Effect to navigate back to lobby if game ends or opponent leaves and room clears
  useEffect(() => {
    if (gameStatus === 'lobby' && !roomId && urlRoomId) {
      console.log(`[GamePage useEffect] Navigating to lobby due to gameStatus='lobby' and no roomId.`);
      navigate('/');
      setError(null);
      setMessage('');
    }
  }, [gameStatus, roomId, urlRoomId, navigate, setError, setMessage]);


  // Display loading or error states before attempting to render game UI
  if (!isConnected) {
    return <div className="game-page loading">Connecting to server...</div>;
  }

  // If user is on a /game/:roomId URL but not in a game yet, show joining message
  if (urlRoomId && !roomId) {
      return (
        <div className="game-page loading">
            <h2>Joining Room {urlRoomId}...</h2>
            {/* Display error here if joining fails */}
            {error && <p className="error-message">{error}</p>}
        </div>
      );
  }

  // If gameStatus is lobby but we are still on game page without a room, something is off.
  if (gameStatus === 'lobby' && !roomId) {
    console.log("[GamePage] gameStatus is 'lobby' and no roomId, navigating home.");
    navigate('/');
    return null;
  }

  // Show waiting screen if in a room but waiting for opponent
  if (gameStatus === 'waiting' && roomId) {
    return (
      <div className="game-page waiting-screen"> {/* Keep this wrapper for centering */}
        {/* GLOBAL: error component here now */}
        {error && <p className="error-message">{error}</p>}
        <RoomDisplay
          roomId={roomId}
          gameStatus={gameStatus}
          isCreator={playerIdentifier === players?.player1?.id}
          exitGameRoom={exitGameRoom}
          // REMOVED: error={error} and message={message} props, as RoomDisplay no longer displays them
        />
      </div>
    );
  }

  // If opponent left, show this screen and PREVENT any other game elements from rendering
  if (gameStatus === 'opponent-left') {
    return (
      <div className="game-page opponent-left-screen">
        <h2>Opponent Left!</h2>
        <p className="message-text">{message || 'Your opponent has disconnected.'}</p>
        <button onClick={exitGameRoom} className="btn-primary">Back to Lobby</button>
      </div>
    );
  }


  // Main game rendering when gameStatus is 'playing' or 'game-over' (and NOT 'opponent-left' or 'waiting')
  return (
    <div className="game-page">
      {/* GLOBAL: message and error components here now */}
      {message && <div className="game-message">{message}</div>} {/* Consider consolidating game-message with info-message */}
      {error && <div className="error-message">{error}</div>}

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

      {/* GameOverModal only shows if gameStatus is strictly 'game-over' AND there's a winner/draw */}
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