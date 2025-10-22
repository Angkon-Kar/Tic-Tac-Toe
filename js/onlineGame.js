// js/onlineGame.js

import { db, appId, getCurrentUserId } from './auth.js';
import * as UI from './ui.js';
import * as GameLogic from './gameLogic.js';
import { collection, doc, getDoc, addDoc, updateDoc, onSnapshot, query, where, getDocs, orderBy, deleteDoc, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let currentGameId = null;
let currentPlayerRole = null; // 'X' or 'O' for the current user in online game, or 'spectator'
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
    const userName = UI.getOnlinePlayerNameInput()?.value || `Player (${userId.substring(0, 4)})`;

    if (!userId) {
        UI.showModal("Please wait, authenticating user...");
        return;
    }

    try {
        UI.showModal("Creating new game...");
        const gamesCollectionRef = collection(db, GAME_COLLECTION_PATH);
        const newGameData = {
            gameName: gameName,
            isPrivate: isPrivate,
            playerXId: userId,
            playerXName: userName,
            playerOId: null, // Waiting for player O
            playerOName: null,
            board: ['', '', '', '', '', '', '', '', ''],
            currentPlayer: 'X',
            gameActive: true,
            scores: { xWins: 0, oWins: 0, draws: 0 },
            rematchRequested: { X: false, O: false },
            createdAt: Date.now()
        };

        const newGameRef = await addDoc(gamesCollectionRef, newGameData);
        currentGameId = newGameRef.id;
        currentPlayerRole = 'X';
        console.log("OnlineGame: Game created with ID:", currentGameId);

        UI.hideModal();
        UI.setGameIdDisplay(currentGameId);
        UI.showGameArea('onlinePvP', currentPlayerRole);

        // Stop public lobby listener and start listening to the specific game
        stopListeningToPublicLobby();
        listenToGameUpdates(currentGameId);
        listenToChatUpdates(currentGameId);
    } catch (error) {
        console.error("OnlineGame: Error creating game:", error);
        UI.showModal("Failed to create game. Please try again.");
    }
}

/**
 * Joins an existing multiplayer game as Player 'O'.
 * @param {string} gameId - The ID of the game to join.
 */
export async function joinOnlineGame(gameId) {
    const userId = getCurrentUserId();
    const userName = UI.getOnlinePlayerNameInput()?.value || `Player (${userId.substring(0, 4)})`;
    
    if (!userId) {
        UI.showModal("Please wait, authenticating user...");
        return;
    }

    try {
        UI.showModal(`Attempting to join game ${gameId}...`);
        const gameRef = doc(db, GAME_COLLECTION_PATH, gameId);

        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);

            if (!gameDoc.exists()) {
                throw "Game not found.";
            }

            const data = gameDoc.data();

            if (data.playerOId) {
                // If it's a private game and it's full, allow spectating
                if (data.isPrivate) {
                    throw "Game is full and private. Cannot join as a player.";
                }
                // If it's a public game and full, allow spectating
                if (!data.isPrivate) {
                    await spectateGame(gameId); // Redirect to spectate if full public
                    throw "Game is full. Joining as Spectator.";
                }
            }

            // Join as Player O
            transaction.update(gameRef, {
                playerOId: userId,
                playerOName: userName,
            });
        });

        // Transaction successful
        currentGameId = gameId;
        currentPlayerRole = 'O';
        console.log("OnlineGame: Joined game as O:", currentGameId);

        UI.hideModal();
        UI.setGameIdDisplay(currentGameId);
        UI.showGameArea('onlinePvP', currentPlayerRole);
        
        stopListeningToPublicLobby();
        listenToGameUpdates(currentGameId);
        listenToChatUpdates(currentGameId);

    } catch (error) {
        console.error("OnlineGame: Error joining game:", error);
        UI.showModal(`Failed to join game: ${error.message || error}`);
        listenToPublicLobby(); // Re-enable lobby listener
    }
}

/**
 * Spectates an existing multiplayer game.
 * @param {string} gameId - The ID of the game to spectate.
 */
export async function spectateGame(gameId) {
    const userId = getCurrentUserId();
    if (!userId) {
        UI.showModal("Please wait, authenticating user...");
        return;
    }

    try {
        const gameRef = doc(db, GAME_COLLECTION_PATH, gameId);
        const gameDoc = await getDoc(gameRef);

        if (!gameDoc.exists()) {
            throw new Error("Game not found.");
        }

        currentGameId = gameId;
        currentPlayerRole = 'spectator';
        console.log("OnlineGame: Spectating game:", currentGameId);

        UI.hideModal();
        UI.setGameIdDisplay(currentGameId);
        UI.showGameArea('onlinePvP', currentPlayerRole);
        
        stopListeningToPublicLobby();
        listenToGameUpdates(currentGameId);
        listenToChatUpdates(currentGameId);

    } catch (error) {
        console.error("OnlineGame: Error spectating game:", error);
        UI.showModal(`Failed to spectate game: ${error.message}`);
    }
}


/**
 * Sends a move to the Firestore database.
 * @param {Array<string>} newBoard - The new board state.
 * @param {string} lastPlayer - The player who just made the move.
 */
export async function sendGameUpdate(newBoard, lastPlayer) {
    if (!currentGameId || !currentPlayerRole || currentPlayerRole === 'spectator') return;

    const gameRef = doc(db, GAME_COLLECTION_PATH, currentGameId);
    const nextPlayer = lastPlayer === 'X' ? 'O' : 'X';
    const gameEndResult = GameLogic.checkGameEnd(newBoard);
    let gameActive = true;
    let newScores = GameLogic.getScores();

    if (gameEndResult) {
        gameActive = false;
        
        if (Array.isArray(gameEndResult)) { // Winner
            newScores[lastPlayer.toLowerCase() + 'Wins']++;
        } else { // Draw
            newScores.draws++;
        }
        GameLogic.setScores(newScores); // Update local scores for consistency
    }

    try {
        await updateDoc(gameRef, {
            board: newBoard,
            currentPlayer: nextPlayer,
            gameActive: gameActive,
            scores: newScores,
            rematchRequested: { X: false, O: false } // Reset rematch on new move
        });
        console.log(`OnlineGame: Move sent. Player ${lastPlayer} played at index ${newBoard.findIndex((val, i) => newBoard[i] === lastPlayer && GameLogic.getBoard()[i] !== lastPlayer)}`);
        // The listener will update the UI
    } catch (error) {
        console.error("OnlineGame: Error sending game update:", error);
        UI.showModal("Failed to send move to server. Check connection.");
    }
}

/**
 * Sets up a real-time listener for game updates.
 * @param {string} gameId - The ID of the game to listen to.
 */
function listenToGameUpdates(gameId) {
    if (unsubscribeGameListener) {
        unsubscribeGameListener();
        console.log("OnlineGame: Unsubscribed from previous game listener.");
    }

    const gameRef = doc(db, GAME_COLLECTION_PATH, gameId);
    unsubscribeGameListener = onSnapshot(gameRef, (doc) => {
        if (doc.exists()) {
            const gameState = doc.data();
            console.log("OnlineGame: Received game update.");
            GameLogic.updateGameFromOnline(gameState, currentPlayerRole);
        } else {
            console.warn("OnlineGame: Game document no longer exists!");
            leaveOnlineGame(true); // Treat as game deleted/abandoned
            UI.showModal("The game has been deleted or abandoned by the host.");
        }
    }, (error) => {
        console.error("OnlineGame: Error listening to game updates:", error);
    });
}

/**
 * Requests a rematch in an online game.
 */
export async function requestRematch() {
    if (!currentGameId || !currentPlayerRole || currentPlayerRole === 'spectator') return;

    const gameRef = doc(db, GAME_COLLECTION_PATH, currentGameId);
    const update = {};
    update[`rematchRequested.${currentPlayerRole}`] = true;

    try {
        await updateDoc(gameRef, update);
        UI.getStartNewRoundButton().classList.add('hidden'); // Hide the button immediately

        // Check if both players requested rematch
        const gameDoc = await getDoc(gameRef);
        if (gameDoc.exists()) {
            const data = gameDoc.data();
            if (data.rematchRequested.X && data.rematchRequested.O) {
                // Start a new round
                await updateDoc(gameRef, {
                    board: ['', '', '', '', '', '', '', '', ''],
                    currentPlayer: 'X',
                    gameActive: true,
                    rematchRequested: { X: false, O: false }
                });
            } else {
                UI.setGameStatus(`Rematch requested! Waiting for ${currentPlayerRole === 'X' ? data.playerOName : data.playerXName}...`);
            }
        }
    } catch (error) {
        console.error("OnlineGame: Error requesting rematch:", error);
        UI.showModal("Failed to request rematch.");
    }
}

/**
 * Leaves the current online game and returns to the lobby.
 * @param {boolean} isGameDeleted - True if the game document was deleted by someone else.
 */
export async function leaveOnlineGame(isGameDeleted = false) {
    if (!currentGameId) return;

    const userId = getCurrentUserId();
    const gameRef = doc(db, GAME_COLLECTION_PATH, currentGameId);

    // Unsubscribe from listeners
    if (unsubscribeGameListener) unsubscribeGameListener();
    if (unsubscribeChatListener) unsubscribeChatListener();

    // Cleanup: If a player leaves, clear their role. If X leaves a 1-player game, delete the game.
    if (!isGameDeleted && currentPlayerRole !== 'spectator') {
        try {
            await runTransaction(db, async (transaction) => {
                const gameDoc = await transaction.get(gameRef);
                if (!gameDoc.exists()) return;

                const data = gameDoc.data();
                
                if (data.playerXId === userId) {
                    if (data.playerOId) {
                        // X leaves, O becomes X, game continues
                        transaction.update(gameRef, {
                            playerXId: data.playerOId,
                            playerXName: data.playerOName,
                            playerOId: null,
                            playerOName: null,
                            // X always starts, so new X (old O) is current player
                            currentPlayer: 'X', 
                            gameActive: false // Pause game until new O joins
                        });
                    } else {
                        // X leaves, no O, delete the game
                        transaction.delete(gameRef);
                        console.log("OnlineGame: Game deleted by host (Player X).");
                    }
                } else if (data.playerOId === userId) {
                    // O leaves, clear O's spot, game is paused
                    transaction.update(gameRef, {
                        playerOId: null,
                        playerOName: null,
                        gameActive: false // Pause game
                    });
                }
            });
        } catch (error) {
            console.error("OnlineGame: Error cleaning up game state:", error);
        }
    }
    
    // Reset local state and navigate
    currentGameId = null;
    currentPlayerRole = null;
    GameLogic.initializeGame('localPvP'); // Reset local game state (not scores)
    UI.setGameIdDisplay('---');
    UI.showOnlineLobby(true); // Return to lobby
    listenToPublicLobby(); // Restart public lobby listener
}

/**
 * Exits spectating mode and returns to the lobby.
 */
export function exitSpectatorMode() {
    // Unsubscribe from listeners
    if (unsubscribeGameListener) unsubscribeGameListener();
    if (unsubscribeChatListener) unsubscribeChatListener();
    
    // Reset local state and navigate
    currentGameId = null;
    currentPlayerRole = null;
    GameLogic.initializeGame('localPvP'); // Reset local game state (not scores)
    UI.setGameIdDisplay('---');
    UI.showOnlineLobby(true); // Return to lobby
    listenToPublicLobby(); // Restart public lobby listener
}


// --- Lobby Management ---

/**
 * Starts listening to the public list of games.
 */
export function listenToPublicLobby() {
    if (unsubscribePublicLobbyListener) {
        unsubscribePublicLobbyListener();
        console.log("OnlineGame: Unsubscribed from previous public lobby listener.");
    }
    
    const gamesCollectionRef = collection(db, GAME_COLLECTION_PATH);
    // Query for public games that are not full
    const q = query(
        gamesCollectionRef, 
        where("isPrivate", "==", false),
        orderBy("createdAt", "desc")
    ); 

    unsubscribePublicLobbyListener = onSnapshot(q, (snapshot) => {
        const games = [];
        snapshot.forEach(doc => {
            const gameData = doc.data();
            // Filter out games where the current user is already a player
            if (gameData.playerXId !== getCurrentUserId() && gameData.playerOId !== getCurrentUserId()) {
                 games.push({ gameId: doc.id, ...gameData });
            }
        });
        console.log("OnlineGame: New public games list received:", games.length);
        UI.renderPublicGames(
            games, 
            (gameId) => joinOnlineGame(gameId), 
            (gameId) => spectateGame(gameId)
        );
    }, (error) => {
        console.error("OnlineGame: Error listening to public lobby:", error);
    });
}

/**
 * Stops listening to the public list of games.
 */
export function stopListeningToPublicLobby() {
    if (unsubscribePublicLobbyListener) {
        unsubscribePublicLobbyListener();
        unsubscribePublicLobbyListener = null;
        console.log("OnlineGame: Stopped public lobby listener.");
    }
}

// --- Chat Management ---

/**
 * Sends a chat message to the current game's chat collection.
 * @param {string} message - The message text.
 */
export async function sendChatMessage(message) {
    if (!currentGameId || !message.trim()) return;

    const senderId = getCurrentUserId();
    const senderName = UI.getCurrentUserNameDisplay().textContent || 'Guest';
    const chatCollectionRef = collection(db, CHAT_COLLECTION_PATH(currentGameId));

    try {
        await addDoc(chatCollectionRef, {
            sender: senderName,
            senderId: senderId,
            text: message,
            timestamp: Date.now()
        });
        const chatInput = UI.getChatInput();
        if (chatInput) chatInput.value = ''; // Clear input field
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