// js/main.js

import * as Auth from './auth.js';
import * as UI from './ui.js';
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

        // Set initial online player name display (can be updated later by user input)
        const onlinePlayerNameInput = UI.getOnlinePlayerNameInput();
        if (onlinePlayerNameInput) {
            onlinePlayerNameInput.value = `Player (${userId.substring(0, 4)})`; // Default name for online
            UI.setCurrentUserNameDisplay(onlinePlayerNameInput.value);
        } else {
            // Fallback if onlinePlayerNameInput is somehow not found (shouldn't happen with correct HTML)
            UI.setCurrentUserNameDisplay(`Guest (${userId.substring(0, 4)})`);
        }

        // If there was a pending request to show the online lobby before auth was ready
        if (UI.isOnlineLobbyRequestPending()) {
            UI.hideModal(); // Hide the authentication modal
            UI.showOnlineLobby(true); // Show the online lobby
            OnlineGame.listenToPublicLobby(); // Start listening to public lobby
            UI.clearOnlineLobbyRequestPending(); // Clear the pending flag
        }
    });

    // --- Mode Selection Buttons ---
    const localPvPButton = UI.getLocalPvPButton();
    const onlinePvPButton = UI.getOnlinePvPButton();
    const pvcModeButton = UI.getPvcModeButton();

    if (localPvPButton) {
        localPvPButton.addEventListener('click', () => {
            console.log("Main: Local PvP button clicked. Showing setup.");
            UI.showLocalPvPSetup();
        });
    } else { console.error("Main: localPvPButton not found!"); }

    if (onlinePvPButton) {
        onlinePvPButton.addEventListener('click', () => {
            console.log("Main: Online PvP button clicked. Showing lobby.");
            // Check auth status here. showOnlineLobby handles pending if not ready.
            UI.showOnlineLobby(!!Auth.getCurrentUserId()); 
            if (Auth.getCurrentUserId()) {
                OnlineGame.listenToPublicLobby();
            }
        });
    } else { console.error("Main: onlinePvPButton not found!"); }

    if (pvcModeButton) {
        pvcModeButton.addEventListener('click', () => {
            console.log("Main: Player vs. AI button clicked. Showing setup.");
            // Fix: This calls the now-corrected function in ui.js
            UI.showPvcSetup(); 
        });
    } else { console.error("Main: pvcModeButton not found!"); }


    // --- Local PvP Setup Listeners ---
    const startLocalGameButton = UI.getStartLocalGameButton();
    const backToModesFromLocalSetup = UI.getBackToModesFromLocalSetup();
    if (startLocalGameButton) {
        startLocalGameButton.addEventListener('click', () => {
            const playerXName = UI.getPlayerXNameInput()?.value || 'Player X';
            const playerOName = UI.getPlayerONameInput()?.value || 'Player O';
            console.log(`Main: Starting Local PvP game: ${playerXName} vs ${playerOName}`);
            GameLogic.initializeGame('localPvP', false, { X: playerXName, O: playerOName });
            UI.showGameArea('localPvP');
        });
    } else { console.error("Main: startLocalGameButton not found!"); }

    if (backToModesFromLocalSetup) {
        backToModesFromLocalSetup.addEventListener('click', UI.showModeSelection);
    } else { console.error("Main: backToModesFromLocalSetup not found!"); }

    // --- PvC Setup Listeners ---
    const startPvCButton = UI.getStartPvCButton();
    const backToModesFromPvC = UI.getBackToModesFromPvC();

    if (startPvCButton) {
        startPvCButton.addEventListener('click', () => {
            const playerName = UI.getPvcPlayerNameInput()?.value || 'Human Player';
            const difficulty = UI.getSelectedAiDifficulty();
            console.log(`Main: Starting PvC game: ${playerName} vs AI (${difficulty})`);
            
            GameLogic.initializeGame('PvC', false, { X: playerName, O: 'AI' }, difficulty);
            UI.showGameArea('PvC');
        });
    } else { console.error("Main: startPvCButton not found!"); }

    if (backToModesFromPvC) {
        backToModesFromPvC.addEventListener('click', UI.showModeSelection);
    } else { console.error("Main: backToModesFromPvC not found!"); }


    // --- Online Lobby Listeners ---
    const onlinePlayerNameInput = UI.getOnlinePlayerNameInput();
    const createGameButton = UI.getCreateGameButton();
    const joinGameButton = UI.getJoinGameButton();
    const backToModesFromOnline = UI.getBackToModesFromOnline();

    if (onlinePlayerNameInput) {
        onlinePlayerNameInput.addEventListener('input', (event) => {
            UI.setCurrentUserNameDisplay(event.target.value);
            // Optionally update the name in the Auth module/database here
        });
    } else { console.error("Main: onlinePlayerNameInput not found!"); }

    if (createGameButton) {
        createGameButton.addEventListener('click', () => {
            const gameName = UI.getNewGameNameInput()?.value || '';
            const isPrivate = UI.getPrivateGameCheckbox()?.checked || false;
            OnlineGame.createNewOnlineGame(gameName, isPrivate);
        });
    } else { console.error("Main: createGameButton not found!"); }

    if (joinGameButton) {
        joinGameButton.addEventListener('click', () => {
            const gameId = UI.getJoinGameIdInput()?.value;
            if (gameId) {
                OnlineGame.joinOnlineGame(gameId);
            } else {
                UI.showModal("Please enter a Game ID to join.");
            }
        });
    } else { console.error("Main: joinGameButton not found!"); }

    if (backToModesFromOnline) {
        backToModesFromOnline.addEventListener('click', () => {
            OnlineGame.stopListeningToPublicLobby();
            UI.showModeSelection();
        });
    } else { console.error("Main: backToModesFromOnline not found!"); }


    // --- Game Area Listeners ---
    const cells = UI.getCells();
    if (cells) {
        cells.forEach(cell => {
            cell.addEventListener('click', (event) => {
                const index = parseInt(event.target.dataset.index);
                GameLogic.handleCellClick(index);
            });
        });
    } else { console.error("Main: Game cells not found!"); }

    const resetButton = UI.getResetButton();
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            GameLogic.resetLocalScores();
        });
    } else { console.error("Main: resetButton not found!"); }

    const startNewRoundButton = UI.getStartNewRoundButton();
    if (startNewRoundButton) {
        startNewRoundButton.addEventListener('click', () => {
            OnlineGame.requestRematch();
        });
    } else { console.error("Main: startNewRoundButton not found!"); }

    const leaveGameButton = UI.getLeaveGameButton();
    if (leaveGameButton) {
        leaveGameButton.addEventListener('click', () => {
            OnlineGame.leaveOnlineGame();
        });
    } else { console.error("Main: leaveGameButton not found!"); }

    const exitSpectatorModeButton = UI.getExitSpectatorModeButton();
    if (exitSpectatorModeButton) {
        exitSpectatorModeButton.addEventListener('click', () => {
            OnlineGame.exitSpectatorMode();
        });
    } else { console.error("Main: exitSpectatorModeButton not found!"); }

    const backToModesFromGame = UI.getBackToModesFromGame();
    if (backToModesFromGame) {
        backToModesFromGame.addEventListener('click', () => {
            const mode = GameLogic.getGameMode();
            if (mode === 'onlinePvP') {
                OnlineGame.leaveOnlineGame(); // For safety in case they just navigated here
            }
            UI.showModeSelection();
        });
    } else { console.error("Main: backToModesFromGame not found!"); }

    // --- Modal Listeners ---
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
                // Temporary input trick to copy to clipboard
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