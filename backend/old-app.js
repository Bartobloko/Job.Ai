const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const oldApp = express();
const port = 3000;

// Create HTTP server
const server = http.createServer(oldApp);

// Setup Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: "http://localhost:4200", // Angular dev server
        methods: ["GET", "POST"]
    }
});

// Middleware to parse JSON bodies
oldApp.use(express.json());

// Middleware to parse URL-encoded bodies
oldApp.use(express.urlencoded({ extended: true }));

oldApp.use(cors());

// Make io available to routes
oldApp.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Join user-specific room for targeted updates
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
    });
});

const initializeRoutes = require('./utils/endpoints/routes');

initializeRoutes(oldApp);

server.listen(port, () => {
    console.log(`Server started on ${port}`);
});