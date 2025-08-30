function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function isValidRoomId(roomId) {
    return typeof roomId === 'string' && /^[A-Z0-9]{6}$/.test(roomId);
}

function isValidPlayerName(name) {
    return typeof name === 'string' && name.trim().length >= 3 && name.trim().length <= 20;
}

module.exports = {
    generateRoomId,
    getRandomInt,
    shuffleArray,
    isValidRoomId,
    isValidPlayerName
};
