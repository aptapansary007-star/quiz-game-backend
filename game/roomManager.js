const { generateRoomId } = require('../utils/helpers');

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(playerId, playerName, betAmount = 0) {
        const roomId = generateRoomId();
        const room = {
            id: roomId,
            players: [{
                id: playerId,
                name: playerName,
                score: 0,
                betAmount,
                isHost: true
            }],
            status: 'waiting',
            currentQuestion: null,
            gameTimer: 120,
            questionNumber: 0,
            gameInterval: null,
            createdAt: new Date(),
            waitingForNextQuestion: false
        };
        this.rooms.set(roomId, room);
        return room;
    }

    joinRoom(roomId, playerId, playerName, betAmount = 0) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        if (room.players.length >= 4) return null;
        if (room.status !== 'waiting') return null;
        const existingPlayer = room.players.find(p => p.id === playerId);
        if (existingPlayer) return room;
        room.players.push({
            id: playerId,
            name: playerName,
            score: 0,
            betAmount,
            isHost: false
        });
        return room;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    getAllRooms() {
        return Array.from(this.rooms.values());
    }

    removeRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (room && room.gameInterval) {
            clearInterval(room.gameInterval);
        }
        return this.rooms.delete(roomId);
    }

    getActiveRoomsCount() {
        return this.rooms.size;
    }

    removePlayerFromRoom(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return null;
        const removedPlayer = room.players.splice(playerIndex, 1)[0];
        if (removedPlayer.isHost && room.players.length > 0) {
            room.players[0].isHost = true;
        }
        if (room.players.length === 0) {
            this.removeRoom(roomId);
            return null;
        }
        return room;
    }

    updatePlayerScore(roomId, playerId, newScore) {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        const player = room.players.find(p => p.id === playerId);
        if (!player) return false;
        player.score = newScore;
        return true;
    }

    getRoomStats(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        return {
            id: room.id,
            playerCount: room.players.length,
            status: room.status,
            gameTimer: room.gameTimer,
            questionNumber: room.questionNumber,
            totalBet: room.players.reduce((sum, p) => sum + p.betAmount, 0),
            createdAt: room.createdAt
        };
    }

    cleanOldRooms() {
        const now = new Date();
        const maxAge = 60 * 60 * 1000; // 1 hour
        for (const [roomId, room] of this.rooms) {
            const age = now - room.createdAt;
            if (age > maxAge && room.status === 'finished') {
                this.removeRoom(roomId);
                console.log(`Cleaned old room: ${roomId}`);
            }
        }
    }

    roomExists(roomId) {
        return this.rooms.has(roomId);
    }

    getPlayerCount(roomId) {
        const room = this.rooms.get(roomId);
        return room ? room.players.length : 0;
    }
}

module.exports = RoomManager;
