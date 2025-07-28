// js/ui.js

// Declare DOM element variables (will be populated in initDOMElements)
let modeSelection, localPvPButton, onlinePvPButton, pvcModeButton;
let onlineLobbySection, userIdDisplay, gameIdDisplay, copyGameIdButton, createGameButton, newGameNameInput, privateGameCheckbox, joinGameIdInput, joinGameButton, backToModesFromOnline, publicGamesList;
let gameArea, gameStatus, cells, resetButton, rematchButton, backToModesFromGame;
let xScoreDisplay, oScoreDisplay, drawsDisplay;
let chatSection, chatMessagesContainer, chatInput, sendChatButton;
let customModal, modalMessage, modalCloseButton;
let themeToggle;

let hasPendingOnlineLobbyRequest = false;

/**
 * Initializes all DOM element references. This should be called after DOMContentLoaded.
 */
export function initDOMElements() {
    console.log("UI: Initializing DOM elements...");
    modeSelection = document.getElementById('modeSelection');
    localPvPButton = document.getElementById('localPvPButton');
    onlinePvPButton = document.getElementById('onlinePvPButton');
    pvcModeButton = document.getElementById('pvcModeButton');

    onlineLobbySection = document.getElementById('onlineLobbySection');
    userIdDisplay = document.getElementById('userIdDisplay');
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
    cells = document.querySelectorAll('.cell'); // NodeList
    resetButton = document.getElementById('resetButton');
    rematchButton = document.getElementById('rematchButton');
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

    // Add console.error if any critical element is not found
    if (!modeSelection) console.error("UI: modeSelection element not found!");
    if (!localPvPButton) console.error("UI: localPvPButton element not found!");
    // ... (you can add similar checks for other critical elements if needed)
}


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
 * Sets the current game ID display in the UI.
 * @param {string} id - The game ID.
 */
export function setGameIdDisplay(id) {
    if (gameIdDisplay) gameIdDisplay.textContent = id;
}

/**
 * Shows the mode selection screen and hides other sections.
 */
export function showModeSelection() {
    console.log("UI: Showing mode selection.");
    if (modeSelection) modeSelection.classList.remove('hidden');
    if (onlineLobbySection) onlineLobbySection.classList.add('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    if (chatSection) chatSection.classList.add('hidden'); // Hide chat when not in game
    if (rematchButton) rematchButton.classList.add('hidden'); // Hide rematch button
    hasPendingOnlineLobbyRequest = false; // Reset this flag when leaving online flow
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
    if (modeSelection) modeSelection.classList.add('hidden');
    if (onlineLobbySection) onlineLobbySection.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    if (chatSection) chatSection.classList.add('hidden'); // Hide chat when not in game
    if (rematchButton) rematchButton.classList.add('hidden'); // Hide rematch button
    if (publicGamesList) publicGamesList.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Loading public games...</p>'; // Reset lobby list
}

/**
 * Shows the game area and hides other sections.
 * @param {string} mode - The current game mode.
 */
export function showGameArea(mode) {
    console.log("UI: Showing game area for mode:", mode);
    if (modeSelection) modeSelection.classList.add('hidden');
    if (onlineLobbySection) onlineLobbySection.classList.add('hidden');
    if (gameArea) gameArea.classList.remove('hidden');
    if (resetButton) resetButton.style.display = 'block'; // Always show reset button in game
    if (rematchButton) rematchButton.classList.add('hidden'); // Hide rematch initially
    if (mode === 'onlinePvP') {
        if (chatSection) chatSection.classList.remove('hidden'); // Show chat for online mode
    } else {
        if (chatSection) chatSection.classList.add('hidden'); // Hide chat for other modes
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
        if (enable && boardState[index] === '') {
            if (mode === 'onlinePvP') {
                // For online, enable only if it's your turn AND cell is empty
                if (currentTurnPlayer === localPlayerRole) {
                    cell.style.pointerEvents = 'auto';
                    cell.classList.remove('cursor-not-allowed');
                } else {
                    cell.style.pointerEvents = 'none';
                    cell.classList.add('cursor-not-allowed');
                }
            } else { // For localPvP and PvC, enable if empty
                cell.style.pointerEvents = 'auto';
                cell.classList.remove('cursor-not-allowed');
            }
        } else {
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
        messageElement.classList.add('self', 'bg-blue-200', 'dark:bg-blue-600', 'ml-auto');
    } else {
        messageElement.classList.add('bg-gray-200', 'dark:bg-gray-700', 'mr-auto');
    }

    const senderSpan = document.createElement('span');
    senderSpan.classList.add('sender', 'font-semibold', 'text-sm', 'block', 'mb-1');
    senderSpan.textContent = messageData.sender + ":";

    const textSpan = document.createElement('span');
    textSpan.classList.add('text', 'text-gray-800', 'dark:text-gray-100');
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
 */
export function renderPublicGames(games, onJoinGame) {
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
        const playerXStatus = game.playerXId ? 'X' : '';
        const playerOStatus = game.playerOId ? 'O' : '';
        const players = [playerXStatus, playerOStatus].filter(Boolean).join(' vs ');
        gameInfo.textContent = `${gameName} (${players || 'Waiting'})`;

        const joinButton = document.createElement('button');
        joinButton.classList.add('px-3', 'py-1', 'bg-blue-500', 'text-white', 'rounded-md', 'hover:bg-blue-600', 'transition-colors', 'duration-200');
        joinButton.textContent = 'Join';
        joinButton.onclick = () => onJoinGame(game.gameId);

        gameItem.appendChild(gameInfo);
        gameItem.appendChild(joinButton);
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
export function getOnlineLobbySection() { return onlineLobbySection; }
export function getUserIdDisplay() { return userIdDisplay; }
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
export function getRematchButton() { return rematchButton; }
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
