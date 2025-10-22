// js/ui.js

// Declare DOM element variables (will be populated in initDOMElements)
let modeSelection, localPvPButton, onlinePvPButton, pvcModeButton;
let localPvPSetupSection, playerXNameInput, playerONameInput, startLocalGameButton, backToModesFromLocalSetup;
// CRITICAL: Ensure backToModesFromPvcSetup is declared here globally
let pvcSetupSection, pvcPlayerNameInput, aiEasyButton, aiMediumButton, aiHardButton, backToModesFromPvcSetup;
let onlineLobbySection, userIdDisplay, currentUserNameDisplay, onlinePlayerNameInput, gameIdDisplay, copyGameIdButton, createGameButton, newGameNameInput, privateGameCheckbox, joinGameIdInput, joinGameButton, backToModesFromOnline, publicGamesList;
let gameArea, gameStatus, cells, resetButton, startNewRoundButton, leaveGameButton, exitSpectatorModeButton, backToModesFromGame;
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

    localPvPSetupSection = document.getElementById('localPvPSetupSection');
    playerXNameInput = document.getElementById('playerXNameInput');
    playerONameInput = document.getElementById('playerONameInput');
    startLocalGameButton = document.getElementById('startLocalGameButton');
    backToModesFromLocalSetup = document.getElementById('backToModesFromLocalSetup');

    // CRITICAL: Ensure assignment happens here
    pvcSetupSection = document.getElementById('pvcSetupSection');
    pvcPlayerNameInput = document.getElementById('pvcPlayerNameInput');
    aiEasyButton = document.getElementById('aiEasyButton');
    aiMediumButton = document.getElementById('aiMediumButton');
    aiHardButton = document.getElementById('aiHardButton');
    backToModesFromPvcSetup = document.getElementById('backToModesFromPvcSetup');

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

    // Add close listener for modal
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', hideModal);
    }
}

/**
 * Shows the custom modal with a message.
 * @param {string} message - The message to display.
 */
export function showModal(message) {
    if (customModal && modalMessage) {
        modalMessage.textContent = message;
        customModal.classList.remove('hidden');
        // Add a temporary class to enable the fade-in effect if needed
        setTimeout(() => customModal.classList.add('opacity-100'), 10); 
    }
}

/**
 * Hides the custom modal.
 */
export function hideModal() {
    if (customModal) {
        customModal.classList.remove('opacity-100');
        // Use a timeout to wait for the fade-out transition before hiding completely
        setTimeout(() => customModal.classList.add('hidden'), 300); 
    }
}

// --- Theme Toggling ---

export function initializeTheme() {
    // Check local storage for theme preference, default to system preference
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
                       (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    document.body.classList.toggle('dark', isDarkMode);
    updateThemeToggleIcon(isDarkMode);
}

export function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateThemeToggleIcon(isDarkMode);
}

function updateThemeToggleIcon(isDarkMode) {
    const icon = themeToggle ? themeToggle.querySelector('i') : null;
    if (icon) {
        icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}


// --- Visibility Functions ---

/**
 * Hides all main application sections.
 */
function hideAllSections() {
    const sections = [modeSelection, localPvPSetupSection, pvcSetupSection, onlineLobbySection, gameArea];
    sections.forEach(section => {
        if (section) section.classList.add('hidden');
    });
}

/**
 * Shows the mode selection screen.
 */
export function showModeSelection() {
    hideAllSections();
    if (modeSelection) modeSelection.classList.remove('hidden');
    // Hide chat when leaving game area
    if (chatSection) chatSection.classList.add('hidden');
}

/**
 * Shows the local PvP setup screen.
 */
export function showLocalPvPSetup() {
    hideAllSections();
    if (localPvPSetupSection) localPvPSetupSection.classList.remove('hidden');
}

/**
 * Shows the PvC (vs AI) setup screen.
 */
export function showPvcSetup() {
    hideAllSections();
    if (pvcSetupSection) pvcSetupSection.classList.remove('hidden');
}

/**
 * Shows the online lobby screen.
 * @param {boolean} clearList - Whether to clear the public games list.
 */
export function showOnlineLobby(clearList = false) {
    hideAllSections();
    if (onlineLobbySection) onlineLobbySection.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden'); // Ensure game area is hidden
    if (chatSection) chatSection.classList.add('hidden'); // Ensure chat is hidden
    if (clearList && publicGamesList) {
        publicGamesList.innerHTML = '';
    }
    // Show Online Info Section
    const onlineInfoSection = document.getElementById('onlineInfoSection');
    if (onlineInfoSection) {
        onlineInfoSection.classList.remove('hidden');
    }
}

/**
 * Shows the main game area.
 * @param {string} mode - The game mode.
 * @param {string|null} userRole - The user's role in the game ('X', 'O', or null for local/spectator).
 * @param {boolean} isSpectator - Whether the user is a spectator.
 */
export function showGameArea(mode, userRole = null, isSpectator = false) {
    hideAllSections();
    if (gameArea) {
        gameArea.classList.remove('hidden');
        
        // Hide/Show specific buttons based on mode
        const buttons = [resetButton, startNewRoundButton, leaveGameButton, exitSpectatorModeButton, backToModesFromGame];
        buttons.forEach(btn => btn ? btn.classList.remove('hidden') : null);

        if (mode === 'onlinePvP') {
            if (chatSection) chatSection.classList.remove('hidden');
            if (isSpectator) {
                if (resetButton) resetButton.classList.add('hidden');
                if (startNewRoundButton) startNewRoundButton.classList.add('hidden');
                if (leaveGameButton) leaveGameButton.classList.add('hidden');
                if (exitSpectatorModeButton) exitSpectatorModeButton.classList.remove('hidden');
                if (backToModesFromGame) backToModesFromGame.classList.add('hidden'); // Back button is not used in spectator mode
            } else {
                if (resetButton) resetButton.classList.add('hidden'); // Scores are persistent in online game, no manual reset
                if (leaveGameButton) leaveGameButton.classList.remove('hidden');
                if (exitSpectatorModeButton) exitSpectatorModeButton.classList.add('hidden');
            }
            // Hide Online Info Section (it's already displayed in lobby)
            const onlineInfoSection = document.getElementById('onlineInfoSection');
            if (onlineInfoSection) {
                onlineInfoSection.classList.add('hidden');
            }
        } else { // localPvP or PvC
            if (chatSection) chatSection.classList.add('hidden');
            if (resetButton) resetButton.classList.remove('hidden');
            if (leaveGameButton) leaveGameButton.classList.add('hidden');
            if (exitSpectatorModeButton) exitSpectatorModeButton.classList.add('hidden');
        }
    }
}

// --- Game Logic UI Updates ---

/**
 * Updates the visual representation of the board.
 * @param {Array<string>} board - The current board state.
 */
export function updateBoardUI(board) {
    if (!cells || cells.length === 0) return;

    cells.forEach((cell, index) => {
        const value = board[index];
        cell.textContent = value;
        
        // Clear previous classes
        cell.classList.remove('x-player', 'o-player', 'filled', 'winning-cell');

        if (value === 'X') {
            cell.classList.add('x-player', 'filled');
        } else if (value === 'O') {
            cell.classList.add('o-player', 'filled');
        }
    });
}

/**
 * Updates the game status message.
 * @param {string} message - The status message to display.
 */
export function updateGameStatus(message) {
    if (gameStatus) {
        gameStatus.textContent = message;
    }
}

/**
 * Updates the displayed scores.
 * @param {object} scores - The scores object {xWins, oWins, draws}.
 */
export function updateScores(scores) {
    if (xScoreDisplay) xScoreDisplay.textContent = scores.xWins;
    if (oScoreDisplay) oScoreDisplay.textContent = scores.oWins;
    if (drawsDisplay) drawsDisplay.textContent = scores.draws;
}

/**
 * Highlights the winning cells.
 * @param {Array<string>} board - The current board state.
 * @param {string} winner - The winning player ('X' or 'O').
 * @param {Array<Array<number>>} winningConditions - The possible winning combinations.
 */
export function highlightWinningCells(board, winner, winningConditions) {
    const winningCombination = winningConditions.find(combination => {
        return combination.every(index => board[index] === winner);
    });

    if (winningCombination) {
        winningCombination.forEach(index => {
            if (cells[index]) {
                cells[index].classList.add('winning-cell');
            }
        });
    }
}

/**
 * Clears all winning cell highlights.
 */
export function clearWinningHighlight() {
    if (cells) {
        cells.forEach(cell => {
            cell.classList.remove('winning-cell');
        });
    }
}

/**
 * Sets whether the cells are interactive (clickable).
 * @param {boolean} isInteractive - True to make them clickable, false otherwise.
 * @param {Array<string>} board - The current board state (needed to check for filled).
 */
export function setCellsInteractive(isInteractive, board) {
    if (!cells) return;
    cells.forEach((cell, index) => {
        // Only cells that are NOT filled can have the pointer.
        // If the game is not interactive, remove the pointer regardless.
        if (isInteractive && board[index] === '') {
            cell.style.pointerEvents = 'auto';
            cell.classList.remove('pointer-events-none');
        } else {
            cell.style.pointerEvents = 'none';
            cell.classList.add('pointer-events-none');
        }
    });
}


// --- Online Lobby Functions (Abbreviated) ---

/**
 * Adds a public game entry to the lobby list.
 * @param {object} game - The game object from Firestore.
 */
export function addPublicGameEntry(game) {
    if (!publicGamesList) return;

    // Check if element already exists to prevent duplicates on update
    let entry = document.getElementById(`game-entry-${game.id}`);
    if (!entry) {
        entry = document.createElement('div');
        entry.id = `game-entry-${game.id}`;
        entry.classList.add('public-game-item', 'flex', 'items-center', 'justify-between', 'p-3', 'border-b', 'dark:border-gray-700', 'hover:bg-gray-100', 'dark:hover:bg-gray-700', 'transition-colors');
        publicGamesList.appendChild(entry);
    }
    
    const statusText = game.playerCount === 1 ? 'Waiting for Player' : 'Game Full / In Progress';
    const buttonText = game.playerCount === 1 ? 'Join' : 'Spectate';
    const buttonClass = game.playerCount === 1 ? 'join-game-button' : 'spectate-game-button';
    const isDisabled = game.playerCount === 2; // Disable join button if game is full

    entry.innerHTML = `
        <div class="flex flex-col flex-grow">
            <span class="font-semibold text-gray-800 dark:text-gray-100">${game.name || 'Untitled Game'}</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">Host: ${game.playerXName}</span>
        </div>
        <div class="flex flex-col items-end gap-1">
            <span class="text-sm font-medium ${game.playerCount === 1 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}">${statusText}</span>
            <button data-game-id="${game.id}" 
                    class="action-button ${buttonClass} bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${isDisabled ? 'disabled' : ''}>
                ${buttonText}
            </button>
        </div>
    `;
}

/**
 * Removes a public game entry from the lobby list.
 * @param {string} gameId - The ID of the game to remove.
 */
export function removePublicGameEntry(gameId) {
    const entry = document.getElementById(`game-entry-${gameId}`);
    if (entry && publicGamesList) {
        publicGamesList.removeChild(entry);
    }
}

/**
 * Sets the displayed user ID.
 * @param {string} userId - The user ID.
 */
export function setUserIdDisplay(userId) {
    if (userIdDisplay) {
        userIdDisplay.textContent = `ID: ${userId.substring(0, 8)}...`;
    }
}

/**
 * Sets the displayed current player name.
 * @param {string} name - The user's chosen name.
 */
export function setCurrentUserNameDisplay(name) {
    if (currentUserNameDisplay) {
        currentUserNameDisplay.textContent = name;
    }
}

/**
 * Sets the displayed game ID in the info section.
 * @param {string} gameId - The game ID.
 */
export function setGameIdDisplay(gameId) {
    if (gameIdDisplay) {
        gameIdDisplay.textContent = `Game ID: ${gameId}`;
    }
}

/**
 * Shows/hides spectator buttons.
 * @param {boolean} isSpectator - True to show spectator mode buttons.
 */
export function setSpectatorMode(isSpectator) {
    if (leaveGameButton) {
        leaveGameButton.classList.toggle('hidden', isSpectator);
    }
    if (exitSpectatorModeButton) {
        exitSpectatorModeButton.classList.toggle('hidden', !isSpectator);
    }
    if (startNewRoundButton) {
        // Spectators cannot start new rounds
        startNewRoundButton.classList.add('hidden');
    }
}

// --- Chat Functions (Abbreviated) ---
export function addChatMessage(message, currentUserId) {
    if (!chatMessagesContainer) return;

    const isSelf = message.senderId === currentUserId;
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', 'flex', 'flex-col', 'max-w-xs', 'shadow-md');
    messageElement.classList.toggle('self', isSelf);
    messageElement.classList.toggle('ml-auto', isSelf);

    const senderName = message.senderName || 'Anonymous';
    const timestamp = new Date(message.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageElement.innerHTML = `
        <span class="sender font-semibold text-xs text-blue-600 dark:text-blue-300">${senderName} <span class="text-xs font-normal text-gray-500 dark:text-gray-400">(${timestamp})</span></span>
        <span class="text text-sm text-gray-800 dark:text-gray-100">${message.text}</span>
    `;

    chatMessagesContainer.appendChild(messageElement);
    // Scroll to the bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    // Clear the input box if the message was from self
    if (isSelf && chatInput) {
        chatInput.value = '';
    }
}

/**
 * Clears all chat messages.
 */
export function clearChatMessages() {
    if (chatMessagesContainer) {
        chatMessagesContainer.innerHTML = '';
    }
}

// --- Online Lobby Request Handling (for Auth dependency) ---

export function setOnlineLobbyRequestPending(isPending) {
    hasPendingOnlineLobbyRequest = isPending;
}

export function isOnlineLobbyRequestPending() {
    return hasPendingOnlineLobbyRequest;
}

export function clearOnlineLobbyRequestPending() {
    hasPendingOnlineLobbyRequest = false;
}


// --- Getter Exported Functions (The fix area) ---

export function getLocalPvPButton() { return localPvPButton; }
export function getOnlinePvPButton() { return onlinePvPButton; }
export function getPvcModeButton() { return pvcModeButton; }

export function getPlayerXNameInput() { return playerXNameInput; }
export function getPlayerONameInput() { return playerONameInput; }
export function getStartLocalGameButton() { return startLocalGameButton; }
export function getBackToModesFromLocalSetup() { return backToModesFromLocalSetup; }

// CRITICAL FIX: The missing getter is added/confirmed here:
export function getPvcPlayerNameInput() { return pvcPlayerNameInput; }
export function getAiEasyButton() { return aiEasyButton; }
export function getAiMediumButton() { return aiMediumButton; }
export function getAiHardButton() { return aiHardButton; }
export function getBackToModesFromPvcSetup() { return backToModesFromPvcSetup; } 

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
export function getCells() { return cells; }
export function getResetButton() { return resetButton; }
export function getStartNewRoundButton() { return startNewRoundButton; }
export function getLeaveGameButton() { return leaveGameButton; }
export function getExitSpectatorModeButton() { return exitSpectatorModeButton; }
export function getBackToModesFromGame() { return backToModesFromGame; }
export function getChatInput() { return chatInput; }
export function getSendChatButton() { return sendChatButton; }
export function getThemeToggle() { return themeToggle; }