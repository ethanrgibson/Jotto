
import { WORDS } from './words.js';

// --- Game State ---
let gameState = {
    userSecretWord: null, // Just for logic, not actually stored if user doesn't want to input it.
    computerSecretWord: null,
    userGuesses: [], // Array of { word: string, score: number }
    computerGuesses: [], // Array of { word: string, score: number }
    possibleComputerGuesses: [], // Words computer thinks are possible for user's secret
    gameOver: false,
    turn: 'user' // 'user' or 'computer'
};

// --- DOM Elements ---
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    end: document.getElementById('end-screen')
};

const userGuessInput = document.getElementById('user-guess-input');
const userGuessBtn = document.getElementById('user-guess-btn');
const userGuessList = document.getElementById('user-guess-list');

const computerGuessDisplay = document.getElementById('computer-guess-display');
const computerScoreBtns = document.querySelectorAll('.score-btn');
const computerGuessList = document.getElementById('computer-guess-list');

const alphabetChart = document.getElementById('alphabet-chart');
const endMessage = document.getElementById('end-message');
const restartBtn = document.getElementById('restart-btn');

// --- Initialization ---
function initGame() {
    // Reset State
    gameState.computerSecretWord = getRandomWord(WORDS);
    gameState.possibleComputerGuesses = [...WORDS]; // Start with all valid unique words
    gameState.userGuesses = [];
    gameState.computerGuesses = [];
    gameState.gameOver = false;
    gameState.turn = 'user';

    // Reset UI
    userGuessInput.value = '';
    userGuessList.innerHTML = '';
    computerGuessList.innerHTML = '';
    computerGuessDisplay.textContent = "Waiting for your turn...";

    document.querySelectorAll('.key').forEach(key => {
        key.classList.remove('eliminated', 'confirmed', 'uncertain');
    });

    // Disable computer controls initially
    toggleComputerControls(false);
    toggleUserControls(true);

    showScreen('game');

    console.log("DEBUG: Computer Secret is", gameState.computerSecretWord);
}

// --- Logic ---

function getRandomWord(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function calculateScore(guess, secret) {
    if (!guess || !secret) return 0;
    let count = 0;
    for (let char of guess) {
        if (secret.includes(char)) {
            count++;
        }
    }
    return count;
}

// Filter possible words based on a guess and the resulting score
function filterPossibleWords(guess, score) {
    gameState.possibleComputerGuesses = gameState.possibleComputerGuesses.filter(candidate => {
        // If 'candidate' was the secret word, would 'guess' get this 'score'?
        return calculateScore(guess, candidate) === score;
    });
}

function isValidWord(word) {
    if (word.length !== 5) return false;
    if ((new Set(word)).size !== 5) return false; // Unique chars only
    return WORDS.includes(word);
}

// --- User Turn ---

function handleUserGuess() {
    const guess = userGuessInput.value.toUpperCase();

    if (!isValidWord(guess)) {
        alert("Invalid word! Must be 5 letters, unique characters, and in the dictionary.");
        return;
    }

    if (gameState.userGuesses.some(g => g.word === guess)) {
        alert("You already guessed that word!");
        return;
    }

    const score = calculateScore(guess, gameState.computerSecretWord);

    // Record Guess
    gameState.userGuesses.push({ word: guess, score: score });
    renderUserGuess(guess, score);
    userGuessInput.value = '';

    // Check Win
    if (score === 5) {
        endGame('user');
        return;
    }

    // Switch Turn
    gameState.turn = 'computer';
    toggleUserControls(false);
    startComputerTurn();
}

function renderUserGuess(word, score) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${word}</span> <span class="score">${score}</span>`;
    userGuessList.prepend(li); // Newest top
}

// --- Computer Turn ---

function startComputerTurn() {
    // Basic AI mostly, but "smart" enough to pick from filtered list
    setTimeout(() => {
        if (gameState.possibleComputerGuesses.length === 0) {
            // Should not happen if logic is correct and user didn't lie
            alert("I have run out of words! Did you make a mistake in scoring?");
            return;
        }

        // Pick a random word from the remaining possibilities
        const guess = getRandomWord(gameState.possibleComputerGuesses);

        computerGuessDisplay.textContent = guess;
        toggleComputerControls(true);
    }, 1000); // Small delay for "thinking"
}

function handleComputerScore(score) {
    const guess = computerGuessDisplay.textContent;

    // Record Guess
    gameState.computerGuesses.push({ word: guess, score: score });
    renderComputerLog(guess, score);

    // Check Win
    if (score === 5) {
        endGame('computer');
        return;
    }

    // AI Logic: eliminate impossible words
    const countBefore = gameState.possibleComputerGuesses.length;
    filterPossibleWords(guess, score);
    const countAfter = gameState.possibleComputerGuesses.length;
    console.log(`AI Filter: Guessed ${guess} (Score ${score}). Reduced possibilities from ${countBefore} to ${countAfter}`);

    // Switch Turn
    gameState.turn = 'user';
    computerGuessDisplay.textContent = "Waiting for your turn...";
    toggleComputerControls(false);
    toggleUserControls(true);
}

function renderComputerLog(word, score) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${word}</span> <span class="score">${score}</span>`;
    computerGuessList.prepend(li);
}

// --- UI Controls ---

function toggleUserControls(enable) {
    userGuessInput.disabled = !enable;
    userGuessBtn.disabled = !enable;
    if (enable) userGuessInput.focus();
}

function toggleComputerControls(enable) {
    computerScoreBtns.forEach(btn => btn.disabled = !enable);
}

function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function endGame(winner) {
    gameState.gameOver = true;
    showScreen('end');
    if (winner === 'user') {
        endMessage.textContent = "You Won! You cracked the code!";
    } else {
        endMessage.textContent = "Computer Won! Better luck next time.";
    }
}


// --- Alphabet Chart Interactivity ---
alphabetChart.addEventListener('click', (e) => {
    if (e.target.classList.contains('key')) {
        const classes = ['default', 'eliminated', 'confirmed', 'uncertain'];
        const key = e.target;

        // Cycle classes
        if (key.classList.contains('eliminated')) {
            key.classList.remove('eliminated');
            key.classList.add('confirmed');
        } else if (key.classList.contains('confirmed')) {
            key.classList.remove('confirmed');
            key.classList.add('uncertain');
        } else if (key.classList.contains('uncertain')) {
            key.classList.remove('uncertain');
        } else {
            key.classList.add('eliminated');
        }
    }
});


// --- Event Listeners ---
document.getElementById('start-btn').addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

userGuessBtn.addEventListener('click', handleUserGuess);

userGuessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserGuess();
});

computerScoreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const score = parseInt(btn.dataset.score);
        handleComputerScore(score);
    });
});
