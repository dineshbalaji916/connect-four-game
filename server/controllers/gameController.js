// server/controllers/gameController.js

import {
  rooms, 
  createRoom,
  joinRoom,
  getRoom,
  makeMove,
  resetGame,
  removePlayerFromRoom,
} from '../logic/roomManager.js';

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
    socket.emit('waiting'); 
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
    if (room.status !== 'waiting') { 
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

    socket.emit('room-joined', {
      roomId,
      playerIdentifier,
      playersInRoom: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, isBot: p.isBot }))
    });

    const creatorPlayer = room.players.find(p => p.id !== playerIdentifier); 
    if (creatorPlayer && creatorPlayer.socketId) {
        io.to(creatorPlayer.socketId).emit('opponent-joined', { roomId, opponentId: playerIdentifier });
    } else {
        console.warn(`handleJoinRoom Warning: Could not find creator's socket to emit 'opponent-joined' in room ${roomId}.`);
    }

    room.status = 'playing'; 
    io.to(roomId).emit('start-game', {
      currentTurn: room.currentTurn,
      board: room.board,
      players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, isBot: p.isBot }))
    });
    console.log(`Game started in room ${roomId}.`);

  } catch (error) {
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

    if (!result) { 
      console.error(`handleMove Error: makeMove returned null for room ${roomId}, player ${playerInRoom.id}, column ${column}`);
      socket.emit('error', { message: 'Invalid move. Please choose another column.' });
      return;
    }

    io.to(roomId).emit('move-made', {
      board: room.board,
      currentTurn: room.currentTurn,
      lastMove: { row: result.row, column: column, playerId: playerInRoom.id } 
    });

    if (result.winner) {
      io.to(roomId).emit('game-over', { winnerId: result.winner, board: room.board, scores: room.players.map(p => ({ id: p.id, score: p.score })) });
      room.status = 'game-over';
      console.log(`Room ${roomId}: ${result.winner} wins!`);
    } else if (result.draw) {
      io.to(roomId).emit('game-over', { draw: true, board: room.board, scores: room.players.map(p => ({ id: p.id, score: p.score })) });
      room.status = 'game-over';
      console.log(`Room ${roomId}: Draw!`);
    }
  } catch (error) {
    console.error(`handleMove Uncaught Error for room ${roomId}, column ${column}:`, error);
    socket.emit('error', { message: 'An error occurred during your move.' });
  }
}

export function handleReplayGame(socket, roomId, io) {
  try {
    const room = getRoom(roomId);
    if (!room) {
      console.error(`[Replay Debug] Room ${roomId} not found for replay request from ${socket.id}.`);
      socket.emit('error', { message: 'Room not found for replay.' });
      return;
    }
    if (room.status !== 'game-over' && room.status !== 'playing') {
        console.warn(`[Replay Debug] Replay attempt in room ${roomId} while status is ${room.status}.`);
        socket.emit('error', { message: 'Cannot replay a game that is not over or currently playing.' });
        return;
    }

    const requestingPlayer = room.players.find(p => p.socketId === socket.id);
    if (!requestingPlayer) {
        console.error(`[Replay Debug] Player ${socket.id} not found in room ${roomId} for replay request.`);
        socket.emit('error', { message: 'You are not part of this game.' });
        return;
    }

    resetGame(roomId);
    console.log(`[Replay Debug] Game in room ${roomId} successfully reset.`);

    io.to(roomId).emit('game-restarted', {
        board: room.board,
        currentTurn: room.currentTurn,
        players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, isBot: p.isBot }))
    });
    console.log(`Room ${roomId} restarted for replay.`);
  } catch (error) {
    console.error('[Replay Debug] Error replaying game:', error);
    socket.emit('error', { message: 'An error occurred while trying to replay the game.' });
  }
}

export function handlePlayerDisconnect(socket, io) {
    for (const roomId of Object.keys(rooms)) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);

        if (playerIndex !== -1) {
            console.log(`Player ${socket.id} disconnected from room ${roomId}`);
            removePlayerFromRoom(roomId, socket.id);

            if (room.players.length === 1) {
                const remainingPlayer = room.players[0];
                if (!remainingPlayer.isBot) {
                    console.log(`Notifying remaining player ${remainingPlayer.socketId} in room ${roomId} that opponent left.`);
                    io.to(remainingPlayer.socketId).emit('opponent-disconnected', { message: 'Your opponent has left the game.' });
                    room.status = 'opponent-left';
                } else {
                    console.log(`Room ${roomId} deleted as human player left bot game.`);
                    delete rooms[roomId];
                }
            } else if (room.players.length === 0) {
                console.log(`Room ${roomId} deleted as no players remain.`);
                delete rooms[roomId];
            } else if (room.players.length === 2 && room.players.some(p => p.isBot)) {
                console.log(`Human player disconnected from bot game ${roomId}. Deleting room.`);
                delete rooms[roomId];
            }
            break;
        }
    }
}
