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

        // Set initial online player name display 
        const onlinePlayerNameInput = UI.getOnlinePlayerNameInput();
        if (onlinePlayerNameInput) {
            onlinePlayerNameInput.value = `Player (${userId.substring(0, 4)})`; // Default name for online
            UI.setCurrentUserNameDisplay(onlinePlayerNameInput.value);
        } else {
            // Fallback if onlinePlayerNameInput is somehow not found
            UI.setCurrentUserNameDisplay(`Guest (${userId.substring(0, 4)})`);
        }

        // Handle pending request to show online lobby
        if (UI.isOnlineLobbyRequestPending()) {
            UI.hideModal(); 
            UI.showOnlineLobby(true); 
            OnlineGame.listenToPublicLobby(); 
            UI.clearOnlineLobbyRequestPending(); 
        }
    });

    // --- Online Player Name Input Listener ---
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
            const playerXNameInput = UI.getPlayerXNameInput();
            const playerONameInput = UI.getPlayerONameInput();
            if (playerXNameInput) playerXNameInput.value = 'Player X';
            if (playerONameInput) playerONameInput.value = 'Player O';
        });
    } else { console.error("Main: localPvPButton not found!"); }

    if (onlinePvPButton) {
        onlinePvPButton.addEventListener('click', () => {
            console.log("Main: Online PvP button clicked. Showing lobby.");
            if (!Auth.getCurrentUserId()) {
                UI.showModal("Please wait, authenticating user to enter online lobby...");
                UI.setOnlineLobbyRequestPending(true); 
            } else {
                UI.showOnlineLobby(true);
                OnlineGame.listenToPublicLobby();
            }
        });
    } else { console.error("Main: onlinePvPButton not found!"); }

    if (pvcModeButton) {
        pvcModeButton.addEventListener('click', () => {
            console.log("Main: PvC (vs AI) button clicked. Showing setup.");
            UI.showPvcSetup();
            const pvcPlayerNameInput = UI.getPvcPlayerNameInput();
            if (pvcPlayerNameInput) pvcPlayerNameInput.value = 'Player X';
        });
    } else { console.error("Main: pvcModeButton not found!"); }


    // --- Local PvP Setup Listeners ---
    const startLocalGameButton = UI.getStartLocalGameButton();
    const backToModesFromLocalSetup = UI.getBackToModesFromLocalSetup();

    if (startLocalGameButton) {
        startLocalGameButton.addEventListener('click', () => {
            const playerXName = UI.getPlayerXNameInput()?.value || 'Player X';
            const playerOName = UI.getPlayerONameInput()?.value || 'Player O';
            console.log("Main: Starting Local PvP game:", playerXName, "vs", playerOName);
            UI.showGameArea('localPvP');
            GameLogic.initializeGame('localPvP', false, { X: playerXName, O: playerOName });
        });
    } else { console.error("Main: startLocalGameButton not found!"); }

    if (backToModesFromLocalSetup) {
        backToModesFromLocalSetup.addEventListener('click', () => {
            UI.showModeSelection();
        });
    } else { console.error("Main: backToModesFromLocalSetup not found!"); }


    // --- PvC Setup Listeners ---
    const aiEasyButton = UI.getAiEasyButton();
    const aiMediumButton = UI.getAiMediumButton();
    const aiHardButton = UI.getAiHardButton();
    // This call is what caused the ReferenceError, now fixed by updating ui.js
    const backToModesFromPvcSetup = UI.getBackToModesFromPvcSetup(); 

    function startPvcGame(difficulty) {
        const playerName = UI.getPvcPlayerNameInput()?.value || 'Player X';
        console.log("Main: Starting PvC game (Difficulty:", difficulty + "):", playerName, "vs AI");
        UI.showGameArea('PvC', 'X'); // 'X' is the human player role in PvC
        GameLogic.initializeGame('PvC', false, { X: playerName, O: 'AI (' + difficulty + ')' }, difficulty);
    }

    if (aiEasyButton) {
        aiEasyButton.addEventListener('click', () => startPvcGame('easy'));
    } else { console.error("Main: aiEasyButton not found!"); }

    if (aiMediumButton) {
        aiMediumButton.addEventListener('click', () => startPvcGame('medium'));
    } else { console.error("Main: aiMediumButton not found!"); }

    if (aiHardButton) {
        aiHardButton.addEventListener('click', () => startPvcGame('hard'));
    } else { console.error("Main: aiHardButton not found!"); }

    if (backToModesFromPvcSetup) {
        backToModesFromPvcSetup.addEventListener('click', () => {
            UI.showModeSelection();
        });
    } else { console.error("Main: backToModesFromPvcSetup not found!"); }


    // --- Game Button Listeners ---
    const resetButton = UI.getResetButton();
    const startNewRoundButton = UI.getStartNewRoundButton();
    const backToModesFromGame = UI.getBackToModesFromGame();

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            GameLogic.resetScores();
            UI.showModal("Scores have been reset!");
        });
    } else { console.error("Main: resetButton not found!"); }

    if (startNewRoundButton) {
        startNewRoundButton.addEventListener('click', () => {
            const mode = GameLogic.getGameMode();
            if (mode === 'localPvP' || mode === 'PvC') {
                const names = GameLogic.getPlayerNames(); 
                const difficulty = GameLogic.getAIDifficulty(); 
                GameLogic.initializeGame(mode, true, names, difficulty);
            } else if (mode === 'onlinePvP') {
                OnlineGame.startNewRound();
            }
        });
    } else { console.error("Main: startNewRoundButton not found!"); }


    if (backToModesFromGame) {
        backToModesFromGame.addEventListener('click', () => {
            const mode = GameLogic.getGameMode();
            if (mode === 'onlinePvP') {
                OnlineGame.leaveGame();
                UI.showOnlineLobby(true); // Clear list when going back to lobby
            } else {
                UI.showModeSelection();
            }
            GameLogic.setGameActive(false);
            GameLogic.resetScores(); // Reset local scores when exiting
        });
    } else { console.error("Main: backToModesFromGame not found!"); }


    // --- Online Game Listeners ---
    const createGameButton = UI.getCreateGameButton();
    const joinGameButton = UI.getJoinGameButton();
    const copyGameIdButton = UI.getCopyGameIdButton();
    const leaveGameButton = UI.getLeaveGameButton();
    const exitSpectatorModeButton = UI.getExitSpectatorModeButton();
    
    if (createGameButton) {
        createGameButton.addEventListener('click', () => {
            const gameName = UI.getNewGameNameInput()?.value || '';
            const isPrivate = UI.getPrivateGameCheckbox()?.checked || false;
            OnlineGame.createNewOnlineGame(gameName, isPrivate);
        });
    } else { console.error("Main: createGameButton not found!"); }

    if (joinGameButton) {
        joinGameButton.addEventListener('click', () => {
            const gameId = UI.getJoinGameIdInput()?.value.trim();
            if (gameId) {
                OnlineGame.joinGameById(gameId);
            } else {
                UI.showModal("Please enter a Game ID.");
            }
        });
    } else { console.error("Main: joinGameButton not found!"); }

    if (leaveGameButton) {
        leaveGameButton.addEventListener('click', () => {
            OnlineGame.leaveGame();
            UI.showOnlineLobby(true);
        });
    } else { console.error("Main: leaveGameButton not found!"); }

    if (exitSpectatorModeButton) {
        exitSpectatorModeButton.addEventListener('click', () => {
            OnlineGame.leaveGame(true); // true indicates spectator exit
            UI.showOnlineLobby(true);
        });
    } else { console.error("Main: exitSpectatorModeButton not found!"); }


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
    
    
    // --- Game Cell Event Listeners ---
    const cells = UI.getCells();
    if (cells && cells.length > 0) {
        cells.forEach((cell, index) => {
            cell.addEventListener('click', () => {
                // Calls the correct move handler
                if (GameLogic.isGameActive() && cell.textContent === '') {
                    GameLogic.handlePlayerMove(index); 
                }
            });
        });
    } else { console.error("Main: Game cells not found!"); }


    // Initial view on page load
    UI.showModeSelection();
});