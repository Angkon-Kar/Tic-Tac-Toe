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

    // --- Online Player Name Input Listener (for display in lobby) ---
    // Moved this listener here, after UI.initDOMElements and Auth.initializeFirebaseAndAuth
    // to ensure onlinePlayerNameInput is available and userId is set.
    const onlinePlayerNameInput = UI.getOnlinePlayerNameInput();
    if (onlinePlayerNameInput) {
        onlinePlayerNameInput.addEventListener('input', () => {
            const name = onlinePlayerNameInput.value.trim();
            const userId = Auth.getCurrentUserId();
            UI.setCurrentUserNameDisplay(name || `Guest (${userId ? userId.substring(0, 4) : '...' })`);
        });
    }


    // --- Mode Selection Buttons ---
    const localPvPButton = UI.getLocalPvPButton();
    const onlinePvPButton = UI.getOnlinePvPButton();
    const pvcModeButton = UI.getPvcModeButton();

    if (localPvPButton) {
        localPvPButton.addEventListener('click', () => {
            console.log("Main: Local 2-Player button clicked. Showing setup.");
            UI.showLocalPvPSetup();
            // Set default names for local players
            const playerXNameInput = UI.getPlayerXNameInput();
            const playerONameInput = UI.getPlayerONameInput();
            if (playerXNameInput) playerXNameInput.value = 'Player X';
            if (playerONameInput) playerONameInput.value = 'Player O';
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
            console.log("Main: Player vs. AI button clicked. Showing setup.");
            UI.showPvcSetup();
            const pvcPlayerNameInput = UI.getPvcPlayerNameInput();
            if (pvcPlayerNameInput) pvcPlayerNameInput.value = 'Human Player'; // Default name for PvC
        });
    } else {
        console.error("Main: pvcModeButton not found!");
    }

    // --- Local PvP Setup Buttons ---
    const startLocalGameButton = UI.getStartLocalGameButton();
    const playerXNameInput = UI.getPlayerXNameInput();
    const playerONameInput = UI.getPlayerONameInput();
    const backToModesFromLocalSetup = UI.getBackToModesFromLocalSetup();

    if (startLocalGameButton) {
        startLocalGameButton.addEventListener('click', () => {
            const playerXName = playerXNameInput.value.trim() || 'Player X';
            const playerOName = playerONameInput.value.trim() || 'Player O';
            GameLogic.initializeGame('localPvP', false, { X: playerXName, O: playerOName });
            UI.showGameArea('localPvP');
        });
    } else { console.error("Main: startLocalGameButton not found!"); }

    if (backToModesFromLocalSetup) {
        backToModesFromLocalSetup.addEventListener('click', () => {
            UI.showModeSelection();
        });
    } else { console.error("Main: backToModesFromLocalSetup not found!"); }

    // --- Player vs AI Setup Buttons ---
    const pvcPlayerNameInput = UI.getPvcPlayerNameInput();
    const aiEasyButton = UI.getAiEasyButton();
    const aiMediumButton = UI.getAiMediumButton();
    const aiHardButton = UI.getAiHardButton();
    const backToModesFromPvcSetup = UI.getBackToModesFromPvcSetup();

    const startPvcGame = (difficulty) => {
        const playerName = pvcPlayerNameInput.value.trim() || 'Human Player';
        GameLogic.initializeGame('PvC', false, { X: playerName, O: 'AI' }, difficulty);
        UI.showGameArea('PvC');
    };

    if (aiEasyButton) { aiEasyButton.addEventListener('click', () => startPvcGame('easy')); } else { console.error("Main: aiEasyButton not found!"); }
    if (aiMediumButton) { aiMediumButton.addEventListener('click', () => startPvcGame('medium')); } else { console.error("Main: aiMediumButton not found!"); }
    if (aiHardButton) { aiHardButton.addEventListener('click', () => startPvcGame('hard')); } else { console.error("Main: aiHardButton not found!"); }

    if (backToModesFromPvcSetup) {
        backToModesFromPvcSetup.addEventListener('click', () => {
            UI.showModeSelection();
        });
    } else { console.error("Main: backToModesFromPvcSetup not found!"); }


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
            const playerName = onlinePlayerNameInput.value.trim() || `Player (${Auth.getCurrentUserId().substring(0, 4)})`;
            OnlineGame.createNewOnlineGame(gameName, isPrivate, playerName);
        });
    } else { console.error("Main: createGameButton not found!"); }

    if (joinGameButton) {
        joinGameButton.addEventListener('click', () => {
            const gameId = joinGameIdInput ? joinGameIdInput.value.trim() : '';
            const playerName = onlinePlayerNameInput.value.trim() || `Player (${Auth.getCurrentUserId().substring(0, 4)})`;
            OnlineGame.joinOnlineGame(gameId, playerName);
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
    const startNewRoundButton = UI.getStartNewRoundButton();
    const leaveGameButton = UI.getLeaveGameButton();
    const exitSpectatorModeButton = UI.getExitSpectatorModeButton();

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            const currentMode = GameLogic.getGameMode();
            if (currentMode === 'localPvP' || currentMode === 'PvC') {
                const playerNames = GameLogic.getPlayerNames(); // Get names from current game logic
                GameLogic.initializeGame(currentMode, false, playerNames); // Reset local/PvC game, preserve names
            }
            // Online reset logic is now split into startNewRound and leaveGame
        });
    } else { console.error("Main: resetButton not found!"); }

    if (startNewRoundButton) {
        startNewRoundButton.addEventListener('click', () => {
            console.log("Main: Start New Round button clicked.");
            OnlineGame.startNewOnlineRound();
        });
    } else { console.error("Main: startNewRoundButton not found!"); }

    if (leaveGameButton) {
        leaveGameButton.addEventListener('click', () => {
            console.log("Main: Leave Game button clicked.");
            OnlineGame.leaveOnlineGame();
        });
    } else { console.error("Main: leaveGameButton not found!"); }

    if (exitSpectatorModeButton) {
        exitSpectatorModeButton.addEventListener('click', () => {
            console.log("Main: Exit Spectator Mode button clicked.");
            OnlineGame.exitSpectatorMode();
        });
    } else { console.error("Main: exitSpectatorModeButton not found!"); }


    const backToModesFromGame = UI.getBackToModesFromGame();
    if (backToModesFromGame) {
        backToModesFromGame.addEventListener('click', () => {
            const currentMode = GameLogic.getGameMode();
            if (currentMode === 'onlinePvP') {
                // If in online mode (player or spectator), use exitOnlineGame to clean up
                OnlineGame.exitOnlineGame();
            } else {
                // For local or PvC, just show mode selection
                UI.showModeSelection();
            }
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
