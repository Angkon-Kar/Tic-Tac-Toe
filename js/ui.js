// js/ui.js

let modeSelection, localPvPButton, onlinePvPButton, pvcModeButton;
let localPvPSetupSection, playerXNameInput, playerONameInput, startLocalGameButton, backToModesFromLocalSetup;
let pvcSetupSection, pvcPlayerNameInput, aiDifficultySelector, startPvCButton, backToModesFromPvC;
let onlineLobbySection, userIdDisplay, currentUserNameDisplay, onlinePlayerNameInput, gameIdDisplay, copyGameIdButton, createGameButton, newGameNameInput, privateGameCheckbox, joinGameIdInput, joinGameButton, backToModesFromOnline, publicGamesList;
let gameArea, gameStatus, cells, resetButton, startNewRoundButton, leaveGameButton, exitSpectatorModeButton, backToModesFromGame;
let xScoreDisplay, oScoreDisplay, drawsDisplay;
let chatSection, chatMessagesContainer, chatInput, sendChatButton;
let customModal, modalMessage, modalCloseButton;
let themeToggle;

let hasPendingOnlineLobbyRequest = false;

export function initDOMElements() {
    console.log("UI: Initializing DOM elements...");
    modeSelection = document.getElementById('modeSelection');
    localPvPButton = document.getElementById('localPvPButton');
    onlinePvPButton = document.getElementById('onlinePvPButton');
    pvcModeButton = document.getElementById('pvcModeButton');

    localPvPSetupSection = document.getElementById('localPvPSetupSection');
    playerXNameInput = document.getElementById('playerXNameInput');
    playerONameInput = document.getElementById('playerONameInput');
    startLocalGameButton = document.getElementById('startLocalGameButton');
    backToModesFromLocalSetup = document.getElementById('backToModesFromLocalSetup');

    pvcSetupSection = document.getElementById('pvcSetupSection');
    pvcPlayerNameInput = document.getElementById('pvcPlayerNameInput');
    aiDifficultySelector = document.getElementById('aiDifficultySelector');
    startPvCButton = document.getElementById('startPvCButton');
    backToModesFromPvC = document.getElementById('backToModesFromPvC');

    onlineLobbySection = document.getElementById('onlineLobbySection');
    userIdDisplay = document.getElementById('userIdDisplay');
    currentUserNameDisplay = document.getElementById('currentUserNameDisplay');
    onlinePlayerNameInput = document.getElementById('onlinePlayerNameInput');
    gameIdDisplay = document.getElementById('gameIdDisplay');
    copyGameIdButton = document.getElementById('copyGameIdButton');
    createGameButton = document.getElementById('createGameButton');
    newGameNameInput = document.getElementById('newGameNameInput');
    privateGameCheckbox = document.getElementById('privateGameCheckbox');
    joinGameIdInput = document.getElementById('joinGameIdInput');
    joinGameButton = document.getElementById('joinGameButton');
    backToModesFromOnline = document.getElementById('backToModesFromOnline');
    publicGamesList = document.getElementById('publicGamesList');

    gameArea = document.getElementById('gameArea');
    gameStatus = document.getElementById('gameStatus');
    cells = document.querySelectorAll('.cell');
    resetButton = document.getElementById('resetButton');
    startNewRoundButton = document.getElementById('startNewRoundButton');
    leaveGameButton = document.getElementById('leaveGameButton');
    exitSpectatorModeButton = document.getElementById('exitSpectatorModeButton');
    backToModesFromGame = document.getElementById('backToModesFromGame');

    xScoreDisplay = document.getElementById('xScore');
    oScoreDisplay = document.getElementById('oScore');
    drawsDisplay = document.getElementById('draws');

    chatSection = document.getElementById('chatSection');
    chatMessagesContainer = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    sendChatButton = document.getElementById('sendChatButton');

    customModal = document.getElementById('customModal');
    modalMessage = document.getElementById('modalMessage');
    modalCloseButton = document.getElementById('modalCloseButton');

    themeToggle = document.getElementById('themeToggle');

    // Defensive: ensure each .cell has data-index attribute matching its order
    if (cells && cells.length) {
        cells.forEach((cell, i) => {
            if (!cell.hasAttribute('data-index')) cell.setAttribute('data-index', String(i));
            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
        });
    }

    // Default visibility: hide game controls and chat until needed
    resetButton?.classList.add('hidden');
    startNewRoundButton?.classList.add('hidden');
    leaveGameButton?.classList.add('hidden');
    exitSpectatorModeButton?.classList.add('hidden');
    chatSection?.classList.add('hidden');

    if (!modeSelection) console.error("UI: modeSelection element not found!");
}
// ...existing code...


/**
 * Displays a custom modal message to the user.
 * @param {string} message - The message to display.
 */
export function showModal(message) {
    if (modalMessage && customModal) {
        modalMessage.textContent = message;
        customModal.classList.remove('hidden');
        console.log("UI: Modal shown:", message);
    } else {
        console.error("UI: Modal elements not found, cannot show modal:", message);
    }
}

/**
 * Hides the custom modal.
 */
export function hideModal() {
    if (customModal) {
        customModal.classList.add('hidden');
        console.log("UI: Modal hidden.");
    }
}

/**
 * Sets the user ID display in the UI.
 * @param {string} id - The user ID.
 */
export function setUserIdDisplay(id) {
    if (userIdDisplay) userIdDisplay.textContent = id;
}

/**
 * Sets the current user's name display in the UI.
 * @param {string} name - The user's name.
 */
export function setCurrentUserNameDisplay(name) {
    if (currentUserNameDisplay) currentUserNameDisplay.textContent = name;
}

/**
 * Sets the current game ID display in the UI.
 * @param {string} id - The game ID.
 */
export function setGameIdDisplay(id) {
    if (gameIdDisplay) gameIdDisplay.textContent = id;
}

/**
 * Hides all main sections and shows only the specified one.
 * @param {HTMLElement} sectionToShow - The HTML element of the section to display.
 */
function showOnlySection(sectionToShow) {
    const sections = [
        modeSelection,
        localPvPSetupSection,
        pvcSetupSection,
        onlineLobbySection,
        gameArea
    ];
    sections.forEach(section => {
        if (section) {
            if (section === sectionToShow) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        }
    });

    // Always hide chat when switching main sections, it's shown specifically for online games
    if (chatSection) chatSection.classList.add('hidden');
    // Always hide game-specific buttons when switching main sections
    if (resetButton) resetButton.classList.add('hidden');
    if (startNewRoundButton) startNewRoundButton.classList.add('hidden');
    if (leaveGameButton) leaveGameButton.classList.add('hidden');
    if (exitSpectatorModeButton) exitSpectatorModeButton.classList.add('hidden');
}


/**
 * Shows the mode selection screen and hides other sections.
 */
export function showModeSelection() {
    console.log("UI: Showing mode selection.");
    showOnlySection(modeSelection);
    hasPendingOnlineLobbyRequest = false; // Reset this flag when leaving online flow
}

/**
 * Shows the Local PvP setup section.
 */
export function showLocalPvPSetup() {
    console.log("UI: Showing Local PvP setup.");
    showOnlySection(localPvPSetupSection);
}

/**
 * Shows the Player vs AI setup section.
 * NOTE: Renamed to showPvcSetup (lowercase 'v' and 'c') to fix the TypeError in main.js.
 */
export function showPvcSetup() {
    console.log("UI: Showing Player vs AI setup.");
    showOnlySection(pvcSetupSection);
}

/**
 * Shows the online lobby section and hides other sections.
 * @param {boolean} authReady - True if Firebase authentication is ready.
 */
export function showOnlineLobby(authReady) {
    console.log("UI: Request to show online lobby. Auth Ready:", authReady);
    if (!authReady) {
        hasPendingOnlineLobbyRequest = true;
        showModal("Please wait, authenticating for online mode...");
        return;
    }
    showOnlySection(onlineLobbySection);
    if (publicGamesList) publicGamesList.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Loading public games...</p>'; // Reset lobby list
}

/**
 * Shows the game area and hides other sections.
 * @param {string} mode - The current game mode.
 * @param {string} currentOnlineRole - The role of the current user in online mode ('X', 'O', or 'spectator').
 */
export function showGameArea(mode, currentOnlineRole = null) {
    console.log("UI: Showing game area for mode:", mode, "Role:", currentOnlineRole);
    showOnlySection(gameArea);

    // Reset button visibility for all modes
    if (resetButton) resetButton.classList.add('hidden');
    if (startNewRoundButton) startNewRoundButton.classList.add('hidden');
    if (leaveGameButton) leaveGameButton.classList.add('hidden');
    if (exitSpectatorModeButton) exitSpectatorModeButton.classList.add('hidden');

    if (mode === 'localPvP' || mode === 'PvC') {
        if (resetButton) resetButton.classList.remove('hidden'); // Show reset for local/PvC
        if (chatSection) chatSection.classList.add('hidden'); // Hide chat for local/PvC
    } else if (mode === 'onlinePvP') {
        if (chatSection) chatSection.classList.remove('hidden'); // Show chat for online mode
        if (currentOnlineRole === 'spectator') {
            if (exitSpectatorModeButton) exitSpectatorModeButton.classList.remove('hidden');
            // Game controls are disabled for spectators, handled by setCellsInteractive
        } else { // Player X or O
            if (leaveGameButton) leaveGameButton.classList.remove('hidden'); // Always show leave for players
            // Start New Round button visibility handled by onlineGame updates
        }
    }
}

/**
 * Updates the game board UI.
 * @param {Array<string>} boardState - The current state of the board.
 */
export function updateBoardUI(boardState) {
    if (!cells) {
        console.error("UI: Cells not found, cannot update board UI.");
        return;
    }
    cells.forEach((cell, index) => {
        cell.textContent = boardState[index];
        cell.classList.remove('x-player', 'o-player', 'filled', 'winning-cell'); // Remove winning-cell class on update
        if (boardState[index] === 'X') {
            cell.classList.add('filled', 'x-player');
        } else if (boardState[index] === 'O') {
            cell.classList.add('filled', 'o-player');
        }
    });
}

/**
 * Updates the game status message.
 * @param {string} message - The status message.
 */
export function setGameStatus(message) {
    if (gameStatus) gameStatus.textContent = message;
}

/**
 * Highlights the winning cells.
 * @param {Array<number>} winningCells - Array of indices of winning cells.
 */
export function highlightWinningCells(winningCells) {
    if (!cells) {
        console.error("UI: Cells not found, cannot highlight winning cells.");
        return;
    }
    winningCells.forEach(index => {
        if (cells[index]) cells[index].classList.add('winning-cell');
    });
}

/**
 * Enables or disables cells for interaction.
 * @param {boolean} enable - True to enable, false to disable.
 * @param {Array<string>} boardState - Current board state to check for filled cells.
 * @param {string} currentTurnPlayer - The player whose turn it is (for online mode).
 * @param {string} localPlayerRole - The current user's role (X/O) in online mode.
 * @param {string} mode - The current game mode.
 */
export function setCellsInteractive(enable, boardState, currentTurnPlayer = null, localPlayerRole = null, mode = 'localPvP') {
    if (!cells) {
        console.error("UI: Cells not found, cannot set interactivity.");
        return;
    }
    cells.forEach((cell, index) => {
        // Cells are only interactive if enabled AND empty AND (it's not online OR it's your turn in online)
        const isOnlinePlayerTurn = (mode === 'onlinePvP' && localPlayerRole !== 'spectator' && currentTurnPlayer === localPlayerRole);
        const isLocalOrPvC = (mode === 'localPvP' || mode === 'PvC');
        const isSpectator = (mode === 'onlinePvP' && localPlayerRole === 'spectator');

        if (enable && boardState[index] === '') {
            if (isLocalOrPvC || isOnlinePlayerTurn) {
                cell.style.pointerEvents = 'auto';
                cell.classList.remove('cursor-not-allowed');
            } else if (isSpectator) {
                cell.style.pointerEvents = 'none'; // Spectators cannot click
                cell.classList.add('cursor-not-allowed');
            } else { // Online, but not your turn
                cell.style.pointerEvents = 'none';
                cell.classList.add('cursor-not-allowed');
            }
        } else { // Cell is filled or game not active
            cell.style.pointerEvents = 'none';
            cell.classList.add('cursor-not-allowed');
        }
    });
}

/**
 * Updates the score display.
 * @param {object} scores - Object with xWins, oWins, draws.
 */
export function updateScoreDisplay(scores) {
    if (xScoreDisplay) xScoreDisplay.textContent = scores.xWins;
    if (oScoreDisplay) oScoreDisplay.textContent = scores.oWins;
    if (drawsDisplay) drawsDisplay.textContent = scores.draws;
}

/**
 * Adds a chat message to the chat UI.
 * @param {object} messageData - { sender: string, text: string, senderId: string }
 * @param {string} currentUserId - The ID of the current user to determine 'self' messages.
 */
export function addChatMessage(messageData, currentUserId) {
    if (!chatMessagesContainer) {
        console.error("UI: Chat messages container not found, cannot add message.");
        return;
    }
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', 'p-2', 'rounded-lg', 'mb-2');

    if (messageData.senderId === currentUserId) {
        messageElement.classList.add('self'); // Tailwind classes handled in CSS
    }

    const senderSpan = document.createElement('span');
    senderSpan.classList.add('sender', 'font-semibold', 'text-sm', 'block', 'mb-1');
    senderSpan.textContent = messageData.sender + ":";

    const textSpan = document.createElement('span');
    // NOTE: Removed specific Tailwind text colors as they should be handled by the chat.css/theme
    textSpan.classList.add('text'); 
    textSpan.textContent = messageData.text;

    messageElement.appendChild(senderSpan);
    messageElement.appendChild(textSpan);
    chatMessagesContainer.appendChild(messageElement);

    // Scroll to the bottom of the chat
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

/**
 * Clears all chat messages from the UI.
 */
export function clearChatMessages() {
    if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';
}

/**
 * Renders the list of public games in the lobby.
 * @param {Array<object>} games - Array of game objects.
 * @param {Function} onJoinGame - Callback function when a join button is clicked.
 * @param {Function} onSpectateGame - Callback function when a spectate button is clicked.
 */
export function renderPublicGames(games, onJoinGame, onSpectateGame) {
    if (!publicGamesList) {
        console.error("UI: Public games list container not found, cannot render games.");
        return;
    }
    publicGamesList.innerHTML = ''; // Clear previous list

    if (games.length === 0) {
        publicGamesList.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No public games available. Create one!</p>';
        return;
    }

    games.forEach(game => {
        const gameItem = document.createElement('div');
        gameItem.classList.add('public-game-item', 'py-2');

        const gameInfo = document.createElement('span');
        const gameName = game.gameName && game.gameName !== '' ? `"${game.gameName}"` : `Game ${game.gameId.substring(0, 6)}`;
        const playerXName = game.playerXName || `Player X (${game.playerXId.substring(0,4)})`;
        const playerOName = game.playerOId ? (game.playerOName || `Player O (${game.playerOId.substring(0,4)})`) : 'Waiting...';
        const playersStatus = game.playerOId ? `${playerXName} vs ${playerOName}` : `${playerXName} (Waiting)`;

        gameInfo.textContent = `${gameName} - ${playersStatus}`;

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('flex', 'gap-2', 'mt-2', 'sm:mt-0');

        if (!game.playerOId) { // Game is waiting for a second player
            const joinButton = document.createElement('button');
            joinButton.classList.add('px-3', 'py-1', 'bg-blue-600', 'text-white', 'rounded-md', 'hover:bg-blue-700', 'transition-colors', 'duration-200');
            joinButton.textContent = 'Join';
            joinButton.onclick = () => onJoinGame(game.gameId);
            buttonContainer.appendChild(joinButton);
        } else { // Game is full, offer spectate
            const spectateButton = document.createElement('button');
            spectateButton.classList.add('px-3', 'py-1', 'bg-gray-600', 'text-white', 'rounded-md', 'hover:bg-gray-700', 'transition-colors', 'duration-200');
            spectateButton.textContent = 'Spectate';
            spectateButton.onclick = () => onSpectateGame(game.gameId);
            buttonContainer.appendChild(spectateButton);
        }


        gameItem.appendChild(gameInfo);
        gameItem.appendChild(buttonContainer);
        publicGamesList.appendChild(gameItem);
    });
}

/**
 * Toggles dark mode on/off.
 */
export function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    console.log("UI: Theme toggled to:", isDarkMode ? 'dark' : 'light');
}

/**
 * Initializes the theme based on user preference or system setting.
 */
export function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark');
    }
}

// Export the flag for main.js to check if online lobby request is pending
export function isOnlineLobbyRequestPending() {
    return hasPendingOnlineLobbyRequest;
}

export function clearOnlineLobbyRequestPending() {
    hasPendingOnlineLobbyRequest = false;
}

// Export getter functions for the DOM elements
export function getModeSelection() { return modeSelection; }
export function getLocalPvPButton() { return localPvPButton; }
export function getOnlinePvPButton() { return onlinePvPButton; }
export function getPvcModeButton() { return pvcModeButton; }

export function getLocalPvPSetupSection() { return localPvPSetupSection; }
export function getPlayerXNameInput() { return playerXNameInput; }
export function getPlayerONameInput() { return playerONameInput; }
export function getStartLocalGameButton() { return startLocalGameButton; }
export function getBackToModesFromLocalSetup() { return backToModesFromLocalSetup; }

// PvC Getters (Corrected names/variables)
export function getPvcSetupSection() { return pvcSetupSection; }
export function getPvcPlayerNameInput() { return pvcPlayerNameInput; }
export function getAiDifficultySelector() { return aiDifficultySelector; } // New getter for the selector
export function getStartPvCButton() { return startPvCButton; }
export function getBackToModesFromPvC() { return backToModesFromPvC; }

/**
 * Gets the currently selected AI difficulty from the radio group.
 * @returns {string} The selected difficulty ('easy', 'medium', or 'hard').
 */
export function getSelectedAiDifficulty() {
    if (aiDifficultySelector) {
        const selected = aiDifficultySelector.querySelector('input[name="ai_difficulty"]:checked');
        return selected ? selected.value : 'medium'; // Default to medium
    }
    return 'medium';
}
// END PvC Getters

export function getOnlineLobbySection() { return onlineLobbySection; }
export function getUserIdDisplay() { return userIdDisplay; }
export function getCurrentUserNameDisplay() { return currentUserNameDisplay; }
export function getOnlinePlayerNameInput() { return onlinePlayerNameInput; }
export function getGameIdDisplay() { return gameIdDisplay; }
export function getCopyGameIdButton() { return copyGameIdButton; }
export function getCreateGameButton() { return createGameButton; }
export function getNewGameNameInput() { return newGameNameInput; }
export function getPrivateGameCheckbox() { return privateGameCheckbox; }
export function getJoinGameIdInput() { return joinGameIdInput; }
export function getJoinGameButton() { return joinGameButton; }
export function getBackToModesFromOnline() { return backToModesFromOnline; }
export function getPublicGamesList() { return publicGamesList; }
export function getGameArea() { return gameArea; }
export function getGameStatus() { return gameStatus; }
export function getCells() { return cells; }
export function getResetButton() { return resetButton; }
export function getStartNewRoundButton() { return startNewRoundButton; }
export function getLeaveGameButton() { return leaveGameButton; }
export function getExitSpectatorModeButton() { return exitSpectatorModeButton; }
export function getBackToModesFromGame() { return backToModesFromGame; }
export function getXScoreDisplay() { return xScoreDisplay; }
export function getOScoreDisplay() { return oScoreDisplay; }
export function getDrawsDisplay() { return drawsDisplay; }
export function getChatSection() { return chatSection; }
export function getChatMessagesContainer() { return chatMessagesContainer; }
export function getChatInput() { return chatInput; }
export function getSendChatButton() { return sendChatButton; }
export function getCustomModal() { return customModal; }
export function getModalMessage() { return modalMessage; }
export function getModalCloseButton() { return modalCloseButton; }
export function getThemeToggle() { return themeToggle; }