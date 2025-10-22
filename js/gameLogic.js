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
 * Initializes a new game for the selected mode.
 * @param {string} mode - The game mode ('localPvP', 'onlinePvP', 'PvC').
 * @param {boolean} isRematch - True if this is a rematch (don't reset scores).
 * @param {object} names - Object containing player names {X: 'NameX', O: 'NameO'}.
 * @param {string} difficulty - AI difficulty ('easy', 'medium', 'hard') for PvC mode.
 */
export function initializeGame(mode, isRematch = false, names = playerNames, difficulty = aiDifficulty) {
    console.log("GameLogic: Initializing game in mode:", mode, "Is Rematch:", isRematch, "Names:", names, "AI Difficulty:", difficulty);
    gameMode = mode;
    board = ['', '', '', '', '', '', '', '', '']; // Clear the board
    currentPlayer = 'X'; // Start with Player X
    gameActive = true; // Set game to active
    playerNames = names; // Set player names
    aiDifficulty = difficulty; // Set AI difficulty

    UI.updateBoardUI(board); // Update UI to clear board
    // For onlinePvP, interactivity is handled by onlineGame.js to account for spectator mode
    UI.setCellsInteractive(true, board, null, null, gameMode);

    if (!isRematch) {
        resetScores(); // Only reset scores if it's not a rematch
    }
    UI.updateScoreDisplay(scores); // Update score display

    if (mode === 'PvC') {
            playerNames = names; // Apply new names from setup
            aiDifficulty = difficulty; // Set the AI difficulty for PvC
            console.log(`GameLogic: Starting PvC game. Player X: ${playerNames.X}, AI (O) Difficulty: ${aiDifficulty}`);
            UI.setGameStatus(playerNames.X + "'s turn (X)");
        }
    
    // For onlinePvP, status is managed by onlineGame.js listener

    // If in PvC mode and AI (O) should start (not default, but good to check)
    if (gameMode === 'PvC' && currentPlayer === 'O') {
        setTimeout(makeAIMove, 700); // AI makes first move if it's 'O'
    }
}

/**
 * Handles a click on a game cell.
 * @param {number} clickedCellIndex - The index of the clicked cell.
 * @returns {boolean} True if the move was valid and processed, false otherwise.
 */
export function handleCellClick(clickedCellIndex) {
    if (board[clickedCellIndex] !== '' || !gameActive) {
        console.log("GameLogic: Invalid click - cell filled or game not active.");
        return false; // Cell already filled or game not active
    }

    if (gameMode === 'localPvP' || gameMode === 'PvC') {
        board[clickedCellIndex] = currentPlayer;
        UI.updateBoardUI(board); // Update UI immediately
        checkForGameEndLocal();
        return true;
    }
    // For onlinePvP, onlineGame.js will handle the move and update Firestore
    return false;
}

/**
 * Checks for win/draw conditions for local and PvC modes.
 */
function checkForGameEndLocal() {
    console.log("GameLogic: Checking for local game end.");
    let roundWon = false;
    let winningCells = [];

    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        const a = board[winCondition[0]];
        const b = board[winCondition[1]];
        const c = board[winCondition[2]];

        if (a === '' || b === '' || c === '') {
            continue;
        }
        if (a === b && b === c) {
            roundWon = true;
            winningCells = winCondition;
            break;
        }
    }

    if (roundWon) {
        UI.setGameStatus(`${playerNames[currentPlayer]} Wins!`);
        UI.highlightWinningCells(winningCells); // Highlight winning line
        gameActive = false;
        if (currentPlayer === 'X') {
            scores.xWins++;
        } else {
            scores.oWins++;
        }
        UI.updateScoreDisplay(scores);
        UI.setCellsInteractive(false, board); // Disable all cells after win
        console.log("GameLogic: Local game won by:", currentPlayer);
        return;
    }

    const roundDraw = !board.includes('');
    if (roundDraw) {
        UI.setGameStatus('It\'s a Draw!');
        gameActive = false;
        scores.draws++;
        UI.updateScoreDisplay(scores);
        UI.setCellsInteractive(false, board); // Disable all cells after draw
        console.log("GameLogic: Local game is a draw.");
        return;
    }

    switchPlayerLocal(); // Continue game if no win/draw
}

/**
 * Switches the current player for local and PvC modes.
 */
function switchPlayerLocal() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    UI.setGameStatus(`${playerNames[currentPlayer]}'s Turn`);
    console.log("GameLogic: Switched player to:", currentPlayer);

    if (gameMode === 'PvC' && currentPlayer === 'O' && gameActive) {
        console.log("GameLogic: AI's turn, making move...");
        UI.setCellsInteractive(false, board); // Disable user input during AI turn
        setTimeout(makeAIMove, 700); // AI's turn with a slight delay
    } else if (gameMode === 'localPvP') {
        UI.setCellsInteractive(true, board); // Re-enable cells for next player
    }
}

/**
 * Triggers the AI to make a move.
 */
function makeAIMove() {
    const aiMoveIndex = AI.findBestMove(board, 'O', aiDifficulty); // Pass difficulty to AI
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

/**
 * Gets the current player names.
 * @returns {object} The player names object {X: 'NameX', O: 'NameO'}.
 */
export function getPlayerNames() {
    return playerNames;
}


/**
 * Gets the current AI difficulty.
 * @returns {string} The current difficulty.
 */
export function getAiDifficulty() {
    return aiDifficulty;
}

// NOTE: You will also need to ensure your existing makeAiMove function 
// in gameLogic.js calls AI.findBestMove(board, currentPlayer, aiDifficulty) 
// using the getAiDifficulty() or the local aiDifficulty variable.