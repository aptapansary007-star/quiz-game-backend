const { shuffleArray, getRandomInt } = require('../utils/helpers');

class GameLogic {
    constructor() {
        this.questionTypes = ['addition', 'subtraction', 'multiplication'];
    }

    generateQuestion(questionNumber) {
        const difficulty = questionNumber <= 5 ? 'easy' : questionNumber <= 10 ? 'medium' : 'hard';
        const type = this.questionTypes[Math.floor(Math.random() * this.questionTypes.length)];
        let num1, num2, correct;

        switch (type) {
            case 'addition':
                num1 = getRandomInt(difficulty === 'easy' ? 5 : 20, difficulty === 'hard' ? 99 : 50);
                num2 = getRandomInt(difficulty === 'easy' ? 5 : 20, difficulty === 'hard' ? 99 : 50);
                correct = num1 + num2;
                break;
            case 'subtraction':
                num1 = getRandomInt(difficulty === 'easy' ? 10 : 30, difficulty === 'hard' ? 99 : 60);
                num2 = getRandomInt(difficulty === 'easy' ? 5 : 10, num1 - 1);
                correct = num1 - num2;
                break;
            case 'multiplication':
                num1 = getRandomInt(difficulty === 'easy' ? 2 : 5, difficulty === 'hard' ? 20 : 12);
                num2 = getRandomInt(difficulty === 'easy' ? 2 : 5, difficulty === 'hard' ? 20 : 12);
                correct = num1 * num2;
                break;
        }

        const distractors = [
            correct + getRandomInt(1, difficulty === 'easy' ? 5 : 15),
            correct - getRandomInt(1, difficulty === 'easy' ? 5 : 15),
            correct + getRandomInt(10, difficulty === 'easy' ? 20 : 30)
        ].filter(d => d > 0 && d !== correct).slice(0, 3);

        while (distractors.length < 3) {
            const d = correct + getRandomInt(-20, 20);
            if (d > 0 && d !== correct && !distractors.includes(d)) distractors.push(d);
        }

        const options = [correct, ...distractors];
        shuffleArray(options);

        return {
            question: type === 'multiplication' ? `${num1} × ${num2}` : `${num1} ${type === 'addition' ? '+' : '-'} ${num2}`,
            options,
            correct,
            type,
            difficulty
        };
    }

    checkAnswer(question, playerAnswer) {
        return question.correct === parseInt(playerAnswer);
    }

    calculateResults(players) {
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        const highestScore = sortedPlayers[0].score;
        const winners = sortedPlayers.filter(p => p.score === highestScore);
        const totalBet = players.reduce((sum, p) => sum + (p.betAmount || 0), 0);
        return {
            type: winners.length === 1 ? 'winner' : 'draw',
            winner: winners.length === 1 ? winners[0] : null,
            winners,
            ranking: sortedPlayers,
            totalBet,
            prizePerWinner: totalBet > 0 ? Math.floor(totalBet / winners.length) : 0
        };
    }
}

module.exports = GameLogic;
