// js/gameLogic.js

import * as UI from './ui.js';
import * as AI from './ai.js'; // Import AI module for PvC mode

// Game state variables
let board = ['', '', '', '', '', '', '', '', '']; // Represents the 9 cells
let currentPlayer = 'X'; // 'X' or 'O'
let gameActive = true; // True if the game is ongoing
let gameMode = null; // 'localPvP', 'onlinePvP', 'PvC'
let playerNames = { X: 'Player X', O: 'Player O' }; // Store player names
let aiDifficulty = 'medium'; // Default AI difficulty

// Score tracking
let scores = {
    xWins: 0,
    oWins: 0,
    draws: 0
};

// Winning combinations for Tic Tac Toe
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

/**
 * Checks if a player has won on the given board.
 * @param {string} player - The player to check ('X' or 'O').
 * @returns {boolean} True if the player has won, false otherwise.
 */
function checkWinner(player) {
    return winningConditions.some(combination => {
        return combination.every(index => {
            return board[index] === player;
        });
    });
}

/**
 * Checks for a win or a draw, updates scores and status.
 * @returns {boolean} True if the game ended (win or draw), false otherwise.
 */
function checkForGameEndLocal() {
    if (checkWinner(currentPlayer)) {
        // Win
        gameActive = false;
        // Assume UI.highlightWinningCells exists and handles the board highlighting
        UI.highlightWinningCells(board, currentPlayer, winningConditions); 
        if (currentPlayer === 'X') {
            scores.xWins++;
        } else {
            scores.oWins++;
        }
        UI.updateScores(scores); 
        UI.updateGameStatus(playerNames[currentPlayer] + " (" + currentPlayer + ") Wins!"); 
        return true;
    } else if (board.every(cell => cell !== '')) {
        // Draw
        gameActive = false;
        scores.draws++;
        UI.updateScores(scores); 
        UI.updateGameStatus("It's a Draw!"); 
        return true;
    }
    return false;
}

/**
 * Handles a move for the human player (in localPvP or PvC).
 * @param {number} index - The board index of the move.
 */
export function handlePlayerMove(index) {
    if (!gameActive || board[index] !== '') {
        return;
    }

    // 1. Place the move
    board[index] = currentPlayer;
    UI.updateBoardUI(board);
    
    // 2. Check for game end (Win/Draw)
    const gameEnded = checkForGameEndLocal(); 

    if (gameEnded) {
        // Disable cells if the game ended
        UI.setCellsInteractive(false, board); 
        return;
    }

    // 3. Switch player for the next turn ('X' -> 'O' or 'O' -> 'X')
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    
    UI.updateGameStatus(playerNames[currentPlayer] + "'s turn (" + currentPlayer + ")"); 
    console.log("GameLogic: Switched current player to:", currentPlayer);

    // 4. Handle AI move if in PvC mode and it's now AI's turn ('O')
    if (gameMode === 'PvC' && currentPlayer === 'O') {
        UI.setCellsInteractive(false, board); 
        setTimeout(makeMoveAI, 500);
    }
}

/**
 * Finds the best move for the AI (Player 'O') and executes it.
 * NOTE: This function assumes the existence of AI.findBestMove.
 */
function makeMoveAI() {
    // Pass current player as aiPlayer
    const aiMoveIndex = AI.findBestMove(board, currentPlayer, aiDifficulty);

    if (aiMoveIndex !== -1) {
        board[aiMoveIndex] = currentPlayer;
        UI.updateBoardUI(board);
        const gameEnded = checkForGameEndLocal(); 
        
        if (!gameEnded) { 
            // Switch player back to human player ('X')
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            UI.updateGameStatus(playerNames[currentPlayer] + "'s turn (" + currentPlayer + ")"); 
        }
    } else {
        console.log("GameLogic: AI: No valid moves found (shouldn't happen in a non-full board).");
    }
    // Re-enable cells only if the game is still active
    if (gameActive) {
        UI.setCellsInteractive(true, board); 
    }
}

/**
 * Resets scores to zero and updates UI.
 */
export function resetScores() {
    scores = { xWins: 0, oWins: 0, draws: 0 };
    UI.updateScores(scores); // Update UI
    console.log("GameLogic: Scores reset.");
}

/**
 * Initializes a new game for the selected mode.
 */
export function initializeGame(mode, isRematch = false, names = { X: 'Player X', O: 'Player O' }, difficulty = 'medium') {
    console.log("GameLogic: Initializing game in mode:", mode, "Is Rematch:", isRematch, "Names:", names, "AI Difficulty:", difficulty);
    gameMode = mode;
    playerNames = names;
    aiDifficulty = difficulty;
    board = ['', '', '', '', '', '', '', '', '']; // Clear the board
    gameActive = true;
    currentPlayer = 'X'; // Always start with 'X'
    // Assume UI.clearWinningHighlight exists
    UI.clearWinningHighlight(); 
    
    if (!isRematch) {
        resetScores();
    }

    UI.updateBoardUI(board);
    UI.updateScores(scores);
    UI.updateGameStatus(playerNames[currentPlayer] + "'s turn (" + currentPlayer + ")"); 
    UI.setCellsInteractive(true, board);

    // If in PvC mode and AI starts first (if we decided to make O start first based on some config)
    // Based on the code, X always starts, so this check is currently for future flexibility 
    if (gameMode === 'PvC' && currentPlayer === 'O') {
        UI.setCellsInteractive(false, board);
        setTimeout(makeMoveAI, 500);
    }
}

// --- Getter/Setter Exported Functions ---
export function getBoard() { return board; }
export function getCurrentPlayer() { return currentPlayer; }
export function isGameActive() { return gameActive; }
export function setGameActive(status) { gameActive = status; }
export function getScores() { return scores; }
export function setScores(newScores) { scores = newScores; }
export function getGameMode() { return gameMode; }
export function getPlayerNames() { return playerNames; } 
export function getAIDifficulty() { return aiDifficulty; }