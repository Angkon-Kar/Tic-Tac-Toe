// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, query, where, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables for Firebase and app ID
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-tic-tac-toe-app';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase instances
let app;
let db;
let auth;
let userId = null; // Current user's ID

// Game state variables
let board = ['', '', '', '', '', '', '', '', '']; // Represents the 9 cells
let currentPlayer = 'X'; // 'X' or 'O'
let gameActive = true; // True if the game is ongoing
let gameMode = null; // 'localPvP', 'onlinePvP', 'PvC'

// Online Multiplayer specific variables
let currentGameId = null; // ID of the current online game
let currentPlayerRole = null; // 'X' or 'O' for the current user in online game
let unsubscribeGameListener = null; // To store the Firestore unsubscribe function
let hasPendingOnlineLobbyRequest = false; // New flag to track pending online lobby request

// Winning combinations for Tic Tac Toe
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// DOM Elements
const modeSelection = document.getElementById('modeSelection');
const localPvPButton = document.getElementById('localPvPButton');
const onlinePvPButton = document.getElementById('onlinePvPButton');
const pvcModeButton = document.getElementById('pvcModeButton');
const onlineLobbySection = document.getElementById('onlineLobbySection');
const userIdDisplay = document.getElementById('userIdDisplay');
const gameIdDisplay = document.getElementById('gameIdDisplay');
const copyGameIdButton = document.getElementById('copyGameIdButton');
const createGameButton = document.getElementById('createGameButton');
const joinGameIdInput = document.getElementById('joinGameIdInput');
const joinGameButton = document.getElementById('joinGameButton');
const backToModesFromOnline = document.getElementById('backToModesFromOnline');
const gameArea = document.getElementById('gameArea');
const gameStatus = document.getElementById('gameStatus');
const cells = document.querySelectorAll('.cell');
const resetButton = document.getElementById('resetButton');
const backToModesFromGame = document.getElementById('backToModesFromGame');
const customModal = document.getElementById('customModal');
const modalMessage = document.getElementById('modalMessage');
const modalCloseButton = document.getElementById('modalCloseButton');

/**
 * Displays a custom modal message to the user.
 * @param {string} message - The message to display.
 */
function showModal(message) {
    modalMessage.textContent = message;
    customModal.classList.remove('hidden');
}

/**
 * Hides the custom modal.
 */
function hideModal() {
    customModal.classList.add('hidden');
}

/**
 * Initializes Firebase and authenticates the user.
 * This runs once when the page loads.
 */
async function initializeFirebaseAndAuth() {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                userIdDisplay.textContent = userId;
                console.log("Authenticated with user ID:", userId);

                // If there was a pending request to show the online lobby, fulfill it now
                if (hasPendingOnlineLobbyRequest) {
                    hideModal(); // Hide the authentication modal
                    showOnlineLobbyInternal(); // Directly show the lobby
                    hasPendingOnlineLandingRequest = false; // Reset the flag
                }
            } else {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            }
        });
    } catch (error) {
        console.error("Error initializing Firebase or authenticating:", error);
        showModal("Failed to initialize Firebase. Online mode may not work.");
    }
}

/**
 * Internal function to show the online lobby, assuming authentication is done.
 */
function showOnlineLobbyInternal() {
    modeSelection.classList.add('hidden');
    onlineLobbySection.classList.remove('hidden');
    gameArea.classList.add('hidden');
    resetGameLocalState(); // Clear local game state
    gameStatus.textContent = ''; // Clear status
    gameIdDisplay.textContent = 'None';
    joinGameIdInput.value = '';
    currentGameId = null;
    currentPlayerRole = null;

    // Unsubscribe from any active online game listener
    if (unsubscribeGameListener) {
        unsubscribeGameListener();
        unsubscribeGameListener = null;
    }
}

/**
 * Public function to show the online lobby, handles authentication check.
 */
function showOnlineLobby() {
    if (!userId) {
        hasPendingOnlineLobbyRequest = true;
        showModal("Please wait, authenticating for online mode...");
        return;
    }
    showOnlineLobbyInternal();
}

/**
 * Shows the mode selection screen and hides other sections.
 */
function showModeSelection() {
    modeSelection.classList.remove('hidden');
    onlineLobbySection.classList.add('hidden');
    gameArea.classList.add('hidden');

    // Reset game state when returning to mode selection
    resetGameLocalState();
    gameStatus.textContent = ''; // Clear status
    gameIdDisplay.textContent = 'None';
    joinGameIdInput.value = '';
    currentGameId = null;
    currentPlayerRole = null;

    // Unsubscribe from any active online game listener
    if (unsubscribeGameListener) {
        unsubscribeGameListener();
        unsubscribeGameListener = null;
    }
    hasPendingOnlineLobbyRequest = false; // Reset this flag when leaving online flow
}

/**
 * Shows the game area and hides other sections.
 */
function showGameArea() {
    modeSelection.classList.add('hidden');
    onlineLobbySection.classList.add('hidden');
    gameArea.classList.remove('hidden');
    resetButton.style.display = 'block'; // Always show reset button in game
    backToModesFromGame.style.display = 'block'; // Show back button
}

/**
 * Resets the local game board and state variables.
 */
function resetGameLocalState() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('filled', 'x-player', 'o-player', 'cursor-not-allowed');
        cell.style.pointerEvents = 'auto'; // Re-enable clicks
    });
}

/**
 * Starts a new game based on the selected mode.
 * @param {string} mode - The game mode ('localPvP', 'onlinePvP', 'PvC').
 */
function startGame(mode) {
    gameMode = mode;
    resetGameLocalState();
    showGameArea(); // Show the game board

    if (gameMode === 'localPvP') {
        gameStatus.textContent = `Player X's Turn`;
    } else if (gameMode === 'PvC') {
        gameStatus.textContent = `Player X's Turn`;
        // If AI is 'O' and starts first (not in this game, player X always starts)
        // No need to call makeAIMove here as player X (user) always starts.
    }
    // For onlinePvP, status is managed by Firestore listener
}

/**
 * Handles a click on a game cell.
 * This function is universal for all modes.
 * @param {Event} clickedCellEvent - The click event object.
 */
async function handleCellClick(clickedCellEvent) {
    const clickedCellIndex = parseInt(clickedCellEvent.target.getAttribute('data-cell-index'));

    if (board[clickedCellIndex] !== '' || !gameActive) {
        return; // Cell already filled or game not active
    }

    if (gameMode === 'localPvP' || gameMode === 'PvC') {
        // Local game logic
        board[clickedCellIndex] = currentPlayer;
        cells[clickedCellIndex].textContent = currentPlayer;
        cells[clickedCellIndex].classList.add('filled', currentPlayer === 'X' ? 'x-player' : 'o-player');
        checkForGameEndLocal();
    } else if (gameMode === 'onlinePvP' && currentGameId && currentPlayerRole) {
        // Online game logic (requires Firestore update)
        // Fetch current game state to avoid race conditions
        const gameDocRef = doc(db, `artifacts/${appId}/public/data/ticTacToeGames`, currentGameId);
        const gameDocSnap = await getDoc(gameDocRef);

        if (!gameDocSnap.exists()) {
            showModal("Game not found or ended.");
            showOnlineLobby(); // Go back to lobby
            return;
        }

        const gameData = gameDocSnap.data();

        // Check if it's this player's turn and the cell is empty
        if (gameData.board[clickedCellIndex] !== '' || gameData.currentPlayer !== currentPlayerRole) {
            return; // Invalid move
        }

        // Update board and check for win/draw
        gameData.board[clickedCellIndex] = currentPlayerRole;
        let newStatusMessage = '';
        let newGameActive = true;
        let winner = null;

        let roundWon = false;
        for (let i = 0; i < winningConditions.length; i++) {
            const winCondition = winningConditions[i];
            const a = gameData.board[winCondition[0]];
            const b = gameData.board[winCondition[1]];
            const c = gameData.board[winCondition[2]];

            if (a === '' || b === '' || c === '') continue;
            if (a === b && b === c) {
                roundWon = true;
                break;
            }
        }

        if (roundWon) {
            newStatusMessage = `Player ${currentPlayerRole} Wins!`;
            newGameActive = false;
            winner = currentPlayerRole;
        } else if (!gameData.board.includes('')) {
            newStatusMessage = 'It\'s a Draw!';
            newGameActive = false;
            winner = 'Draw';
        } else {
            gameData.currentPlayer = (currentPlayerRole === 'X' ? 'O' : 'X');
            newStatusMessage = `Player ${gameData.currentPlayer}'s Turn`;
        }

        // Update Firestore
        try {
            await updateDoc(gameDocRef, {
                board: gameData.board,
                currentPlayer: gameData.currentPlayer,
                gameActive: newGameActive,
                statusMessage: newStatusMessage,
                winner: winner
            });
            console.log("Online move updated in Firestore.");
        } catch (error) {
            console.error("Error updating online game state:", error);
            showModal("Failed to make move. Please try again.");
        }
    }
}

/**
 * Checks for win/draw conditions for local and PvC modes.
 */
function checkForGameEndLocal() {
    let roundWon = false;
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
            break;
        }
    }

    if (roundWon) {
        gameStatus.textContent = `Player ${currentPlayer} Wins!`;
        gameActive = false;
        return;
    }

    const roundDraw = !board.includes('');
    if (roundDraw) {
        gameStatus.textContent = 'It\'s a Draw!';
        gameActive = false;
        return;
    }

    switchPlayerLocal(); // Continue game if no win/draw
}

/**
 * Switches the current player for local and PvC modes.
 */
function switchPlayerLocal() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    gameStatus.textContent = `Player ${currentPlayer}'s Turn`;

    if (gameMode === 'PvC' && currentPlayer === 'O' && gameActive) {
        setTimeout(makeAIMove, 700); // AI's turn
    }
}

/**
 * Implements the AI's move logic.
 */
function makeAIMove() {
    let availableCells = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            availableCells.push(i);
        }
    }

    if (availableCells.length > 0) {
        // Simple AI: pick a random available cell
        const randomIndex = Math.floor(Math.random() * availableCells.length);
        const aiMoveIndex = availableCells[randomIndex];

        board[aiMoveIndex] = currentPlayer;
        cells[aiMoveIndex].textContent = currentPlayer;
        cells[aiMoveIndex].classList.add('filled', 'o-player');
        checkForGameEndLocal();
    }
}

/**
 * Handles the reset game button click.
 * Behavior differs based on game mode.
 */
async function handleResetGame() {
    if (gameMode === 'localPvP' || gameMode === 'PvC') {
        resetGameLocalState();
        gameStatus.textContent = `Player X's Turn`;
        if (gameMode === 'PvC' && currentPlayer === 'O') { // If AI was 'O' and it's its turn
            setTimeout(makeAIMove, 700);
        }
    } else if (gameMode === 'onlinePvP' && currentGameId) {
        // Online reset: Player X resets the game in Firestore, Player O leaves.
        if (currentPlayerRole === 'X') {
            try {
                const gameDocRef = doc(db, `artifacts/${appId}/public/data/ticTacToeGames`, currentGameId);
                await updateDoc(gameDocRef, {
                    board: ['', '', '', '', '', '', '', '', ''],
                    currentPlayer: 'X',
                    gameActive: true,
                    statusMessage: `Waiting for opponent... Share Game ID: `,
                    winner: null
                });
                console.log("Online game reset by Player X.");
            } catch (error) {
                console.error("Error resetting online game:", error);
                showModal("Failed to reset online game. Please try again.");
            }
        } else if (currentPlayerRole === 'O') {
            try {
                const gameDocRef = doc(db, `artifacts/${appId}/public/data/ticTacToeGames`, currentGameId);
                const gameDocSnap = await getDoc(gameDocRef);
                if (gameDocSnap.exists() && gameDocSnap.data().playerOId === userId) {
                    await updateDoc(gameDocRef, {
                        playerOId: null, // Player O leaves
                        statusMessage: `Player O has left. Waiting for opponent...`
                    });
                }
                showModal("You have left the online game. Returning to lobby.");
                showOnlineLobby();
            } catch (error) {
                console.error("Error leaving online game:", error);
                showModal("Failed to leave online game. Please try again.");
            }
        }
    }
}

/**
 * Creates a new multiplayer game in Firestore.
 */
async function createNewOnlineGame() {
    if (!userId) {
        showModal("Please wait, authenticating user...");
        return;
    }

    try {
        const gamesCollectionRef = collection(db, `artifacts/${appId}/public/data/ticTacToeGames`);
        const newGameRef = await addDoc(gamesCollectionRef, {
            board: ['', '', '', '', '', '', '', '', ''],
            currentPlayer: 'X',
            gameActive: true,
            playerXId: userId,
            playerOId: null,
            statusMessage: `Waiting for opponent... Share Game ID: `,
            winner: null,
            createdAt: new Date()
        });

        currentGameId = newGameRef.id;
        currentPlayerRole = 'X';
        gameIdDisplay.textContent = currentGameId;
        showModal(`Game created! Share this ID with your friend: ${currentGameId}`);
        console.log("New online game created with ID:", currentGameId);

        startGame('onlinePvP'); // Switch to game view
        listenToOnlineGameUpdates(currentGameId); // Start listening for updates
    } catch (error) {
        console.error("Error creating new online game:", error);
        showModal("Failed to create online game. Please try again.");
    }
}

/**
 * Joins an existing multiplayer game in Firestore.
 * @param {string} gameIdToJoin - The ID of the game to join.
 */
async function joinOnlineGame(gameIdToJoin) {
    if (!userId) {
        showModal("Please wait, authenticating user...");
        return;
    }

    if (!gameIdToJoin) {
        showModal("Please enter a Game ID to join.");
        return;
    }

    try {
        const gameDocRef = doc(db, `artifacts/${appId}/public/data/ticTacToeGames`, gameIdToJoin);
        const gameDocSnap = await getDoc(gameDocRef);

        if (!gameDocSnap.exists()) {
            showModal("Game not found. Please check the ID.");
            return;
        }

        const gameData = gameDocSnap.data();

        if (gameData.playerXId && gameData.playerOId) {
            showModal("This game is already full. Please try another ID or create a new game.");
            return;
        }

        // If current user is already player X or O in this game, just join
        if (gameData.playerXId === userId) {
            currentPlayerRole = 'X';
        } else if (gameData.playerOId === userId) {
            currentPlayerRole = 'O';
        } else {
            // Assign current user as Player O if slot is available
            await updateDoc(gameDocRef, {
                playerOId: userId,
                statusMessage: `Player X's Turn` // Update status once both players are in
            });
            currentPlayerRole = 'O';
        }

        currentGameId = gameIdToJoin;
        gameIdDisplay.textContent = currentGameId;
        showModal(`Joined game: ${currentGameId}! You are Player ${currentPlayerRole}.`);
        console.log("Joined online game:", currentGameId, "as Player", currentPlayerRole);

        startGame('onlinePvP'); // Switch to game view
        listenToOnlineGameUpdates(currentGameId); // Start listening for updates
    } catch (error) {
        console.error("Error joining online game:", error);
        showModal("Failed to join online game. Please try again.");
    }
}

/**
 * Sets up a real-time listener for online game updates from Firestore.
 * @param {string} gameId - The ID of the game to listen to.
 */
function listenToOnlineGameUpdates(gameId) {
    const gameDocRef = doc(db, `artifacts/${appId}/public/data/ticTacToeGames`, gameId);

    // Unsubscribe from previous listener if any
    if (unsubscribeGameListener) {
        unsubscribeGameListener();
    }

    // Set up new listener
    unsubscribeGameListener = onSnapshot(gameDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const gameData = docSnap.data();
            console.log("Online game data updated:", gameData);

            // Update local game state based on Firestore data
            board = gameData.board;
            gameActive = gameData.gameActive;
            gameStatus.textContent = gameData.statusMessage;

            // Update UI based on new game state
            cells.forEach((cell, index) => {
                cell.textContent = gameData.board[index];
                cell.classList.remove('x-player', 'o-player', 'filled');
                if (gameData.board[index] === 'X') {
                    cell.classList.add('filled', 'x-player');
                } else if (gameData.board[index] === 'O') {
                    cell.classList.add('filled', 'o-player');
                }
            });

            // Enable/disable cells based on game state and current player's turn
            cells.forEach((cell, index) => {
                const isMyTurn = gameData.currentPlayer === currentPlayerRole;
                const isCellEmpty = gameData.board[index] === '';
                if (gameActive && isMyTurn && isCellEmpty) {
                    cell.style.pointerEvents = 'auto'; // Enable clicks
                    cell.classList.remove('cursor-not-allowed');
                } else {
                    cell.style.pointerEvents = 'none'; // Disable clicks
                    cell.classList.add('cursor-not-allowed');
                }
            });

            // Handle reset button visibility
            if (!gameActive && gameData.winner) { // Game ended with a winner or draw
                resetButton.style.display = 'block';
            } else {
                resetButton.style.display = 'none';
            }

        } else {
            console.log("Online game document no longer exists.");
            showModal("The online game you were in has ended or was deleted.");
            showOnlineLobby(); // Reset to lobby
        }
    }, (error) => {
        console.error("Error listening to online game updates:", error);
        showModal("Disconnected from online game. Please try rejoining.");
        showOnlineLobby(); // Reset to lobby on error
    });
}

// --- Event Listeners ---
window.onload = initializeFirebaseAndAuth; // Initialize Firebase on page load

// Mode Selection Buttons
localPvPButton.addEventListener('click', () => startGame('localPvP'));
onlinePvPButton.addEventListener('click', showOnlineLobby); // This now calls the wrapper function
pvcModeButton.addEventListener('click', () => startGame('PvC'));

// Online Lobby Buttons
createGameButton.addEventListener('click', createNewOnlineGame);
joinGameButton.addEventListener('click', () => {
    joinOnlineGame(joinGameIdInput.value.trim());
});
backToModesFromOnline.addEventListener('click', showModeSelection);

// Game Area Buttons (universal for all modes)
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetButton.addEventListener('click', handleResetGame);
backToModesFromGame.addEventListener('click', showModeSelection);

// Modal Close Button
modalCloseButton.addEventListener('click', hideModal);

// Copy Game ID Button
copyGameIdButton.addEventListener('click', () => {
    if (currentGameId) {
        const tempInput = document.createElement('textarea');
        tempInput.value = currentGameId;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showModal("Game ID copied to clipboard!");
    } else {
        showModal("No active game ID to copy.");
    }
});

// Initial view on page load
showModeSelection();