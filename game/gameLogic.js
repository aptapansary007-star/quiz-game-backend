const { shuffleArray, getRandomInt } = require('../utils/helpers');

class GameLogic {
  constructor() {
    this.questionTypes = ['addition'];
  }

  // Generate addition question
  generateQuestion() {
    // Generate random numbers for addition
    const num1 = getRandomInt(10, 99); // 2-digit numbers
    const num2 = getRandomInt(10, 99);
    const correct = num1 + num2;
    
    // Generate wrong answers (distractors)
    const wrong1 = correct + getRandomInt(1, 10);  // Higher
    const wrong2 = correct - getRandomInt(1, 10);  // Lower
    const wrong3 = correct + getRandomInt(15, 25); // Much higher
    
    // Make sure wrong answers are positive and different
    const wrongAnswers = [wrong1, wrong2, wrong3].map(num => Math.max(1, num))
                                                  .filter(num => num !== correct);
    
    // If we don't have enough unique wrong answers, generate more
    while (wrongAnswers.length < 3) {
      const newWrong = correct + getRandomInt(-20, 20);
      if (newWrong > 0 && newWrong !== correct && !wrongAnswers.includes(newWrong)) {
        wrongAnswers.push(newWrong);
      }
    }
    
    // Take only first 3 wrong answers
    const finalWrongAnswers = wrongAnswers.slice(0, 3);
    
    // Create options array and shuffle
    const options = [correct, ...finalWrongAnswers];
    shuffleArray(options);
    
    return {
      question: `${num1} + ${num2}`,
      options: options,
      correct: correct,
      type: 'addition'
    };
  }

  // Check if answer is correct
  checkAnswer(question, playerAnswer) {
    return question.correct === parseInt(playerAnswer);
  }

  // Calculate game results
  calculateResults(players) {
    // Sort players by score (descending)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    const highestScore = sortedPlayers[0].score;
    const winners = sortedPlayers.filter(player => player.score === highestScore);
    
    let result = {
      type: 'draw',
      winners: winners,
      ranking: sortedPlayers,
      totalBet: players.reduce((sum, p) => sum + (p.betAmount || 0), 0)
    };
    
    if (winners.length === 1) {
      result.type = 'winner';
      result.winner = winners[0];
    }
    
    // Calculate prize distribution
    if (result.totalBet > 0) {
      const prizePerWinner = Math.floor(result.totalBet / winners.length);
      result.prizePerWinner = prizePerWinner;
    }
    
    return result;
  }

  // Generate multiple questions for testing
  generateQuestions(count = 10) {
    const questions = [];
    for (let i = 0; i < count; i++) {
      questions.push(this.generateQuestion());
    }
    return questions;
  }

  // Validate question difficulty
  validateDifficulty(num1, num2) {
    const sum = num1 + num2;
    return {
      isValid: sum >= 20 && sum <= 200,
      difficulty: sum < 50 ? 'easy' : sum < 100 ? 'medium' : 'hard'
    };
  }

  // Generate question with specific difficulty
  generateQuestionWithDifficulty(difficulty = 'medium') {
    let num1, num2, attempts = 0;
    
    do {
      switch (difficulty) {
        case 'easy':
          num1 = getRandomInt(5, 25);
          num2 = getRandomInt(5, 25);
          break;
        case 'medium':
          num1 = getRandomInt(20, 60);
          num2 = getRandomInt(20, 60);
          break;
        case 'hard':
          num1 = getRandomInt(50, 99);
          num2 = getRandomInt(50, 99);
          break;
        default:
          num1 = getRandomInt(10, 99);
          num2 = getRandomInt(10, 99);
      }
      attempts++;
    } while (!this.validateDifficulty(num1, num2).isValid && attempts < 10);
    
    const correct = num1 + num2;
    
    // Generate smart distractors based on difficulty
    let distractors = [];
    if (difficulty === 'easy') {
      distractors = [
        correct + getRandomInt(1, 5),
        correct - getRandomInt(1, 5),
        correct + getRandomInt(10, 15)
      ];
    } else if (difficulty === 'medium') {
      distractors = [
        correct + getRandomInt(5, 15),
        correct - getRandomInt(5, 15),
        correct + getRandomInt(20, 30)
      ];
    } else {
      distractors = [
        correct + getRandomInt(10, 25),
        correct - getRandomInt(10, 25),
        correct + getRandomInt(30, 50)
      ];
    }
    
    // Ensure distractors are positive and unique
    distractors = distractors.map(d => Math.max(1, d))
                           .filter((d, i, arr) => d !== correct && arr.indexOf(d) === i);
    
    // Fill if needed
    while (distractors.length < 3) {
      const newDistractor = correct + getRandomInt(-30, 30);
      if (newDistractor > 0 && newDistractor !== correct && !distractors.includes(newDistractor)) {
        distractors.push(newDistractor);
      }
    }
    
    const options = [correct, ...distractors.slice(0, 3)];
    shuffleArray(options);
    
    return {
      question: `${num1} + ${num2}`,
      options: options,
      correct: correct,
      difficulty: difficulty,
      type: 'addition'
    };
  }

  // Get performance stats
  getPerformanceStats(player, totalQuestions, timeSpent) {
    const accuracy = player.score / totalQuestions;
    const speed = totalQuestions / (timeSpent / 1000); // questions per second
    
    return {
      accuracy: Math.round(accuracy * 100),
      speed: Math.round(speed * 100) / 100,
      score: player.score,
      totalQuestions: totalQuestions,
      timeSpent: timeSpent
    };
  }
}

module.exports = GameLogic;
