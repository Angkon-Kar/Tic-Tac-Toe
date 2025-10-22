// js/ai.js

// Winning conditions (same as in gameLogic, but duplicated for modularity)
const WINNING_CONDITIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

/**
 * Checks if a player has won on the given board.
 * @param {Array<string>} board - The current board state.
 * @param {string} player - The player to check ('X' or 'O').
 * @returns {boolean} True if the player has won, false otherwise.
 */
function checkWinner(board, player) {
    for (let i = 0; i < WINNING_CONDITIONS.length; i++) {
        const [a, b, c] = WINNING_CONDITIONS[i];
        if (board[a] === player && board[b] === player && board[c] === player) {
            return true;
        }
    }
    return false;
}

/**
 * Finds all empty cells on the board.
 * @param {Array<string>} board - The current board state.
 * @returns {Array<number>} An array of indices of empty cells.
 */
function getEmptyCells(board) {
    return board.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
}

/**
 * The Minimax algorithm to determine the best move for the AI.
 * @param {Array<string>} newBoard - The current board state.
 * @param {string} player - The current player for whom to calculate the score ('O' for AI, 'X' for human).
 * @returns {object} An object containing the best score and the index of the best move.
 */
function minimax(newBoard, player) {
    const humanPlayer = 'X';
    const aiPlayer = 'O';

    const emptyCells = getEmptyCells(newBoard);

    // Base cases for recursion:
    // If AI wins, return a high score
    if (checkWinner(newBoard, aiPlayer)) {
        return { score: 10 };
    }
    // If Human wins, return a low score
    else if (checkWinner(newBoard, humanPlayer)) {
        return { score: -10 };
    }
    // If it's a draw (no empty cells and no winner)
    else if (emptyCells.length === 0) {
        return { score: 0 };
    }

    // Array to store all possible moves and their scores
    const moves = [];

    // Loop through available empty cells
    for (let i = 0; i < emptyCells.length; i++) {
        const move = {};
        move.index = emptyCells[i]; // Store the index of the move

        // Make the move on a copy of the board
        newBoard[move.index] = player;

        // Recursively call minimax for the next player
        if (player === aiPlayer) {
            const result = minimax(newBoard, humanPlayer);
            move.score = result.score;
        } else {
            const result = minimax(newBoard, aiPlayer);
            move.score = result.score;
        }

        // Undo the move (backtrack)
        newBoard[move.index] = '';

        // Store the move and its score
        moves.push(move);
    }

    // Determine the best move based on the current player
    let bestMove;
    if (player === aiPlayer) {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else { // Human player
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
}

/**
 * Finds the best move for the AI (Player 'O') based on difficulty.
 * @param {Array<string>} board - The current board state.
 * @param {string} aiPlayer - The AI's symbol ('O').
 * @param {string} difficulty - The AI difficulty ('easy', 'medium', 'hard').
 * @returns {number} The index of the best move, or -1 if no move is possible.
 */
export function findBestMove(board, aiPlayer, difficulty) {
    const emptyCells = getEmptyCells(board);
    if (emptyCells.length === 0) {
        return -1; // No moves possible
    }

    // If it's the first move, pick a corner or center for better strategy
    if (emptyCells.length === 9) { // Empty board
        const corners = [0, 2, 6, 8];
        const center = 4;
        // Prioritize center, then corners
        return Math.random() < 0.5 ? center : corners[Math.floor(Math.random() * corners.length)];
    }

    switch (difficulty) {
        case 'easy':
            // Easy AI: Random move
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        case 'medium':
            // Medium AI: 70% chance to play optimal, 30% chance to play random
            if (Math.random() < 0.7) {
                const bestMove = minimax(Array.from(board), aiPlayer);
                return bestMove.index;
            } else {
                return emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
        case 'hard':
        default:
            // Hard AI: Always plays optimal using Minimax
            const bestMove = minimax(Array.from(board), aiPlayer);
            return bestMove.index;
    }
}
