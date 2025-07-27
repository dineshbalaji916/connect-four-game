// server/index.js
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import registerSocketHandlers from './socket.js'; // Corrected: Default import of registerSocketHandlers

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors());

// Initialize Socket.IO server with CORS configuration
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", // Allow all origins for development (e.g., your React app running on localhost:5173 or similar)
    methods: ["GET", "POST"]
  }
});

// --- THIS IS THE CRUCIAL PART ---
// Register all Socket.IO event handlers for the global 'io' instance.
// This function should be called ONCE when the server starts.
// It sets up the 'connection' listener and other event listeners on the 'io' object.
registerSocketHandlers(io);
// --- END CRUCIAL PART ---


// Simple root route for testing if server is running
app.get('/', (req, res) => {
  res.send('Connect Four backend is running!');
});

// Start the HTTP server (which Socket.IO is attached to)
httpServer.listen(PORT, () => {
  console.log(`Connect Four backend is running on port ${PORT}`);
});