import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const port = 3000;

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: "http://localhost:4200", // Angular dev server
        methods: ["GET", "POST"]
    }
});

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Make io available to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Join user-specific room for targeted updates
    socket.on('join-user-room', (userId: string) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
    });
});

// Initialize WebSocket service
import websocketService from './services/websocketService';
websocketService.setIO(io);

// Import and initialize routes
import initializeRoutes from './utils/endpoints/routes';
initializeRoutes(app);

server.listen(port, () => {
  console.log(`Server started on ${port}`);
});