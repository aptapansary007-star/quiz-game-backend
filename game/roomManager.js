const { generateRoomId } = require('../utils/helpers');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  // Create new room
  createRoom(playerId, playerName, betAmount = 0) {
    const roomId = generateRoomId();
    
    const room = {
      id: roomId,
      players: [{
        id: playerId,
        name: playerName,
        score: 0,
        betAmount: betAmount,
        isHost: true
      }],
      status: 'waiting', // waiting, countdown, playing, finished
      currentQuestion: null,
      gameTimer: 30,
      questionNumber: 0,
      gameInterval: null,
      createdAt: new Date()
    };
    
    this.rooms.set(roomId, room);
    return room;
  }

  // Join existing room
  joinRoom(roomId, playerId, playerName, betAmount = 0) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null; // Room not found
    }
    
    if (room.players.length >= 4) {
      return null; // Room full
    }
    
    if (room.status !== 'waiting') {
      return null; // Game already started
    }
    
    // Check if player already in room
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      return room; // Player already in room
    }
    
    // Add new player
    room.players.push({
      id: playerId,
      name: playerName,
      score: 0,
      betAmount: betAmount,
      isHost: false
    });
    
    return room;
  }

  // Get room by ID
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  // Get all rooms
  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  // Remove room
  removeRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room && room.gameInterval) {
      clearInterval(room.gameInterval);
    }
    return this.rooms.delete(roomId);
  }

  // Get active rooms count
  getActiveRoomsCount() {
    return this.rooms.size;
  }

  // Remove player from room
  removePlayerFromRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return null;
    
    // Remove player
    const removedPlayer = room.players.splice(playerIndex, 1)[0];
    
    // If host left, make next player host
    if (removedPlayer.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }
    
    // If room empty, remove it
    if (room.players.length === 0) {
      this.removeRoom(roomId);
      return null;
    }
    
    return room;
  }

  // Update player score
  updatePlayerScore(roomId, playerId, newScore) {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;
    
    player.score = newScore;
    return true;
  }

  // Get room stats
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

  // Clean old rooms (call periodically)
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

  // Get rooms by status
  getRoomsByStatus(status) {
    return Array.from(this.rooms.values()).filter(room => room.status === status);
  }

  // Check if room exists
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  // Get player count in room
  getPlayerCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.players.length : 0;
  }
}

module.exports = RoomManager;
