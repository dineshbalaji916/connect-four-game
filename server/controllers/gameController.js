// server/controllers/gameController.js

import {
  rooms, // Directly access rooms for disconnect cleanup
  createRoom,
  joinRoom,
  getRoom,
  makeMove,
  resetGame,
  addBotPlayer,
  removePlayerFromRoom,
} from '../logic/roomManager.js';
import { ConnectFourAI } from '../logic/aiLogic.js';

// Helper to emit game state to a room (can be called by multiple handlers)
function emitGameStateUpdate(io, roomId) {
    const room = getRoom(roomId);
    if (room) {
        io.to(roomId).emit('game-state-update', {
            board: room.board,
            currentTurn: room.currentTurn,
            players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, isBot: p.isBot })),
            status: room.status,
            lastMove: room.lastMove,
        });
    }
}

export function handleCreateRoom(socket, io) {
  try {
    const { roomId, playerIdentifier } = createRoom(socket.id);
    socket.join(roomId);
    socket.emit('room-created', { roomId, playerIdentifier });
    console.log(`Room ${roomId} created by ${socket.id} (Player: ${playerIdentifier})`);
    socket.emit('waiting'); // Tell creator to wait
  } catch (error) {
    console.error('Error creating room:', error.message);
    socket.emit('error', { message: 'Failed to create room.' });
  }
}

export function handleJoinRoom(socket, roomId, io) {
  try {
    const room = getRoom(roomId);
    if (!room) {
      console.error(`handleJoinRoom Error: Room ${roomId} not found for socket ${socket.id}`);
      socket.emit('error', { message: 'Room not found.' });
      return;
    }
    if (room.status !== 'waiting') { // Ensure room is in a joinable state
        console.error(`handleJoinRoom Error: Room ${roomId} is not in waiting state. Current status: ${room.status}`);
        socket.emit('error', { message: 'Room is already full or game has started.' });
        return;
    }
    if (room.players.some(p => p.socketId === socket.id)) {
        console.warn(`handleJoinRoom Warning: Socket ${socket.id} tried to join room ${roomId} but is already in it.`);
        socket.emit('error', { message: 'You are already in this room.' });
        return;
    }

    const { success, playerIdentifier } = joinRoom(roomId, socket.id);
    if (!success) {
      console.error(`handleJoinRoom Error: joinRoom function failed for room ${roomId}, socket ${socket.id}`);
      socket.emit('error', { message: 'Failed to join room. Room might be full or in invalid state.' });
      return;
    }

    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId} (Player: ${playerIdentifier})`);

    // Inform the joining player
    // Ensure players are formatted as an array of objects here, matching client's expectation
    socket.emit('room-joined', {
      roomId,
      playerIdentifier,
      playersInRoom: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, isBot: p.isBot }))
    });

    // Inform the other player in the room (the creator)
    const creatorPlayer = room.players.find(p => p.id !== playerIdentifier); // Find the other player
    if (creatorPlayer && creatorPlayer.socketId) {
        io.to(creatorPlayer.socketId).emit('opponent-joined', { roomId, opponentId: playerIdentifier });
    } else {
        console.warn(`handleJoinRoom Warning: Could not find creator's socket to emit 'opponent-joined' in room ${roomId}.`);
    }

    // Game starts when 2 players are in a room
    room.status = 'playing'; // Update status in manager
    io.to(roomId).emit('start-game', {
      currentTurn: room.currentTurn,
      board: room.board,
      players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, isBot: p.isBot }))
    });
    console.log(`Game started in room ${roomId}.`);

  } catch (error) {
    // Log the actual error object for more detail
    console.error(`handleJoinRoom Uncaught Error for room ${roomId}:`, error);
    socket.emit('error', { message: 'An error occurred while trying to join the room.' });
  }
}

export function handleMove(socket, data, io) {
  const { roomId, column } = data;
  try {
    const room = getRoom(roomId);

    if (!room) {
      console.error(`handleMove Error: Room ${roomId} not found for socket ${socket.id}`);
      socket.emit('error', { message: 'Game not active or room not found.' });
      return;
    }
    if (room.status !== 'playing') {
      console.error(`handleMove Error: Game in room ${roomId} is not in playing state. Current status: ${room.status}`);
        socket.emit('error', { message: 'Game is not in playing state.' });
        return;
    }

    const playerInRoom = room.players.find(p => p.socketId === socket.id);
    if (!playerInRoom || room.currentTurn !== playerInRoom.id) {
      console.error(`handleMove Error: Not player's turn or player not in game. Room: ${roomId}, Player: ${playerInRoom?.id}, Turn: ${room.currentTurn}`);
      socket.emit('error', { message: 'It is not your turn or you are not in this game.' });
      return;
    }

    const result = makeMove(roomId, playerInRoom.id, column);

    if (!result) { // Invalid move (e.g., column full, out of bounds)
      console.error(`handleMove Error: makeMove returned null for room ${roomId}, player ${playerInRoom.id}, column ${column}`);
      socket.emit('error', { message: 'Invalid move. Please choose another column.' });
      return;
    }

    // Emit board update and turn change
    io.to(roomId).emit('move-made', {
      board: room.board,
      currentTurn: room.currentTurn,
      lastMove: { row: result.row, column: column, playerId: playerInRoom.id } // Pass exact row for animation
    });

    if (result.winner) {
      io.to(roomId).emit('game-over', { winnerId: result.winner, board: room.board, scores: room.players.map(p => ({ id: p.id, score: p.score })) });
      room.status = 'game-over';
      console.log(`Room ${roomId}: ${result.winner} wins!`);
    } else if (result.draw) {
      io.to(roomId).emit('game-over', { draw: true, board: room.board, scores: room.players.map(p => ({ id: p.id, score: p.score })) });
      room.status = 'game-over';
      console.log(`Room ${roomId}: Draw!`);
    } else {
      // If it's a bot's turn, trigger bot move after a short delay
      const nextPlayer = room.players.find(p => p.id === room.currentTurn);
      if (nextPlayer && nextPlayer.isBot) {
          setTimeout(() => {
              const humanPlayerId = room.players.find(p => !p.isBot)?.id;
              const botMoveColumn = ConnectFourAI.getBestMove(room.board, nextPlayer.id, humanPlayerId);
              if (botMoveColumn !== null) {
                  // Recursively call handleMove for the bot's move
                  // Note: `socket` here is the human player's socket, but the move
                  // is for the bot. This is fine because `makeMove` uses the player ID.
                  // For a bot's move, you might want to consider passing a "dummy" socket or ensure
                  // that makeMove can handle a null socket for bot's turn, or pass the bot's "socket"
                  // if your bot had a conceptual socket. For this structure, using the human's
                  // socket as a placeholder to call handleMove is generally okay, as the actual
                  // validation in handleMove relies on player ID and room state.
                  handleMove(socket, { roomId, column: botMoveColumn }, io);
              } else {
                  console.warn(`Bot in room ${roomId} could not find a valid move.`);
              }
          }, 700); // Simulate bot "thinking" time
      }
    }
  } catch (error) {
    console.error(`handleMove Uncaught Error for room ${roomId}, column ${column}:`, error); // IMPORTANT: Log the actual error object
    socket.emit('error', { message: 'An error occurred during your move.' });
  }
}

export function handleReplayGame(socket, roomId, io) {
  // --- ADDED DEBUG LOGS HERE ---
  console.log(`[Replay Debug] handleReplayGame called by ${socket.id} for room ${roomId}`);
  // --- END ADDED DEBUG LOGS ---

  try {
    const room = getRoom(roomId);
    if (!room) {
      console.error(`[Replay Debug] Room ${roomId} not found for replay request from ${socket.id}.`); // More specific log
      socket.emit('error', { message: 'Room not found for replay.' });
      return;
    }
    if (room.status !== 'game-over' && room.status !== 'playing') { // Allow replay if game just ended or if someone wants to restart an active game (e.g. against bot)
        console.warn(`[Replay Debug] Replay attempt in room ${roomId} while status is ${room.status}.`); // Warn for unexpected status
        socket.emit('error', { message: 'Cannot replay a game that is not over or currently playing.' });
        return;
    }
    // Ensure the request comes from a player in the room
    const requestingPlayer = room.players.find(p => p.socketId === socket.id);
    if (!requestingPlayer) {
        console.error(`[Replay Debug] Player ${socket.id} not found in room ${roomId} for replay request.`); // Specific player log
        socket.emit('error', { message: 'You are not part of this game.' });
        return;
    }

    resetGame(roomId); // Logic to reset board, assign new turn, keep scores
    console.log(`[Replay Debug] Game in room ${roomId} successfully reset.`); // Log after reset

    io.to(roomId).emit('game-restarted', {
        board: room.board,
        currentTurn: room.currentTurn,
        players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, isBot: p.isBot }))
    });
    console.log(`Room ${roomId} restarted for replay.`);

    // If bot's turn first after reset, trigger bot move
    const currentPlayer = room.players.find(p => p.id === room.currentTurn);
    if (currentPlayer && currentPlayer.isBot) {
        console.log(`[Replay Debug] Bot's turn after replay in room ${roomId}. Triggering bot move.`); // Log bot move trigger
        setTimeout(() => {
            const humanPlayerId = room.players.find(p => !p.isBot)?.id;
            const botMoveColumn = ConnectFourAI.getBestMove(room.board, currentPlayer.id, humanPlayerId);
            if (botMoveColumn !== null) {
                handleMove(socket, { roomId, column: botMoveColumn }, io);
            }
        }, 700);
    }

  } catch (error) {
    console.error('[Replay Debug] Error replaying game:', error); // Log the full error object
    socket.emit('error', { message: 'An error occurred while trying to replay the game.' });
  }
}

export function handlePlayWithBot(socket, io) {
  try {
    const { roomId, playerIdentifier } = createRoom(socket.id); // Create a room for the human player
    socket.join(roomId);
    socket.emit('room-created', { roomId, playerIdentifier }); // Inform human player

    const botId = addBotPlayer(roomId); // This function will add a bot object to the room
    const room = getRoom(roomId); // Get updated room state

    // Start the game immediately
    room.status = 'playing';
    io.to(roomId).emit('start-game', {
        currentTurn: room.currentTurn,
        board: room.board,
        players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, isBot: p.isBot }))
    });
    console.log(`Bot game started in room ${roomId}. Human: ${playerIdentifier}, Bot: ${botId}`);

    // If bot's turn first, trigger bot move
    const currentPlayer = room.players.find(p => p.id === room.currentTurn);
    if (currentPlayer && currentPlayer.isBot) {
        setTimeout(() => {
            const humanPlayerId = room.players.find(p => !p.isBot)?.id;
            const botMoveColumn = ConnectFourAI.getBestMove(room.board, currentPlayer.id, humanPlayerId);
            if (botMoveColumn !== null) {
                handleMove(socket, { roomId, column: botMoveColumn }, io);
            }
        }, 700);
    }
  } catch (error) {
    console.error('Error starting bot game:', error.message);
    socket.emit('error', { message: 'Failed to start game with bot.' });
  }
}

export function handlePlayerDisconnect(socket, io) {
    // Iterate through a copy of room keys to safely delete rooms during iteration
    for (const roomId of Object.keys(rooms)) {
        const room = rooms[roomId];
        // Find if this socket was a player in this room
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);

        if (playerIndex !== -1) {
            console.log(`Player ${socket.id} disconnected from room ${roomId}`);
            const disconnectedPlayerId = room.players[playerIndex].id;

            removePlayerFromRoom(roomId, socket.id); // Update roomManager state

            // Check remaining players in the room
            if (room.players.length === 1) { // Opponent left in a 2-player game
                const remainingPlayer = room.players[0];
                if (!remainingPlayer.isBot) { // If human remains, notify them
                    console.log(`Notifying remaining player ${remainingPlayer.socketId} in room ${roomId} that opponent left.`);
                    io.to(remainingPlayer.socketId).emit('opponent-disconnected', { message: 'Your opponent has left the game.' });
                    room.status = 'opponent-left'; // Set room status to reflect disconnect
                } else { // If only bot left, delete the room
                    console.log(`Room ${roomId} deleted as human player left bot game.`);
                    delete rooms[roomId];
                }
            } else if (room.players.length === 0) { // Last player left, delete the room
                console.log(`Room ${roomId} deleted as no players remain.`);
                delete rooms[roomId];
            } else if (room.players.length === 2 && room.players.some(p => p.isBot)) {
                // This case handles when the human player (in a bot game) disconnects
                // The bot would remain, but the room should be cleaned up.
                console.log(`Human player ${disconnectedPlayerId} disconnected from bot game ${roomId}. Deleting room.`);
                delete rooms[roomId];
            }
            break; // Player found and handled, exit loop
        }
    }
}