// server/index.js
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import registerSocketHandlers from './socket.js'; 

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors());

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

registerSocketHandlers(io);

app.get('/', (req, res) => {
  res.send('Connect Four backend is running!');
});

httpServer.listen(PORT, () => {
  console.log(`Connect Four backend is running on port ${PORT}`);
});