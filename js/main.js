// js/main.js

import * as Auth from './auth.js';
import * as UI from './ui.js'; // Corrected: Removed extra asterisk
import * as GameLogic from './gameLogic.js';
import * as OnlineGame from './onlineGame.js';

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Main: DOM Content Loaded. Initializing app.");

    // Initialize UI elements first to ensure they are ready
    UI.initDOMElements();

    // Initialize theme
    UI.initializeTheme();

    // Initialize Firebase and Auth, with a callback for when auth is ready
    Auth.initializeFirebaseAndAuth((userId) => {
        UI.setUserIdDisplay(userId);
        console.log("Main: Firebase authentication ready, userId:", userId);

        // If there was a pending request to show the online lobby before auth was ready
        if (UI.isOnlineLobbyRequestPending()) {
            UI.hideModal(); // Hide the authentication modal
            UI.showOnlineLobby(true); // Show the online lobby
            OnlineGame.listenToPublicLobby(); // Start listening to public lobby
            UI.clearOnlineLobbyRequestPending(); // Clear the pending flag
        }
    });

    // --- Mode Selection Buttons ---
    // Use getter functions to ensure elements are retrieved after initDOMElements
    const localPvPButton = UI.getLocalPvPButton();
    const onlinePvPButton = UI.getOnlinePvPButton();
    const pvcModeButton = UI.getPvcModeButton();

    if (localPvPButton) {
        localPvPButton.addEventListener('click', () => {
            console.log("Main: Local 2-Player button clicked.");
            GameLogic.initializeGame('localPvP');
            UI.showGameArea('localPvP');
        });
    } else {
        console.error("Main: localPvPButton not found!");
    }

    if (onlinePvPButton) {
        onlinePvPButton.addEventListener('click', () => {
            console.log("Main: Online 2-Player button clicked.");
            UI.showOnlineLobby(Auth.getCurrentUserId() !== null); // Pass auth status
            if (Auth.getCurrentUserId() !== null) {
                OnlineGame.listenToPublicLobby(); // Start listening to public lobby if auth is ready
            }
        });
    } else {
        console.error("Main: onlinePvPButton not found!");
    }

    if (pvcModeButton) {
        pvcModeButton.addEventListener('click', () => {
            console.log("Main: Player vs. Computer button clicked.");
            GameLogic.initializeGame('PvC');
            UI.showGameArea('PvC');
        });
    } else {
        console.error("Main: pvcModeButton not found!");
    }


    // --- Online Lobby Buttons ---
    const createGameButton = UI.getCreateGameButton();
    const newGameNameInput = UI.getNewGameNameInput();
    const privateGameCheckbox = UI.getPrivateGameCheckbox();
    const joinGameButton = UI.getJoinGameButton();
    const joinGameIdInput = UI.getJoinGameIdInput();
    const backToModesFromOnline = UI.getBackToModesFromOnline();

    if (createGameButton) {
        createGameButton.addEventListener('click', () => {
            const gameName = newGameNameInput ? newGameNameInput.value.trim() : '';
            const isPrivate = privateGameCheckbox ? privateGameCheckbox.checked : false;
            OnlineGame.createNewOnlineGame(gameName, isPrivate);
        });
    } else { console.error("Main: createGameButton not found!"); }

    if (joinGameButton) {
        joinGameButton.addEventListener('click', () => {
            const gameId = joinGameIdInput ? joinGameIdInput.value.trim() : '';
            OnlineGame.joinOnlineGame(gameId);
        });
    } else { console.error("Main: joinGameButton not found!"); }

    if (backToModesFromOnline) {
        backToModesFromOnline.addEventListener('click', () => {
            OnlineGame.exitOnlineGame(); // Clean up online game state if any
            UI.showModeSelection();
        });
    } else { console.error("Main: backToModesFromOnline not found!"); }


    // --- Game Area Buttons (universal for all modes) ---
    const cells = UI.getCells(); // Get the NodeList of cells
    if (cells) {
        cells.forEach(cell => cell.addEventListener('click', (event) => {
            const clickedCellIndex = parseInt(event.target.getAttribute('data-cell-index'));
            const currentMode = GameLogic.getGameMode();

            if (currentMode === 'localPvP' || currentMode === 'PvC') {
                GameLogic.handleCellClick(clickedCellIndex);
            } else if (currentMode === 'onlinePvP') {
                OnlineGame.handleOnlineMove(clickedCellIndex);
            }
        }));
    } else { console.error("Main: Game cells not found!"); }


    const resetButton = UI.getResetButton();
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            const currentMode = GameLogic.getGameMode();
            if (currentMode === 'localPvP' || currentMode === 'PvC') {
                GameLogic.initializeGame(currentMode); // Reset local/PvC game
            } else if (currentMode === 'onlinePvP') {
                OnlineGame.handleOnlineGameReset(false); // Full reset for online
            }
        });
    } else { console.error("Main: resetButton not found!"); }


    const rematchButton = UI.getRematchButton();
    if (rematchButton) {
        rematchButton.addEventListener('click', () => {
            const currentMode = GameLogic.getGameMode();
            if (currentMode === 'onlinePvP') {
                OnlineGame.handleOnlineGameReset(true); // Rematch for online
            }
        });
    } else { console.error("Main: rematchButton not found!"); }


    const backToModesFromGame = UI.getBackToModesFromGame();
    if (backToModesFromGame) {
        backToModesFromGame.addEventListener('click', () => {
            const currentMode = GameLogic.getGameMode();
            if (currentMode === 'onlinePvP') {
                OnlineGame.exitOnlineGame(); // Clean up online game state
            }
            UI.showModeSelection();
        });
    } else { console.error("Main: backToModesFromGame not found!"); }


    // --- Modal Close Button ---
    const modalCloseButton = UI.getModalCloseButton();
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', UI.hideModal);
    } else { console.error("Main: modalCloseButton not found!"); }


    // --- Copy Game ID Button ---
    const copyGameIdButton = UI.getCopyGameIdButton();
    if (copyGameIdButton) {
        copyGameIdButton.addEventListener('click', () => {
            const currentGameId = OnlineGame.getCurrentGameId();
            if (currentGameId) {
                const tempInput = document.createElement('textarea');
                tempInput.value = currentGameId;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                UI.showModal("Game ID copied to clipboard!");
            } else {
                UI.showModal("No active game ID to copy.");
            }
        });
    } else { console.error("Main: copyGameIdButton not found!"); }


    // --- Chat Send Button ---
    const sendChatButton = UI.getSendChatButton();
    const chatInput = UI.getChatInput();
    if (sendChatButton) {
        sendChatButton.addEventListener('click', () => {
            const message = chatInput ? chatInput.value : '';
            OnlineGame.sendChatMessage(message);
        });
    } else { console.error("Main: sendChatButton not found!"); }

    if (chatInput) {
        chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                const message = chatInput.value;
                OnlineGame.sendChatMessage(message);
            }
        });
    } else { console.error("Main: chatInput not found!"); }


    // --- Theme Toggle ---
    const themeToggle = UI.getThemeToggle();
    if (themeToggle) {
        themeToggle.addEventListener('click', UI.toggleTheme);
    } else { console.error("Main: themeToggle not found!"); }


    // Initial view on page load
    UI.showModeSelection();
});