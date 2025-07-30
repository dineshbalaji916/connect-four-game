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
  const [error, setError] = useState(null);

  const getPlayerName = useCallback((id, currentPlayersArray = players) => {
    if (!Array.isArray(currentPlayersArray)) {
        currentPlayersArray = [];
    }
    const player = currentPlayersArray.find(p => p.id === id);
    return player ? player.name : `Unknown Player (${id})`;
  }, [players]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = ({ roomId, playerIdentifier }) => {
      setRoomId(roomId);
      setPlayerIdentifier(playerIdentifier);
      setGameStatus('waiting');
      setMessage('Room created. Waiting for an opponent...');
      setError(null);
    };

    const handleRoomJoined = ({ roomId, playerIdentifier, playersInRoom }) => {
      setRoomId(roomId);
      setPlayerIdentifier(playerIdentifier);
      setPlayers(playersInRoom);
      setGameStatus('playing');
      setMessage('You joined the room.');
      setError(null);
    };

    const handleWaiting = () => {
      setGameStatus('waiting');
      setMessage('Waiting for opponent...');
      setError(null);
    };

    const handleStartGame = ({ currentTurn, board, players: initialPlayers }) => {
      setBoard(board);
      setCurrentTurn(currentTurn);
      setPlayers(initialPlayers);
      setGameStatus('playing');
      setMessage('Game started!');
      setWinner(null);
      setError(null);
    };

    const handleMoveMade = ({ board, currentTurn }) => {
      setBoard(board);
      setCurrentTurn(currentTurn);
      setMessage('');
      setError(null);
    };

    const handleGameOver = ({ winnerId, board, draw, scores }) => {
      setBoard(board);
      setGameStatus('game-over');
      setWinner(draw ? 'draw' : winnerId);
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          const scoreInfo = scores.find(s => s.id === p.id);
          return scoreInfo ? { ...p, score: scoreInfo.score } : p;
        })
      );
      setMessage(draw ? "It's a draw!" : `Game Over! ${getPlayerName(winnerId, players)} wins!`);
      setError(null);
    };

    const handleOpponentLeft = ({ message: msg }) => {
      setGameStatus('opponent-left');
      setMessage(msg || 'Your opponent has disconnected.');
      setError(null);
      setWinner(null);
      setBoard([]);
      setCurrentTurn(null);
    };

    const handleGameError = ({ message }) => {
      setError(message);
      setMessage('');
    };

    const handleGameRestarted = ({ board, currentTurn, players: updatedPlayers }) => {
      setBoard(board);
      setCurrentTurn(currentTurn);
      setPlayers(updatedPlayers);
      setGameStatus('playing');
      setWinner(null);
      setMessage('Game restarted!');
      setError(null);
    };

    const handleResetGame = () => {
      setRoomId(null);
      setPlayerIdentifier(null);
      setPlayers([]);
      setBoard([]);
      setCurrentTurn(null);
      setGameStatus('lobby');
      setWinner(null);
      setMessage('');
      setError(null);
    };

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

  const createNewRoom = useCallback(() => {
    if (socket && isConnected) {
      setError(null);
      emit('create-room');
    } else {
      setError('Cannot create room: Not connected to server.');
    }
  }, [socket, isConnected, emit]);

  const joinExistingRoom = useCallback((id) => {
    if (socket && isConnected) {
      setError(null);
      emit('join-room', id);
    } else {
      setError('Cannot join room: Not connected to server.');
    }
  }, [socket, isConnected, emit]);

  const makeGameMove = useCallback((col) => {
    if (socket && isConnected && roomId && gameStatus === 'playing') {
      emit('make-move', { roomId, column: col });
    } else {
      if (!isConnected) setError('Not connected to server.');
      else if (!roomId) setError('Not in a game room.');
      else if (gameStatus !== 'playing') setError('Game is not in playing state.');
    }
  }, [socket, isConnected, roomId, gameStatus, emit]);

  const requestReplay = useCallback(() => {
    if (socket && isConnected && roomId) {
      emit('request-replay', { roomId });
    } else {
      setError('Cannot request replay: Not in an active game or not connected.');
    }
  }, [socket, isConnected, roomId, emit]);

  const exitGameRoom = useCallback(() => {
    if (socket && isConnected && roomId) {
      emit('exit-room', { roomId });
    } else {
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
  }, [socket, isConnected, roomId, emit]);

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
