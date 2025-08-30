const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const winston = require('winston');
const RoomManager = require('./game/roomManager');
const GameLogic = require('./game/gameLogic');
const { isValidPlayerName, isValidRoomId } = require('./utils/helpers');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["https://cashearnersofficial.xyz/quiz-game-frontend/index.html"], // Update to your frontend domain
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Logger
const logger = winston.createLogger({
    transports: [
        new winston.transports.File({ filename: 'game.log' }),
        new winston.transports.Console()
    ]
});

// Middleware
app.use(cors());
app.use(express.json());

// Managers
const roomManager = new RoomManager();
const gameLogic = new GameLogic();

// In-memory leaderboard (MongoDB-ready)
let leaderboard = [];

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Premium Quiz Game Backend Running!',
        timestamp: new Date().toISOString(),
        activeRooms: roomManager.getActiveRoomsCount()
    });
});

// Socket handling
io.on('connection', (socket) => {
    logger.info(`Player connected: ${socket.id}`);

    socket.on('create-room', (data) => {
        try {
            const { playerName, betAmount = 0 } = data;
            if (!isValidPlayerName(playerName)) throw new Error('Name must be 3-20 characters');
            if (betAmount < 0 || betAmount > 10000) throw new Error('Invalid bet amount');
            const room = roomManager.createRoom(socket.id, playerName, betAmount);
            socket.join(room.id);
            socket.emit('room-created', {
                roomId: room.id,
                playerName,
                players: room.players
            });
            logger.info(`Room created: ${room.id} by ${playerName}`);
        } catch (error) {
            socket.emit('error', { code: 'INVALID_INPUT', message: error.message });
        }
    });

    socket.on('join-room', (data) => {
        try {
            const { roomId, playerName, betAmount = 0 } = data;
            if (!isValidRoomId(roomId)) throw new Error('Invalid room ID');
            if (!isValidPlayerName(playerName)) throw new Error('Name must be 3-20 characters');
            if (betAmount < 0 || betAmount > 10000) throw new Error('Invalid bet amount');
            const room = roomManager.joinRoom(roomId.toUpperCase(), socket.id, playerName, betAmount);
            if (!room) throw new Error('Room not found or full');
            socket.join(roomId);
            io.to(roomId).emit('player-joined', { players: room.players, newPlayer: playerName });
            socket.emit('room-joined', { roomId, players: room.players });
            logger.info(`${playerName} joined room: ${roomId}`);
        } catch (error) {
            socket.emit('error', { code: 'JOIN_FAILED', message: error.message });
        }
    });

    socket.on('start-game', (data) => {
        try {
            const { roomId } = data;
            if (!isValidRoomId(roomId)) throw new Error('Invalid room ID');
            const room = roomManager.getRoom(roomId);
            if (!room || room.players.length < 2) throw new Error('Need at least 2 players');
            if (room.status !== 'waiting') throw new Error('Game already started');
            room.status = 'countdown';
            let countdown = 5;
            io.to(roomId).emit('game-starting', { countdown });
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    io.to(roomId).emit('game-starting', { countdown });
                } else {
                    clearInterval(countdownInterval);
                    startGameplay(roomId);
                }
            }, 1000);
            logger.info(`Game starting in room: ${roomId}`);
        } catch (error) {
            socket.emit('error', { code: 'START_FAILED', message: error.message });
        }
    });

    socket.on('submit-answer', (data) => {
        try {
            const { roomId, answer, timeTaken } = data;
            if (!isValidRoomId(roomId)) throw new Error('Invalid room ID');
            const room = roomManager.getRoom(roomId);
            if (!room || room.status !== 'playing' || room.waitingForNextQuestion) return;
            const isCorrect = gameLogic.checkAnswer(room.currentQuestion, answer);
            const player = room.players.find(p => p.id === socket.id);
            if (player && isCorrect) {
                player.score += 1 + (timeTaken < 10 ? 1 : 0); // Time bonus
            }
            socket.emit('answer-result', {
                isCorrect,
                correctAnswer: room.currentQuestion.correct,
                playerAnswer: answer,
                newScore: player ? player.score : 0
            });
            io.to(roomId).emit('player-scores', { players: room.players }); // Live scores
            room.waitingForNextQuestion = true;
            setTimeout(() => {
                if (room.status === 'playing') {
                    room.currentQuestion = gameLogic.generateQuestion(room.questionNumber);
                    room.questionNumber++;
                    io.to(roomId).emit('new-question', {
                        question: room.currentQuestion.question,
                        options: room.currentQuestion.options,
                        questionNumber: room.questionNumber,
                        type: room.currentQuestion.type
                    });
                    room.waitingForNextQuestion = false;
                }
            }, 2000);
        } catch (error) {
            socket.emit('error', { code: 'ANSWER_FAILED', message: 'Failed to submit answer' });
        }
    });

    socket.on('fetch-leaderboard', (data, callback) => {
        callback(leaderboard);
    });

    socket.on('disconnect', () => {
        logger.info(`Player disconnected: ${socket.id}`);
        const rooms = roomManager.getAllRooms();
        rooms.forEach(room => {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                const playerName = room.players[playerIndex].name;
                room.players.splice(playerIndex, 1);
                if (room.players.length > 0) {
                    io.to(room.id).emit('player-left', { players: room.players, leftPlayer: playerName });
                    io.to(room.id).emit('player-scores', { players: room.players });
                } else {
                    roomManager.removeRoom(room.id);
                }
            }
        });
    });

    function startGameplay(roomId) {
        const room = roomManager.getRoom(roomId);
        if (!room) return;
        room.status = 'playing';
        room.gameTimer = 120;
        room.questionNumber = 1;
        room.currentQuestion = gameLogic.generateQuestion(1);
        io.to(roomId).emit('game-started', {
            question: room.currentQuestion.question,
            options: room.currentQuestion.options,
            gameTimer: room.gameTimer,
            questionNumber: room.questionNumber,
            type: room.currentQuestion.type
        });
        io.to(roomId).emit('player-scores', { players: room.players });
        const gameInterval = setInterval(() => {
            room.gameTimer--;
            io.to(roomId).emit('timer-update', { timeLeft: room.gameTimer });
            if (room.gameTimer <= 0) {
                clearInterval(gameInterval);
                endGame(roomId);
            }
        }, 1000);
        room.gameInterval = gameInterval;
    }

    function endGame(roomId) {
        const room = roomManager.getRoom(roomId);
        if (!room) return;
        room.status = 'finished';
        const results = gameLogic.calculateResults(room.players);
        leaderboard.push(...room.players.map(p => ({ name: p.name, score: p.score })));
        leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
        io.to(roomId).emit('game-ended', { results, players: room.players });
        logger.info(`Game ended in room: ${roomId}`, results);
        setTimeout(() => roomManager.removeRoom(roomId), 30000);
    }
});

server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
});

// Cleanup old rooms every 5 minutes
setInterval(() => roomManager.cleanOldRooms(), 5 * 60 * 1000);

process.on('SIGTERM', () => {
    logger.info('Shutting down gracefully');
    server.close(() => process.exit(0));
});
