import { checkWin, checkDraw } from './gameLogic.js';

export const rooms = {}; 

function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

function generateRoomId() {
  let id;
  do {
      id = Math.random().toString(36).substr(2, 6).toUpperCase();
  } while (rooms[id]); 
  return id;
}

function createEmptyBoard() {
  const numRows = 6;
  const numCols = 7;

  return Array.from({ length: numCols }, () => []); 
}

export function createRoom(socketId) {
  const roomId = generateRoomId();
  const playerOneId = generatePlayerId();
  rooms[roomId] = {
    players: [
        { id: playerOneId, socketId: socketId, name: 'Player 1', score: 0, isBot: false, marker: 'P1' }
    ],
    board: createEmptyBoard(),
    currentTurn: playerOneId, 
    status: 'waiting', 
    lastMove: null, 
    gameCounter: 0,
  };
  console.log(`Room ${roomId} created. Player 1: ${playerOneId}`);
  return { roomId, playerIdentifier: playerOneId };
}

export function joinRoom(roomId, newPlayerSocketId) { 
  const room = rooms[roomId];
  if (!room || room.players.length >= 2 || room.status !== 'waiting') {
    return { success: false };
  }

  if (room.players.some(p => p.socketId === newPlayerSocketId)) { 
      return { success: false, message: 'Player already in room' };
  }

  const playerTwoId = generatePlayerId();
  room.players.push(
      { id: playerTwoId, socketId: newPlayerSocketId, name: 'Player 2', score: 0, isBot: false, marker: 'P2' }
  );


  room.currentTurn = room.players[Math.floor(Math.random() * room.players.length)].id;
  room.status = 'playing'; 
  console.log(`Player ${newPlayerSocketId} joined room ${roomId}. Player 2: ${playerTwoId}`);
  return { success: true, playerIdentifier: playerTwoId };
}


export function removePlayerFromRoom(roomId, socketId) {
    const room = rooms[roomId];
    if (room) {
        // Filter out the disconnected player based on their socketId
        const initialPlayerCount = room.players.length;
        room.players = room.players.filter(p => p.socketId !== socketId);
        console.log(`Removed socket ${socketId} from room ${roomId}. Players remaining: ${room.players.length}`);

        // Handle room cleanup logic in gameController based on remaining players
        return true;
    }
    return false;
}

export function getRoom(roomId) {
  return rooms[roomId];
}

export function makeMove(roomId, playerId, column) {
  const room = rooms[roomId];
  if (!room || room.status !== 'playing' || room.currentTurn !== playerId) {
      console.warn(`Invalid move attempt for room ${roomId} by ${playerId}. Status: ${room?.status}, Turn: ${room?.currentTurn}`);
      return null;
  }

  const board = room.board;
  const numRows = 6;

  if (column < 0 || column >= board.length) { 
    console.error(`makeMove Error: Column ${column} is out of bounds for room ${roomId}. Board length: ${board.length}`);
    return null;
  }

  if (board[column].length >= numRows) {
    console.error(`makeMove Error: Column ${column} is full for room ${roomId}. Column length: ${board[column].length}`);
    return null;
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    console.error(`makeMove Error: Player with ID ${playerId} not found in room ${roomId}.`);
    return null;
  }
  const playerMarker = player.marker;

  board[column].push(playerMarker);
  const targetRow = board[column].length - 1;

  room.lastMove = { row: targetRow, column: column, playerId: playerId };

  try {
    const winnerId = checkWin(board, playerMarker) ? playerId : null;
    const isDraw = !winnerId && checkDraw(board);

    if (winnerId) {
        room.players.find(p => p.id === winnerId).score += 1;
        room.status = 'game-over';
        return { winner: winnerId, row: targetRow, column: column };
    } else if (isDraw) {
        room.status = 'game-over';
        return { draw: true, row: targetRow, column: column };
    } else {
        const nextPlayer = room.players.find(p => p.id !== playerId);
        if (!nextPlayer) {
          console.error(`makeMove Error: No next player found for room ${roomId} after ${playerId}'s move.`);
          room.status = 'game-over';
          return null;
        }
        room.currentTurn = nextPlayer.id;
        return { board: room.board, winner: null, draw: false, row: targetRow, column: column };
    }
  } catch (logicError) {
    console.error(`makeMove Error: Error during win/draw check in room ${roomId}:`, logicError);
    return null;
  }
}

export function resetGame(roomId) {
    const room = rooms[roomId];
    if (room) {
        room.board = createEmptyBoard(); 
        room.currentTurn = room.players[Math.floor(Math.random() * room.players.length)].id;
        room.status = 'playing'; 
        room.lastMove = null; 
        room.gameCounter++; 
        console.log(`Game ${room.gameCounter} started in room ${roomId}. Current turn: ${room.currentTurn}`);
        return true;
    }
    return false;
}