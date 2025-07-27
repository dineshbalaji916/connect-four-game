// server/socket.js
import {
  handleCreateRoom,
  handleJoinRoom,
  handleMove,
  handleReplayGame,
  handlePlayWithBot,
  handlePlayerDisconnect
} from './controllers/gameController.js';

const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // --- ADDED DEBUG LOG HERE ---
    // This will log every event received by this specific socket
    socket.onAny((eventName, ...args) => {
        console.log(`[Socket Received] Event: ${eventName}, Data:`, args);
    });
    // --- END ADDED DEBUG LOG ---

    // Register handlers for specific events
    socket.on('create-room', () => handleCreateRoom(socket, io));
    socket.on('join-room', (roomId) => handleJoinRoom(socket, roomId, io));
    socket.on('make-move', (data) => handleMove(socket, data, io));
    socket.on('request-replay', (data) => handleReplayGame(socket, data.roomId, io)); // Adjusted to pass roomId directly
    socket.on('play-with-bot', () => handlePlayWithBot(socket, io));
    socket.on('exit-room', (data) => {
      console.log(`Player ${socket.id} intentionally exited room ${data.roomId}.`);
      handlePlayerDisconnect(socket, io);
      socket.leave(data.roomId);
      socket.emit('reset-game');
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      handlePlayerDisconnect(socket, io);
    });

    socket.on('error', (err) => {
        console.error(`Socket error for ${socket.id}:`, err);
        socket.emit('error', { message: 'A server-side error occurred.' });
    });
  });
};

export default registerSocketHandlers;