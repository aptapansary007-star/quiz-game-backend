const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const RoomManager = require('./game/roomManager');
const GameLogic = require('./game/gameLogic');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize managers
const roomManager = new RoomManager();
const gameLogic = new GameLogic();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Quiz Game Backend Running!',
    timestamp: new Date().toISOString(),
    activeRooms: roomManager.getActiveRoomsCount()
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create new room
  socket.on('create-room', (data) => {
    try {
      const { playerName, betAmount = 0 } = data;
      const room = roomManager.createRoom(socket.id, playerName, betAmount);
      
      socket.join(room.id);
      socket.emit('room-created', {
        roomId: room.id,
        playerName: playerName,
        players: room.players
      });
      
      console.log(`Room created: ${room.id} by ${playerName}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Join existing room
  socket.on('join-room', (data) => {
    try {
      const { roomId, playerName, betAmount = 0 } = data;
      const room = roomManager.joinRoom(roomId, socket.id, playerName, betAmount);
      
      if (room) {
        socket.join(roomId);
        
        // Notify all players in room
        io.to(roomId).emit('player-joined', {
          players: room.players,
          newPlayer: playerName
        });
        
        socket.emit('room-joined', {
          roomId: roomId,
          players: room.players
        });
        
        console.log(`${playerName} joined room: ${roomId}`);
      } else {
        socket.emit('error', { message: 'Room not found or full' });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Start game
  socket.on('start-game', (data) => {
    try {
      const { roomId } = data;
      const room = roomManager.getRoom(roomId);
      
      if (room && room.players.length >= 2 && room.status === 'waiting') {
        room.status = 'countdown';
        
        // Start countdown
        let countdown = 5;
        io.to(roomId).emit('game-starting', { countdown });
        
        const countdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            io.to(roomId).emit('game-starting', { countdown });
          } else {
            io.to(roomId).emit('game-starting', { countdown: 0 }); // ✅ FIXED: 0 broadcast
            clearInterval(countdownInterval);
            startGameplay(roomId);
          }
        }, 1000);
        
        console.log(`Game starting in room: ${roomId}`);
      } else {
        socket.emit('error', { message: 'Cannot start game' });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Submit answer
  socket.on('submit-answer', (data) => {
    try {
      const { roomId, answer, timeTaken } = data;
      const room = roomManager.getRoom(roomId);
      
      if (room && room.status === 'playing') {
        const isCorrect = gameLogic.checkAnswer(room.currentQuestion, answer);
        
        // Update player score
        const player = room.players.find(p => p.id === socket.id);
        if (player && isCorrect) {
          player.score++;
        }
        
        // Send result to player
        socket.emit('answer-result', {
          isCorrect,
          correctAnswer: room.currentQuestion.correct,
          playerAnswer: answer,
          newScore: player ? player.score : 0
        });
        
        // Send next question after delay
        setTimeout(() => {
          if (room.status === 'playing') {
            const question = gameLogic.generateQuestion();
            room.currentQuestion = question;
            room.questionNumber++;
            
            io.to(roomId).emit('new-question', {
              question: question.question,
              options: question.options,
              questionNumber: room.questionNumber
            });
          }
        }, 500);
        
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Find and remove player from any room
    const rooms = roomManager.getAllRooms();
    rooms.forEach(room => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const playerName = room.players[playerIndex].name;
        room.players.splice(playerIndex, 1);
        
        // Notify remaining players
        if (room.players.length > 0) {
          io.to(room.id).emit('player-left', {
            players: room.players,
            leftPlayer: playerName
          });
        } else {
          // Remove empty room
          roomManager.removeRoom(room.id);
        }
      }
    });
  });

  // Function to start actual gameplay
  function startGameplay(roomId) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    
    room.status = 'playing';
    room.gameTimer = 30;
    room.questionNumber = 1;
    
    // Generate first question
    const question = gameLogic.generateQuestion();
    room.currentQuestion = question;
    
    // Send first question
    io.to(roomId).emit('game-started', {
      question: question.question,
      options: question.options,
      gameTimer: room.gameTimer,
      questionNumber: room.questionNumber
    });
    
    // Start game timer
    const gameInterval = setInterval(() => {
      room.gameTimer--;
      
      io.to(roomId).emit('timer-update', { timeLeft: room.gameTimer });
      
      if (room.gameTimer <= 0) {
        clearInterval(gameInterval);
        endGame(roomId);
      }
    }, 1000);
    
    // Store interval reference
    room.gameInterval = gameInterval;
  }

  // Function to end game
  function endGame(roomId) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    
    room.status = 'finished';
    
    // Calculate results
    const results = gameLogic.calculateResults(room.players);
    
    // Send results to all players
    io.to(roomId).emit('game-ended', {
      results,
      players: room.players
    });
    
    console.log(`Game ended in room: ${roomId}`, results);
    
    // Clean up room after 30 seconds
    setTimeout(() => {
      roomManager.removeRoom(roomId);
    }, 30000);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Quiz Game Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
