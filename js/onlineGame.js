// js/onlineGame.js

import { db, appId, getCurrentUserId } from './auth.js';
import * as UI from './ui.js';
import * as GameLogic from './gameLogic.js';
import { collection, doc, getDoc, addDoc, updateDoc, onSnapshot, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let currentGameId = null;
let currentPlayerRole = null; // 'X' or 'O' for the current user in online game
let unsubscribeGameListener = null; // To store the Firestore unsubscribe function
let unsubscribeChatListener = null; // To store the Firestore chat unsubscribe function
let unsubscribePublicLobbyListener = null; // To store the public lobby listener

const GAME_COLLECTION_PATH = `artifacts/${appId}/public/data/ticTacToeGames`;
const CHAT_COLLECTION_PATH = (gameId) => `artifacts/${appId}/public/data/ticTacToeGames/${gameId}/chatMessages`;

/**
 * Creates a new multiplayer game in Firestore.
 * @param {string} gameName - Optional name for the game.
 * @param {boolean} isPrivate - True if the game should be private.
 */
export async function createNewOnlineGame(gameName = '', isPrivate = false) {
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
            playerOId: null, // Player O is initially null
            statusMessage: `Waiting for opponent... Share Game ID: `,
            winner: null,
            gameName: gameName,
            isPrivate: isPrivate,
            scores: { xWins: 0, oWins: 0, draws: 0 }, // Initialize scores
            winningCells: null,
            createdAt: new Date()
        });

        currentGameId = newGameRef.id;
        currentPlayerRole = 'X'; // Set current user's role
        UI.setGameIdDisplay(currentGameId);
        UI.showModal(`Game created! Share this ID with your friend: ${currentGameId}`);
        console.log("OnlineGame: New game created with ID:", currentGameId);

        GameLogic.initializeGame('onlinePvP'); // Initialize game logic for online mode
        UI.showGameArea('onlinePvP'); // Switch to game view
        listenToOnlineGameUpdates(currentGameId); // Start listening for updates
        listenToChatUpdates(currentGameId); // Start listening for chat messages

    } catch (error) {
        console.error("OnlineGame: Error creating new game:", error);
        UI.showModal("Failed to create online game. Please try again.");
    }
}

/**
 * Joins an existing multiplayer game.
 * @param {string} gameIdToJoin - The ID of the game to join.
 */
export async function joinOnlineGame(gameIdToJoin) {
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
            UI.showModal("This game is already full. Please try another ID or create a new game.");
            return;
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
                statusMessage: `Player X's Turn` // Update status once both players are in
            });
            currentPlayerRole = 'O';
        }

        currentGameId = gameIdToJoin;
        UI.setGameIdDisplay(currentGameId);
        UI.showModal(`Joined game: ${currentGameId}! You are Player ${currentPlayerRole}.`);
        console.log("OnlineGame: Joined game:", currentGameId, "as Player", currentPlayerRole);

        GameLogic.initializeGame('onlinePvP'); // Initialize game logic for online mode
        UI.showGameArea('onlinePvP'); // Switch to game view
        listenToOnlineGameUpdates(currentGameId); // Start listening for updates
        listenToChatUpdates(currentGameId); // Start listening for chat messages

    } catch (error) {
        console.error("OnlineGame: Error joining game:", error);
        UI.showModal("Failed to join online game. Please try again.");
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

            // Update GameLogic's state
            GameLogic.setGameActive(gameData.gameActive);
            GameLogic.setScores(gameData.scores || { xWins: 0, oWins: 0, draws: 0 }); // Ensure scores are set

            // Update UI based on new game state
            UI.updateBoardUI(gameData.board);
            UI.setGameStatus(gameData.statusMessage);
            UI.updateScoreDisplay(GameLogic.getScores()); // Update score display

            // Enable/disable cells based on game state and current player's turn
            UI.setCellsInteractive(gameData.gameActive, gameData.board, gameData.currentPlayer, currentPlayerRole, 'onlinePvP');

            // Handle winning line highlight
            if (!gameData.gameActive && gameData.winner && gameData.winner !== 'Draw' && gameData.winningCells) {
                UI.highlightWinningCells(gameData.winningCells);
            }

            // Handle rematch button visibility
            if (!gameData.gameActive && gameData.winner) {
                UI.rematchButton.classList.remove('hidden');
            } else {
                UI.rematchButton.classList.add('hidden');
            }

        } else {
            console.log("OnlineGame: Game document no longer exists.");
            UI.showModal("The online game you were in has ended or was deleted.");
            GameLogic.setGameActive(false); // Ensure game is inactive
            UI.showOnlineLobby(true); // Reset to lobby (auth should be ready)
        }
    }, (error) => {
        console.error("OnlineGame: Error listening to game updates:", error);
        UI.showModal("Disconnected from online game. Please try rejoining.");
        GameLogic.setGameActive(false); // Ensure game is inactive
        UI.showOnlineLobby(true); // Reset to lobby (auth should be ready)
    });
}

/**
 * Handles a move in an online game and updates Firestore.
 * @param {number} clickedCellIndex - The index of the cell where the move was made.
 */
export async function handleOnlineMove(clickedCellIndex) {
    const userId = getCurrentUserId();
    if (!GameLogic.isGameActive() || !currentGameId || !currentPlayerRole || !userId) {
        console.log("OnlineGame: Cannot make move - game not active, no game ID, or no player role/user ID.");
        return;
    }

    try {
        const gameDocRef = doc(db, GAME_COLLECTION_PATH, currentGameId);
        const gameDocSnap = await getDoc(gameDocRef);

        if (!gameDocSnap.exists()) {
            UI.showModal("Game not found or ended.");
            UI.showOnlineLobby(true);
            return;
        }

        const gameData = gameDocSnap.data();

        // Check if it's this player's turn and the cell is empty
        if (gameData.board[clickedCellIndex] !== '' || gameData.currentPlayer !== currentPlayerRole) {
            console.log("OnlineGame: Invalid online move: not your turn or cell filled.");
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

        let roundWon = false; // Declare roundWon here
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

        if (roundWon) {
            newStatusMessage = `Player ${currentPlayerRole} Wins!`;
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
            gameData.currentPlayer = (currentPlayerRole === 'X' ? 'O' : 'X');
            newStatusMessage = `Player ${gameData.currentPlayer}'s Turn`;
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
 * Handles the reset/rematch logic for online games.
 * Player X can initiate a full reset/rematch. Player O leaves or accepts rematch.
 * @param {boolean} isRematchRequest - True if this is a rematch request, false for full reset/leave.
 */
export async function handleOnlineGameReset(isRematchRequest = false) {
    const userId = getCurrentUserId();
    if (!currentGameId || !currentPlayerRole || !userId) {
        UI.showModal("Not in an active online game.");
        UI.showOnlineLobby(true);
        return;
    }

    try {
        const gameDocRef = doc(db, GAME_COLLECTION_PATH, currentGameId);
        const gameDocSnap = await getDoc(gameDocRef);

        if (!gameDocSnap.exists()) {
            UI.showModal("Game not found or already ended.");
            UI.showOnlineLobby(true);
            return;
        }

        const gameData = gameDocSnap.data();
        const currentScores = gameData.scores || { xWins: 0, oWins: 0, draws: 0 }; // Get current scores

        if (currentPlayerRole === 'X') { // Player X (creator) initiates reset/rematch
            await updateDoc(gameDocRef, {
                board: ['', '', '', '', '', '', '', '', ''],
                currentPlayer: 'X',
                gameActive: true,
                statusMessage: `Waiting for opponent... Share Game ID: `,
                winner: null,
                winningCells: null, // Clear winning cells
                scores: isRematchRequest ? currentScores : { xWins: 0, oWins: 0, draws: 0 } // Reset scores only if not rematch
            });
            console.log("OnlineGame: Game reset/rematch initiated by Player X.");
            UI.rematchButton.classList.add('hidden'); // Hide rematch button after initiating
        } else if (currentPlayerRole === 'O') { // Player O leaves or accepts rematch
            if (isRematchRequest) {
                // Player O accepts rematch (just updates their view, X already reset the game)
                // The onSnapshot listener will handle updating O's UI
                UI.showModal("Rematch accepted! Starting new round.");
                console.log("OnlineGame: Player O accepted rematch.");
            } else {
                // Player O leaves the game
                await updateDoc(gameDocRef, {
                    playerOId: null, // Player O leaves the game
                    statusMessage: `Player O has left. Waiting for opponent...`
                });
                UI.showModal("You have left the online game. Returning to lobby.");
                console.log("OnlineGame: Player O left the game.");
                exitOnlineGame(); // Clean up and go to lobby
            }
        }
    } catch (error) {
        console.error("OnlineGame: Error handling online game reset/rematch:", error);
        UI.showModal("Failed to reset/leave game. Please try again.");
    }
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
    currentGameId = null;
    currentPlayerRole = null;
    UI.setGameIdDisplay('None');
    UI.clearChatMessages(); // Clear chat when leaving game
    UI.showOnlineLobby(true); // Return to lobby
}

/**
 * Sets up a real-time listener for public games in the lobby.
 */
export function listenToPublicLobby() {
    console.log("OnlineGame: Listening to public lobby updates.");
    const gamesCollectionRef = collection(db, GAME_COLLECTION_PATH);
    const q = query(gamesCollectionRef, where("isPrivate", "==", false), orderBy("createdAt", "desc")); // Only public games, newest first

    if (unsubscribePublicLobbyListener) {
        unsubscribePublicLobbyListener();
        console.log("OnlineGame: Unsubscribed from previous public lobby listener.");
    }

    unsubscribePublicLobbyListener = onSnapshot(q, (snapshot) => {
        const publicGames = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Only show games that are not full (playerOId is null)
            // and not created by the current user if they are already in a game
            // Also ensure game is active
            if (!data.isPrivate && !data.playerOId && data.playerXId !== getCurrentUserId() && data.gameActive) {
                publicGames.push({
                    gameId: doc.id,
                    gameName: data.gameName,
                    playerXId: data.playerXId,
                    playerOId: data.playerOId,
                    createdAt: data.createdAt
                });
            }
        });
        // Sorting is done by Firestore's orderBy, but client-side sort for robustness
        publicGames.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
        UI.renderPublicGames(publicGames, joinOnlineGame); // Pass join function as callback
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
    if (!currentGameId || !userId || messageText.trim() === '') {
        return;
    }

    try {
        const chatCollectionRef = collection(db, CHAT_COLLECTION_PATH(currentGameId));
        await addDoc(chatCollectionRef, {
            senderId: userId,
            sender: `Player ${currentPlayerRole} (${userId.substring(0, 4)})`, // Display a short ID
            text: messageText,
            timestamp: new Date()
        });
        UI.chatInput.value = ''; // Clear input
        console.log("OnlineGame: Chat message sent.");
    } catch (error) {
        console.error("OnlineGame: Error sending chat message:", error);
        UI.showModal("Failed to send message.");
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
        UI.clearChatMessages();
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
