// js/onlineGame.js

import { db, appId, getCurrentUserId } from './auth.js';
import * as UI from './ui.js';
import * as GameLogic from './gameLogic.js';
import { collection, doc, getDoc, addDoc, updateDoc, onSnapshot, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let currentGameId = null;
let currentPlayerRole = null; // 'X', 'O', or 'spectator' for the current user in online game
let unsubscribeGameListener = null; // To store the Firestore unsubscribe function
let unsubscribeChatListener = null; // To store the Firestore chat unsubscribe function
let unsubscribePublicLobbyListener = null; // To store the public lobby listener

const GAME_COLLECTION_PATH = `artifacts/${appId}/public/data/ticTacToeGames`;
const CHAT_COLLECTION_PATH = (gameId) => `artifacts/${appId}/public/data/ticTacToeGames/${gameId}/chatMessages`;

/**
 * Creates a new multiplayer game in Firestore.
 * @param {string} gameName - Optional name for the game.
 * @param {boolean} isPrivate - True if the game should be private.
 * @param {string} playerName - The name of the player creating the game.
 */
export async function createNewOnlineGame(gameName = '', isPrivate = false, playerName = 'Player X') {
    const userId = getCurrentUserId();
    if (!userId) {
        UI.showModal("Please wait, authenticating user...");
        return;
    }

    try {
        const gamesCollectionRef = collection(db, GAME_COLLECTION_PATH);
        const newGameRef = await addDoc(gamesCollectionRef, {
            board: ['', '', '', '', '', '', '', '', ''],
            currentPlayer: 'X',
            gameActive: true,
            playerXId: userId, // Creator is Player X
            playerXName: playerName, // Store creator's name
            playerOId: null, // Player O is initially null
            playerOName: null, // Player O name is initially null
            statusMessage: `Waiting for opponent... Share Game ID: `,
            winner: null,
            gameName: gameName, // Store game name
            isPrivate: isPrivate,
            scores: { xWins: 0, oWins: 0, draws: 0 }, // Initialize scores
            winningCells: null,
            createdAt: new Date()
        });

        currentGameId = newGameRef.id;
        currentPlayerRole = 'X'; // Set current user's role
        UI.setGameIdDisplay(currentGameId);
        UI.showModal(`Game created! Share this ID with your friend: ${currentGameId}\n(You are Player X)`);
        console.log("OnlineGame: New game created with ID:", currentGameId);

        GameLogic.initializeGame('onlinePvP', false, { X: playerName, O: 'Player O' }); // Initialize game logic with names
        UI.showGameArea('onlinePvP', currentPlayerRole); // Pass player role for UI logic
        listenToOnlineGameUpdates(currentGameId); // Start listening for updates
        listenToChatUpdates(currentGameId); // Start listening for chat messages

    } catch (error) {
        console.error("OnlineGame: Error creating new game:", error);
        UI.showModal("Failed to create online game. Please try again.");
    }
}

/**
 * Joins an existing multiplayer game as a player.
 * @param {string} gameIdToJoin - The ID of the game to join.
 * @param {string} playerName - The name of the player joining the game.
 */
export async function joinOnlineGame(gameIdToJoin, playerName = 'Player O') {
    const userId = getCurrentUserId();
    if (!userId) {
        UI.showModal("Please wait, authenticating user...");
        return;
    }
    if (!gameIdToJoin) {
        UI.showModal("Please enter a Game ID to join.");
        return;
    }

    try {
        const gameDocRef = doc(db, GAME_COLLECTION_PATH, gameIdToJoin);
        const gameDocSnap = await getDoc(gameDocRef);

        if (!gameDocSnap.exists()) {
            UI.showModal("Game not found. Please check the ID.");
            return;
        }

        const gameData = gameDocSnap.data();

        // Check if the game already has two players and current user is not one of them
        if (gameData.playerXId && gameData.playerOId && gameData.playerXId !== userId && gameData.playerOId !== userId) {
            UI.showModal("This game is already full. You can spectate instead.");
            return; // Suggest spectating
        }

        // If current user is already player X or O in this game, just re-join
        if (gameData.playerXId === userId) {
            currentPlayerRole = 'X';
        } else if (gameData.playerOId === userId) {
            currentPlayerRole = 'O';
        } else {
            // Assign current user as Player O if slot is available
            await updateDoc(gameDocRef, {
                playerOId: userId,
                playerOName: playerName, // Store Player O's name
                statusMessage: `${gameData.playerXName || 'Player X'}'s Turn` // Update status once both players are in
            });
            currentPlayerRole = 'O';
        }

        currentGameId = gameIdToJoin;
        UI.setGameIdDisplay(currentGameId);
        UI.showModal(`Joined game: ${currentGameId}! You are Player ${currentPlayerRole}.`);
        console.log("OnlineGame: Joined game:", currentGameId, "as Player", currentPlayerRole);

        // Initialize game logic with updated names
        GameLogic.initializeGame('onlinePvP', false, { X: gameData.playerXName || 'Player X', O: playerName });
        UI.showGameArea('onlinePvP', currentPlayerRole); // Pass player role for UI logic
        listenToOnlineGameUpdates(currentGameId); // Start listening for updates
        listenToChatUpdates(currentGameId); // Start listening for chat messages

    } catch (error) {
        console.error("OnlineGame: Error joining game:", error);
        UI.showModal("Failed to join online game. Please try again.");
    }
}

/**
 * Joins an existing multiplayer game as a spectator.
 * @param {string} gameIdToSpectate - The ID of the game to spectate.
 */
export async function spectateOnlineGame(gameIdToSpectate) {
    const userId = getCurrentUserId();
    if (!userId) {
        UI.showModal("Please wait, authenticating user...");
        return;
    }
    if (!gameIdToSpectate) {
        UI.showModal("Invalid Game ID for spectating.");
        return;
    }

    try {
        const gameDocRef = doc(db, GAME_COLLECTION_PATH, gameIdToSpectate);
        const gameDocSnap = await getDoc(gameDocRef);

        if (!gameDocSnap.exists()) {
            UI.showModal("Game not found or ended.");
            return;
        }

        const gameData = gameDocSnap.data();
        if (!gameData.playerXId || !gameData.playerOId) {
            UI.showModal("This game is not yet full. You can join as a player if a slot is available.");
            return;
        }

        currentGameId = gameIdToSpectate;
        currentPlayerRole = 'spectator'; // Set current user's role as spectator
        UI.setGameIdDisplay(currentGameId);
        UI.showModal(`Spectating game: ${gameIdToSpectate}!`);
        console.log("OnlineGame: Spectating game:", gameIdToSpectate);

        // Initialize game logic with current player names from gameData
        GameLogic.initializeGame('onlinePvP', false, { X: gameData.playerXName || 'Player X', O: gameData.playerOName || 'Player O' });
        UI.showGameArea('onlinePvP', currentPlayerRole); // Pass spectator role for UI logic
        listenToOnlineGameUpdates(currentGameId); // Start listening for updates
        listenToChatUpdates(currentGameId); // Start listening for chat messages

    } catch (error) {
        console.error("OnlineGame: Error spectating game:", error);
        UI.showModal("Failed to spectate game. Please try again.");
    }
}


/**
 * Sets up a real-time listener for game updates from Firestore.
 * @param {string} gameId - The ID of the game to listen to.
 */
function listenToOnlineGameUpdates(gameId) {
    console.log("OnlineGame: Listening to online game updates for ID:", gameId);
    const gameDocRef = doc(db, GAME_COLLECTION_PATH, gameId);

    // Unsubscribe from previous listener if any
    if (unsubscribeGameListener) {
        unsubscribeGameListener();
        console.log("OnlineGame: Unsubscribed from previous game listener.");
    }

    // Set up new listener
    unsubscribeGameListener = onSnapshot(gameDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const gameData = docSnap.data();
            console.log("OnlineGame: Game data updated:", gameData);

            // Update GameLogic's state and player names
            GameLogic.setGameActive(gameData.gameActive);
            GameLogic.setScores(gameData.scores || { xWins: 0, oWins: 0, draws: 0 });
            GameLogic.initializeGame('onlinePvP', true, { X: gameData.playerXName || 'Player X', O: gameData.playerOName || 'Player O' }); // Update names in GameLogic

            // Update UI based on new game state
            UI.updateBoardUI(gameData.board);
            UI.setGameStatus(gameData.statusMessage);
            UI.updateScoreDisplay(GameLogic.getScores());

            // Enable/disable cells based on game state and current player's turn, and role
            UI.setCellsInteractive(gameData.gameActive, gameData.board, gameData.currentPlayer, currentPlayerRole, 'onlinePvP');

            // Handle winning line highlight
            if (!gameData.gameActive && gameData.winner && gameData.winner !== 'Draw' && gameData.winningCells) {
                UI.highlightWinningCells(gameData.winningCells);
            }

            // Handle "Start New Round" and "Leave Game" button visibility
            const startNewRoundButton = UI.getStartNewRoundButton();
            const leaveGameButton = UI.getLeaveGameButton();
            const exitSpectatorModeButton = UI.getExitSpectatorModeButton();

            if (currentPlayerRole === 'spectator') {
                if (startNewRoundButton) startNewRoundButton.classList.add('hidden');
                if (leaveGameButton) leaveGameButton.classList.add('hidden');
                if (exitSpectatorModeButton) exitSpectatorModeButton.classList.remove('hidden'); // Only show exit for spectator
            } else { // Player X or O
                if (exitSpectatorModeButton) exitSpectatorModeButton.classList.add('hidden');

                if (!gameData.gameActive && gameData.winner) { // Game has ended
                    if (currentPlayerRole === 'X') {
                        if (startNewRoundButton) startNewRoundButton.classList.remove('hidden'); // Show "Start New Round" for Player X
                    }
                    if (leaveGameButton) leaveGameButton.classList.remove('hidden'); // Show "Leave Game" for both players
                } else { // Game is active or waiting
                    if (startNewRoundButton) startNewRoundButton.classList.add('hidden'); // Hide "Start New Round"
                    if (leaveGameButton) leaveGameButton.classList.remove('hidden'); // Always show "Leave Game"
                }
            }

        } else {
            console.log("OnlineGame: Game document no longer exists.");
            UI.showModal("The online game you were in has ended or was deleted. Returning to lobby.");
            GameLogic.setGameActive(false); // Ensure game is inactive
            exitOnlineGame(); // Reset to lobby
        }
    }, (error) => {
        console.error("OnlineGame: Error listening to game updates:", error);
        UI.showModal("Disconnected from online game. Please try rejoining. Returning to lobby.");
        GameLogic.setGameActive(false); // Ensure game is inactive
        exitOnlineGame(); // Reset to lobby on error
    });
}

/**
 * Handles a move in an online game and updates Firestore.
 * @param {number} clickedCellIndex - The index of the cell where the move was made.
 */
export async function handleOnlineMove(clickedCellIndex) {
    const userId = getCurrentUserId();
    if (!GameLogic.isGameActive() || !currentGameId || !currentPlayerRole || currentPlayerRole === 'spectator' || !userId) {
        console.log("OnlineGame: Cannot make move - game not active, no game ID, or not a player role/user ID.");
        UI.showModal("You cannot make moves in this game. You are a spectator or not a player.");
        return;
    }

    try {
        const gameDocRef = doc(db, GAME_COLLECTION_PATH, currentGameId);
        const gameDocSnap = await getDoc(gameDocRef);

        if (!gameDocSnap.exists()) {
            UI.showModal("Game not found or ended.");
            exitOnlineGame(); // Go back to lobby
            return;
        }

        const gameData = gameDocSnap.data();

        // Check if it's this player's turn and the cell is empty
        if (gameData.board[clickedCellIndex] !== '' || gameData.currentPlayer !== currentPlayerRole) {
            console.log("OnlineGame: Invalid online move: not your turn or cell filled.");
            UI.showModal("It's not your turn or the cell is already taken.");
            return;
        }

        // --- Update board and check for win/draw ---
        const newBoard = [...gameData.board]; // Create a copy to modify
        newBoard[clickedCellIndex] = currentPlayerRole;

        let newStatusMessage = '';
        let newGameActive = true;
        let winner = null;
        let winningCells = null;

        const winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        let roundWon = false;
        for (let i = 0; i < winningConditions.length; i++) {
            const winCondition = winningConditions[i];
            const a = newBoard[winCondition[0]];
            const b = newBoard[winCondition[1]];
            const c = newBoard[winCondition[2]];
            if (a === '' || b === '' || c === '') continue;
            if (a === b && b === c) {
                roundWon = true;
                winningCells = winCondition;
                break;
            }
        }

        const playerNamesInGame = {
            X: gameData.playerXName || 'Player X',
            O: gameData.playerOName || 'Player O'
        };

        if (roundWon) {
            newStatusMessage = `${playerNamesInGame[currentPlayerRole]} Wins!`;
            newGameActive = false;
            winner = currentPlayerRole;
            // Update scores for the winner
            const currentScores = gameData.scores || { xWins: 0, oWins: 0, draws: 0 };
            if (winner === 'X') {
                currentScores.xWins++;
            } else if (winner === 'O') {
                currentScores.oWins++;
            }
            gameData.scores = currentScores; // Update scores in gameData
        } else if (!newBoard.includes('')) {
            newStatusMessage = 'It\'s a Draw!';
            newGameActive = false;
            winner = 'Draw';
            // Update draws score
            const currentScores = gameData.scores || { xWins: 0, oWins: 0, draws: 0 };
            currentScores.draws++;
            gameData.scores = currentScores; // Update scores in gameData
        } else {
            const nextPlayer = (currentPlayerRole === 'X' ? 'O' : 'X');
            gameData.currentPlayer = nextPlayer;
            newStatusMessage = `${playerNamesInGame[nextPlayer]}'s Turn`;
        }

        // Update Firestore document
        await updateDoc(gameDocRef, {
            board: newBoard,
            currentPlayer: gameData.currentPlayer,
            gameActive: newGameActive,
            statusMessage: newStatusMessage,
            winner: winner,
            winningCells: winningCells, // Store winning cells for highlight
            scores: gameData.scores // Store updated scores
        });
        console.log("OnlineGame: Move successfully updated in Firestore.");

    } catch (error) {
        console.error("OnlineGame: Error updating online game state:", error);
        UI.showModal("Failed to make move. Please try again.");
    }
}

/**
 * Handles starting a new round in an online game (only for Player X).
 */
export async function startNewOnlineRound() {
    const userId = getCurrentUserId();
    if (!currentGameId || currentPlayerRole !== 'X' || !userId) {
        UI.showModal("Only Player X (game creator) can start a new round.");
        return;
    }

    try {
        const gameDocRef = doc(db, GAME_COLLECTION_PATH, currentGameId);
        const gameDocSnap = await getDoc(gameDocRef);

        if (!gameDocSnap.exists()) {
            UI.showModal("Game not found or already ended.");
            exitOnlineGame();
            return;
        }

        // Preserve current scores, only reset board and active state
        const gameData = gameDocSnap.data();
        const currentScores = gameData.scores || { xWins: 0, oWins: 0, draws: 0 };

        await updateDoc(gameDocRef, {
            board: ['', '', '', '', '', '', '', '', ''],
            currentPlayer: 'X',
            gameActive: true,
            statusMessage: `${gameData.playerXName || 'Player X'}'s Turn`, // Game is active, so X's turn
            winner: null,
            winningCells: null, // Clear winning cells
            scores: currentScores // Preserve scores
        });
        console.log("OnlineGame: New online round started by Player X.");
        UI.getStartNewRoundButton().classList.add('hidden'); // Hide after starting
        UI.getLeaveGameButton().classList.remove('hidden'); // Ensure leave button is visible
    } catch (error) {
        console.error("OnlineGame: Error starting new online round:", error);
        UI.showModal("Failed to start new round. Please try again.");
    }
}

/**
 * Handles a player leaving an online game.
 */
export async function leaveOnlineGame() {
    const userId = getCurrentUserId();
    if (!currentGameId || !currentPlayerRole || !userId) {
        UI.showModal("Not in an active online game.");
        exitOnlineGame();
        return;
    }

    try {
        const gameDocRef = doc(db, GAME_COLLECTION_PATH, currentGameId);
        const gameDocSnap = await getDoc(gameDocRef);

        if (!gameDocSnap.exists()) {
            // If game doesn't exist, just exit locally
            console.log("OnlineGame: Game not found on leave attempt, exiting locally.");
            exitOnlineGame();
            return;
        }

        const gameData = gameDocSnap.data();

        if (currentPlayerRole === 'X') {
            // Player X leaving: Game is essentially abandoned or waiting for new Player X
            await updateDoc(gameDocRef, {
                playerXId: null, // Player X leaves
                playerXName: null,
                playerOId: null, // Also clear Player O if exists, as game is no longer valid
                playerOName: null,
                gameActive: false, // Game becomes inactive
                statusMessage: `Game creator left. Game ended.`,
                winner: 'Abandoned'
            });
            UI.showModal("You have left the game as Player X. The game has ended.");
        } else if (currentPlayerRole === 'O') {
            // Player O leaving: Game can continue with a new Player O
            await updateDoc(gameDocRef, {
                playerOId: null, // Player O leaves
                playerOName: null,
                statusMessage: `${gameData.playerXName || 'Player X'} is waiting for opponent...`
            });
            UI.showModal("You have left the online game. Returning to lobby.");
        }
        console.log(`OnlineGame: Player ${currentPlayerRole} (${userId}) left game ${currentGameId}.`);
        exitOnlineGame(); // Clean up and go to lobby
    } catch (error) {
        console.error("OnlineGame: Error leaving online game:", error);
        UI.showModal("Failed to leave game. Please try again.");
    }
}

/**
 * Handles a spectator exiting the game view.
 */
export function exitSpectatorMode() {
    console.log("OnlineGame: Exiting spectator mode.");
    exitOnlineGame(); // Use the common exit function
}

/**
 * Cleans up online game state and returns to the lobby.
 */
export function exitOnlineGame() {
    if (unsubscribeGameListener) {
        unsubscribeGameListener();
        unsubscribeGameListener = null;
        console.log("OnlineGame: Unsubscribed from game listener.");
    }
    if (unsubscribeChatListener) {
        unsubscribeChatListener();
        unsubscribeChatListener = null;
        console.log("OnlineGame: Unsubscribed from chat listener.");
    }
    // Do NOT unsubscribe public lobby listener here, it should persist
    // if (unsubscribePublicLobbyListener) {
    //     unsubscribePublicLobbyListener();
    //     unsubscribePublicLobbyListener = null;
    //     console.log("OnlineGame: Unsubscribed from public lobby listener.");
    // }
    currentGameId = null;
    currentPlayerRole = null;
    UI.setGameIdDisplay('None');
    UI.clearChatMessages(); // Clear chat when leaving game
    UI.showOnlineLobby(true); // Return to lobby (auth should be ready)
}

/**
 * Sets up a real-time listener for public games in the lobby.
 */
export function listenToPublicLobby() {
    console.log("OnlineGame: Listening to public lobby updates.");
    const gamesCollectionRef = collection(db, GAME_COLLECTION_PATH);
    // Query for public games that are active and waiting for Player O, or are full and active (for spectating)
    const q = query(
        gamesCollectionRef,
        where("isPrivate", "==", false),
        where("gameActive", "==", true), // Only show active games
        orderBy("createdAt", "desc")
    );

    if (unsubscribePublicLobbyListener) {
        unsubscribePublicLobbyListener();
        console.log("OnlineGame: Unsubscribed from previous public lobby listener.");
    }

    unsubscribePublicLobbyListener = onSnapshot(q, (snapshot) => {
        const publicGames = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Only show games that are not created by the current user if they are already in a game
            // or if the game is full and they want to spectate.
            // If the current user is already player X or O in this game, don't show it in the lobby to join/spectate
            if (data.playerXId !== getCurrentUserId() && data.playerOId !== getCurrentUserId()) {
                publicGames.push({
                    gameId: doc.id,
                    gameName: data.gameName,
                    playerXId: data.playerXId,
                    playerXName: data.playerXName,
                    playerOId: data.playerOId,
                    playerOName: data.playerOName,
                    createdAt: data.createdAt // Firestore Timestamp
                });
            }
        });
        // Sort by creation date, newest first (Firestore orderBy handles most, but client-side for robustness)
        publicGames.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
        UI.renderPublicGames(publicGames, joinOnlineGame, spectateOnlineGame); // Pass join and spectate functions
        console.log("OnlineGame: Public games updated:", publicGames.length);
    }, (error) => {
        console.error("OnlineGame: Error listening to public lobby:", error);
        UI.publicGamesList.innerHTML = '<p class="text-red-500 dark:text-red-400">Failed to load public games.</p>';
    });
}

/**
 * Sends a chat message to Firestore.
 * @param {string} messageText - The text of the message.
 */
export async function sendChatMessage(messageText) {
    const userId = getCurrentUserId();
    const currentUserName = UI.getOnlinePlayerNameInput().value.trim(); // Get name from online player input
    const playerRole = getCurrentPlayerRole();

    if (!currentGameId || !userId || messageText.trim() === '') {
        console.log("OnlineGame: Cannot send message - no game ID, user ID, or empty message.");
        UI.showModal("Cannot send empty message or not in a game."); // Provide user feedback
        return;
    }

    try {
        const chatCollectionRef = collection(db, CHAT_COLLECTION_PATH(currentGameId));
        await addDoc(chatCollectionRef, {
            senderId: userId,
            sender: `${currentUserName || `Guest (${userId.substring(0, 4)})`} (${playerRole})`, // Display name and role
            text: messageText,
            timestamp: new Date()
        });
        UI.getChatInput().value = ''; // Clear input using getter
        console.log("OnlineGame: Chat message sent.");
    } catch (error) {
        console.error("OnlineGame: Error sending chat message:", error);
        UI.showModal("Failed to send message. Check console for details.");
    }
}

/**
 * Sets up a real-time listener for chat messages.
 * @param {string} gameId - The ID of the game whose chat to listen to.
 */
function listenToChatUpdates(gameId) {
    console.log("OnlineGame: Listening to chat updates for game ID:", gameId);
    const chatCollectionRef = collection(db, CHAT_COLLECTION_PATH(gameId));
    const q = query(chatCollectionRef, orderBy("timestamp")); // Order by timestamp

    if (unsubscribeChatListener) {
        unsubscribeChatListener();
        console.log("OnlineGame: Unsubscribed from previous chat listener.");
    }
    UI.clearChatMessages(); // Clear existing messages when starting new chat listener

    unsubscribeChatListener = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach(doc => {
            messages.push(doc.data());
        });
        console.log("OnlineGame: New chat messages:", messages.length);
        // Re-render all messages to ensure correct order and self-styling
        messages.forEach(msg => UI.addChatMessage(msg, getCurrentUserId()));
    }, (error) => {
        console.error("OnlineGame: Error listening to chat updates:", error);
    });
}

// Export current game ID and player role for other modules to reference
export function getCurrentGameId() {
    return currentGameId;
}

export function getCurrentPlayerRole() {
    return currentPlayerRole;
}
