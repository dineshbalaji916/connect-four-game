// client/src/contexts/GameContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket.jsx';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const { socket, isConnected, error: socketError, emit, on, off } = useSocket();

  const [roomId, setRoomId] = useState(null);
  const [playerIdentifier, setPlayerIdentifier] = useState(null);
  const [players, setPlayers] = useState([]);
  const [board, setBoard] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [gameStatus, setGameStatus] = useState('lobby');
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null); // The error state managed by this context

  // Helper function to get player name from ID
  const getPlayerName = useCallback((id, currentPlayersArray = players) => {
    if (!Array.isArray(currentPlayersArray)) {
        console.warn("getPlayerName: currentPlayersArray is not an array. Defaulting to empty array.");
        currentPlayersArray = [];
    }
    const player = currentPlayersArray.find(p => p.id === id);
    return player ? player.name : `Unknown Player (${id})`;
  }, [players]);

  // Socket status logging
  useEffect(() => {
    console.log(`[Socket Status] Socket connected: ${isConnected}, Socket ID: ${socket ? socket.id : 'N/A'}`);
  }, [isConnected, socket]);


  // Effect for handling socket events
  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = ({ roomId, playerIdentifier }) => {
      console.log('GameContext: room-created event received!', { roomId, playerIdentifier });
      setRoomId(roomId);
      setPlayerIdentifier(playerIdentifier);
      setGameStatus('waiting');
      setMessage('Room created. Waiting for an opponent...');
      setError(null);
    };

    const handleRoomJoined = ({ roomId, playerIdentifier, playersInRoom }) => {
      console.log('GameContext: room-joined event received!', { roomId, playerIdentifier, playersInRoom });
      setRoomId(roomId);
      setPlayerIdentifier(playerIdentifier);
      setPlayers(playersInRoom);
      setGameStatus('playing');
      setMessage('You joined the room.');
      setError(null);
    };

    const handleWaiting = () => {
      console.log('GameContext: waiting event received!');
      setGameStatus('waiting');
      setMessage('Waiting for opponent...');
      setError(null);
    };

    const handleStartGame = ({ currentTurn, board, players: initialPlayers }) => {
      console.log('GameContext: start-game event received!', { currentTurn, board, initialPlayers });
      setBoard(board);
      setCurrentTurn(currentTurn);
      setPlayers(initialPlayers);
      setGameStatus('playing');
      setMessage('Game started!');
      setWinner(null);
      setError(null);
    };

    const handleMoveMade = ({ board, currentTurn, lastMove }) => {
      console.log('GameContext: move-made event received!', { board, currentTurn, lastMove });
      setBoard(board);
      setCurrentTurn(currentTurn);
      setMessage('');
      setError(null);
    };

    const handleGameOver = ({ winnerId, board, draw, scores }) => {
      console.log('GameContext: game-over event received!', { winnerId, board, draw, scores });
      setBoard(board);
      setGameStatus('game-over');
      setWinner(draw ? 'draw' : winnerId);
      setPlayers(prevPlayers => {
        const updatedPlayers = prevPlayers.map(p => {
          const scoreInfo = scores.find(s => s.id === p.id);
          return scoreInfo ? { ...p, score: scoreInfo.score } : p;
        });
        return updatedPlayers;
      });
      setMessage(draw ? "It's a draw!" : `Game Over! ${getPlayerName(winnerId, players)} wins!`);
      setError(null);
    };

    const handleOpponentLeft = ({ message: msg }) => {
      console.log('GameContext: opponent-disconnected event received!', msg);
      setGameStatus('opponent-left');
      setMessage(msg || 'Your opponent has disconnected.');
      setError(null);
      setWinner(null); // Clear winner
      setBoard([]); // Clear board
      setCurrentTurn(null); // Clear current turn
    };

    const handleGameError = ({ message }) => {
      console.log('GameContext: game-error event received!', message);
      setError(message);
      setMessage('');
    };

    const handleGameRestarted = ({ board, currentTurn, players: updatedPlayers }) => {
        console.log('GameContext: game-restarted event received!', { board, currentTurn, updatedPlayers });
        setBoard(board);
        setCurrentTurn(currentTurn);
        setPlayers(updatedPlayers);
        setGameStatus('playing');
        setWinner(null);
        setMessage('Game restarted!');
        setError(null);
    };

    const handleResetGame = () => {
      console.log('[GameContext] reset-game event received! Clearing all game state.');
      setRoomId(null);
      setPlayerIdentifier(null);
      setPlayers([]);
      setBoard([]);
      setCurrentTurn(null);
      setGameStatus('lobby');
      setWinner(null);
      setMessage('');
      setError(null);
      console.log(`[GameContext] State AFTER reset: roomId=${null}, gameStatus=lobby`);
    };


    // --- Register Listeners ---
    on('room-created', handleRoomCreated);
    on('room-joined', handleRoomJoined);
    on('waiting', handleWaiting);
    on('start-game', handleStartGame);
    on('move-made', handleMoveMade);
    on('game-over', handleGameOver);
    on('opponent-left', handleOpponentLeft);
    on('error', handleGameError);
    on('game-restarted', handleGameRestarted);
    on('reset-game', handleResetGame);

    // --- Cleanup Listeners ---
    return () => {
      off('room-created', handleRoomCreated);
      off('room-joined', handleRoomJoined);
      off('waiting', handleWaiting);
      off('start-game', handleStartGame);
      off('move-made', handleMoveMade);
      off('game-over', handleGameOver);
      off('opponent-left', handleOpponentLeft);
      off('error', handleGameError);
      off('game-restarted', handleGameRestarted);
      off('reset-game', handleResetGame);
    };
  }, [socket, on, off, getPlayerName, players]);

  // Function to create a room
  const createNewRoom = useCallback(() => {
    if (socket && isConnected) {
      setError(null); // Clear any previous error before creating a room
      console.log('GameContext: Emitting create-room');
      emit('create-room');
    } else {
      console.error('Socket not connected to create room.');
      setError('Cannot create room: Not connected to server.');
    }
  }, [socket, isConnected, emit, setError]);

  // Function to join a room
  const joinExistingRoom = useCallback((id) => {
    if (socket && isConnected) {
      setError(null); // Clear any previous error before joining a room
      console.log('GameContext: Emitting join-room', id);
      emit('join-room', id);
    } else {
      console.error('Socket not connected to join room.');
      setError('Cannot join room: Not connected to server.');
    }
  }, [socket, isConnected, emit, setError]);

  // Function to make a move
  const makeGameMove = useCallback((col) => {
    if (socket && isConnected && roomId && gameStatus === 'playing') {
      console.log('GameContext: Emitting make-move', { roomId, column: col });
      emit('make-move', { roomId, column: col });
    } else {
      console.error('Cannot make move: conditions not met.', { isConnected, roomId, gameStatus });
      if (!isConnected) setError('Not connected to server.');
      else if (!roomId) setError('Not in a game room.');
      else if (gameStatus !== 'playing') setError('Game is not in playing state.');
    }
  }, [socket, isConnected, roomId, gameStatus, emit, setError]);

  // Function to request a replay
  const requestReplay = useCallback(() => {
    console.log(`[Replay Request] isConnected: ${isConnected}, socket: ${socket ? socket.id : 'N/A'}, roomId: ${roomId}`);
    if (socket && isConnected && roomId) {
      console.log('GameContext: Emitting request-replay', roomId);
      emit('request-replay', { roomId });
    } else {
      console.error('Cannot request replay: conditions not met.');
      setError('Cannot request replay: Not in an active game or not connected.');
    }
  }, [socket, isConnected, roomId, emit, setError]);

  // Function to exit room
  const exitGameRoom = useCallback(() => {
    if (socket && isConnected && roomId) {
      console.log('GameContext: Emitting exit-room', roomId);
      emit('exit-room', { roomId });
    } else {
      console.error('Cannot exit room: Not in a room or not connected.');
      // If not connected or in room, manually reset state
      setRoomId(null);
      setPlayerIdentifier(null);
      setPlayers([]);
      setBoard([]);
      setCurrentTurn(null);
      setGameStatus('lobby');
      setWinner(null);
      setMessage('');
      setError(null);
    }
  }, [socket, isConnected, roomId, emit, setError, setMessage]);


  const value = {
    roomId,
    playerIdentifier,
    players,
    board,
    currentTurn,
    gameStatus,
    winner,
    message,
    error: socketError || error,
    isConnected,
    createNewRoom,
    joinExistingRoom,
    makeGameMove,
    requestReplay,
    exitGameRoom,
    getPlayerName,
    setError,
    setMessage
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};