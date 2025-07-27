import { checkWin, checkDraw } from './gameLogic.js';

export const rooms = {}; // In-memory storage for active game rooms

// Generates a unique, persistent ID for a player within a session
function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

// Generates a unique Room ID
function generateRoomId() {
  let id;
  do {
      id = Math.random().toString(36).substr(2, 6).toUpperCase();
  } while (rooms[id]); // Ensure unique Room ID
  return id;
}

// Creates an empty Connect Four board (7 columns, each column is an array of 6 rows)
function createEmptyBoard() {
  const numRows = 6;
  const numCols = 7;
  // This creates an array of 7 columns, where each column is an empty array.
  // Disks will be pushed into these column arrays, and the frontend will render them bottom-up.
  return Array.from({ length: numCols }, () => []); // Each element is a column (an array)
}

export function createRoom(socketId) {
  const roomId = generateRoomId();
  const playerOneId = generatePlayerId();
  rooms[roomId] = {
    players: [
        { id: playerOneId, socketId: socketId, name: 'Player 1', score: 0, isBot: false, marker: 'P1' }
    ],
    board: createEmptyBoard(),
    currentTurn: playerOneId, // Player 1 starts
    status: 'waiting', // (waiting, playing, game-over, opponent-left)
    lastMove: null, // Stores {row, col, playerId} for UI animations
    gameCounter: 0, // Tracks how many games played in this room session
  };
  console.log(`Room ${roomId} created. Player 1: ${playerOneId}`);
  return { roomId, playerIdentifier: playerOneId };
}

export function joinRoom(roomId, newPlayerSocketId) { // Renamed parameter to newPlayerSocketId for clarity
  const room = rooms[roomId];
  if (!room || room.players.length >= 2 || room.status !== 'waiting') {
    return { success: false };
  }
  // Prevent same socket from joining multiple times (e.g., refresh)
  // Use newPlayerSocketId instead of socketId
  if (room.players.some(p => p.socketId === newPlayerSocketId)) { 
      return { success: false, message: 'Player already in room' };
  }

  const playerTwoId = generatePlayerId();
  room.players.push(
      { id: playerTwoId, socketId: newPlayerSocketId, name: 'Player 2', score: 0, isBot: false, marker: 'P2' }
  );

  // Randomly decide who goes first for the initial game
  room.currentTurn = room.players[Math.floor(Math.random() * room.players.length)].id;
  room.status = 'playing'; // Game starts immediately on join
  console.log(`Player ${newPlayerSocketId} joined room ${roomId}. Player 2: ${playerTwoId}`);
  return { success: true, playerIdentifier: playerTwoId };
}

export function addBotPlayer(roomId) {
    const room = rooms[roomId];
    if (!room || room.players.length >= 2 || room.players[0].isBot) {
        return null; // Cannot add bot if room is full or first player is already a bot
    }
    const botId = 'bot_' + Math.random().toString(36).substr(2, 9);
    room.players.push(
        { id: botId, socketId: null, name: 'Connect Four Bot', score: 0, isBot: true, marker: 'BOT' }
    );
    // Randomly decide who goes first
    room.currentTurn = room.players[Math.floor(Math.random() * room.players.length)].id;
    room.status = 'playing';
    console.log(`Bot ${botId} added to room ${roomId}`);
    return botId;
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

  // Check if the column is full
  if (column < 0 || column >= board.length) { // Check column bounds first
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
        room.board = createEmptyBoard(); // Reset board to 7 empty columns
        // Randomly determine who goes first for the next game (could be same player)
        room.currentTurn = room.players[Math.floor(Math.random() * room.players.length)].id;
        room.status = 'playing'; // Set status back to playing
        room.lastMove = null; // Clear last move
        room.gameCounter++; // Increment game counter
        console.log(`Game ${room.gameCounter} started in room ${roomId}. Current turn: ${room.currentTurn}`);
        return true;
    }
    return false;
}