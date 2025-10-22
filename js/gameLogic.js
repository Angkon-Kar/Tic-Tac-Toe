// js/gameLogic.js

import * as UI from './ui.js';
import * as AI from './ai.js'; // Import AI module for PvC mode
import { sendGameUpdate } from './onlineGame.js'; // Only used for online mode

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
 * Checks for a winner or a draw and handles game end.
 * @returns {Array<number>|false} Winning cells array if there's a winner, true for draw, false otherwise.
 */
function checkGameEnd() {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] !== '' && board[a] === board[b] && board[a] === board[c]) {
            return [a, b, c]; // Return winning cells
        }
    }

    if (board.every(cell => cell !== '')) {
        return true; // Draw
    }

    return false; // Game continues
}

/**
 * Handles the end of a local or PvC game.
 */
function checkForGameEndLocal() {
    const gameEndResult = checkGameEnd();

    if (gameEndResult) {
        gameActive = false;
        UI.setCellsInteractive(false, board); // Disable board interaction
        
        if (Array.isArray(gameEndResult)) { // Winner
            const winner = currentPlayer;
            const winnerName = playerNames[winner];
            UI.setGameStatus(`${winnerName} (${winner}) Wins!`);
            UI.highlightWinningCells(gameEndResult);
            
            // Update score
            if (winner === 'X') {
                scores.xWins++;
            } else {
                scores.oWins++;
            }
        } else { // Draw
            UI.setGameStatus("It's a Draw!");
            scores.draws++;
        }
        UI.updateScoreDisplay(scores);
        // In local/PvC mode, "reset" button is visible to clear scores
    } else {
        // Switch players for the next turn
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        UI.setGameStatus(`${playerNames[currentPlayer]}'s (${currentPlayer}) Turn`);

        // If in PvC mode and it's AI's turn, trigger AI move
        if (gameMode === 'PvC' && currentPlayer === 'O') {
            setTimeout(handleAIMove, 500); // Add a small delay for better UX
        }
    }
}

/**
 * Initializes a new game for the selected mode.
 * @param {string} mode - The game mode ('localPvP', 'onlinePvP', 'PvC').
 * @param {boolean} isRematch - True if this is a rematch (don't reset scores).
 * @param {object} names - Object containing player names {X: 'NameX', O: 'NameO'}.
 * @param {string} difficulty - AI difficulty ('easy', 'medium', 'hard'). Only for PvC.
 */
export function initializeGame(mode, isRematch = false, names, difficulty = 'medium') {
    console.log("GameLogic: Initializing game in mode:", mode, "Is Rematch:", isRematch);
    gameMode = mode;
    board = ['', '', '', '', '', '', '', '', '']; // Clear the board
    gameActive = true;
    currentPlayer = 'X'; // Always start with X

    // Set player names and difficulty
    playerNames = names;
    aiDifficulty = difficulty;

    if (!isRematch) {
        resetScores();
    }
    
    UI.updateBoardUI(board);
    UI.updateScoreDisplay(scores);
    UI.setCellsInteractive(true, board);
    
    UI.setGameStatus(`${playerNames.X}'s (X) Turn`);

    // If PvC and X is AI (not the case here, as AI is always 'O'), handle AI move here too.
}


/**
 * Processes a cell click based on the current game mode.
 * @param {number} index - The index of the clicked cell (0-8).
 * @param {string} playerRole - The current user's role in the game (only for online).
 */
export function handleCellClick(index, playerRole = null) {
    if (!gameActive || board[index] !== '') {
        return;
    }

    if (gameMode === 'onlinePvP') {
        if (currentPlayer !== playerRole) {
            UI.showModal(`It is not your turn! Waiting for ${playerNames[currentPlayer]}.`);
            return;
        }
        // Send move to Firestore
        board[index] = currentPlayer;
        sendGameUpdate(board, currentPlayer);
    } else if (gameMode === 'localPvP' || gameMode === 'PvC') {
        // Local/PvC game logic
        board[index] = currentPlayer;
        UI.updateBoardUI(board);
        UI.setCellsInteractive(false, board); // Disable cells briefly during AI turn
        checkForGameEndLocal();
        // Re-enabling cells is handled in checkForGameEndLocal() after AI turn (if any)
    }
}

/**
 * Resets local scores (for localPvP and PvC modes).
 */
export function resetLocalScores() {
    resetScores();
    // Re-initialize game to clear board and apply reset scores
    initializeGame(gameMode, false, playerNames, aiDifficulty);
}

/**
 * Updates the game state based on a received update (for online mode).
 * @param {object} gameState - The latest game state from Firestore.
 * @param {string} localPlayerRole - The current user's role ('X', 'O', or 'spectator').
 */
export function updateGameFromOnline(gameState, localPlayerRole) {
    board = Array.from(gameState.board);
    gameActive = gameState.gameActive;
    currentPlayer = gameState.currentPlayer;
    scores = gameState.scores;
    playerNames = {
        X: gameState.playerXName,
        O: gameState.playerOName || 'Waiting...'
    };

    UI.updateBoardUI(board);
    UI.updateScoreDisplay(scores);
    
    if (!gameActive) {
        // Check for winner/draw from the state
        const gameEndResult = checkGameEnd();
        if (Array.isArray(gameEndResult)) {
            const winner = currentPlayer === 'X' ? 'O' : 'X'; // Winner is the *previous* player who made the last move
            UI.setGameStatus(`${playerNames[winner]} (${winner}) Wins!`);
            UI.highlightWinningCells(gameEndResult);
        } else if (gameEndResult === true) {
            UI.setGameStatus("It's a Draw!");
        } else {
            // Game is inactive for some other reason (e.g., game abandoned)
            UI.setGameStatus("Game Ended. Waiting for new round.");
        }
        
        // Only show startNewRoundButton if you are an active player
        if (localPlayerRole === 'X' || localPlayerRole === 'O') {
            const startNewRoundButton = UI.getStartNewRoundButton();
            if (startNewRoundButton) startNewRoundButton.classList.remove('hidden');
        }
    } else {
        UI.setGameStatus(`${playerNames[currentPlayer]}'s (${currentPlayer}) Turn`);
    }

    // Set interactivity based on active status and current player turn
    const enableInteraction = gameActive && (localPlayerRole === currentPlayer);
    UI.setCellsInteractive(enableInteraction, board, currentPlayer, localPlayerRole, 'onlinePvP');
}


/**
 * Performs the AI's move (Player 'O').
 */
function handleAIMove() {
    if (!gameActive) return;

    // Use AI module to get the best move
    const aiMoveIndex = AI.findBestMove(board, 'O', aiDifficulty);

    if (aiMoveIndex !== -1) {
        board[aiMoveIndex] = currentPlayer;
        UI.updateBoardUI(board);
        checkForGameEndLocal();
    } else {
        console.log("GameLogic: AI: No valid moves found (shouldn't happen in a non-full board).");
    }
    UI.setCellsInteractive(true, board); // Re-enable cells after AI move
}

/**
 * Resets scores to zero.
 */
function resetScores() {
    scores = { xWins: 0, oWins: 0, draws: 0 };
    console.log("GameLogic: Scores reset.");
}

// --- Getter Functions ---

/**
 * Gets the current board state.
 * @returns {Array<string>} The current board array.
 */
export function getBoard() {
    return board;
}

/**
 * Gets the current player.
 * @returns {string} The current player ('X' or 'O').
 */
export function getCurrentPlayer() {
    return currentPlayer;
}

/**
 * Gets the current game active status.
 * @returns {boolean} True if the game is active, false otherwise.
 */
export function isGameActive() {
    return gameActive;
}

/**
 * Sets the game active status.
 * @param {boolean} status - The new status.
 */
export function setGameActive(status) {
    gameActive = status;
}

/**
 * Gets the current scores.
 * @returns {object} The scores object.
 */
export function getScores() {
    return scores;
}

/**
 * Sets the current scores.
 * @param {object} newScores - The new scores object.
 */
export function setScores(newScores) {
    scores = newScores;
}

/**
 * Gets the current game mode.
 * @returns {string|null} The current game mode.
 */
export function getGameMode() {
    return gameMode;
}