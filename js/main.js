// ...existing code...
// js/main.js
// (Rewritten event wiring to use UI getters consistently and fix scope/attribute issues)

import * as Auth from './auth.js';
import * as UI from './ui.js';
import * as GameLogic from './gameLogic.js';
import * as OnlineGame from './onlineGame.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Main: DOMContentLoaded - init");

    UI.initDOMElements();
    UI.initializeTheme();

    // Grab UI elements once (use getters to keep in sync)
    const localPvPButton = UI.getLocalPvPButton();
    const onlinePvPButton = UI.getOnlinePvPButton();
    const pvcModeButton = UI.getPvcModeButton();

    const startLocalGameButton = UI.getStartLocalGameButton();
    const playerXNameInput = UI.getPlayerXNameInput();
    const playerONameInput = UI.getPlayerONameInput();
    const backToModesFromLocalSetup = UI.getBackToModesFromLocalSetup();

    const pvcSetupSection = UI.getPvcSetupSection();
    const pvcPlayerNameInput = UI.getPvcPlayerNameInput();
    const startPvCButton = UI.getStartPvCButton();
    const backToModesFromPvC = UI.getBackToModesFromPvC();

    const createGameButton = UI.getCreateGameButton();
    const newGameNameInput = UI.getNewGameNameInput();
    const privateGameCheckbox = UI.getPrivateGameCheckbox();
    const joinGameButton = UI.getJoinGameButton();
    const joinGameIdInput = UI.getJoinGameIdInput();
    const backToModesFromOnline = UI.getBackToModesFromOnline();
    const onlinePlayerNameInput = UI.getOnlinePlayerNameInput();

    const cells = UI.getCells();
    const resetButton = UI.getResetButton();
    const startNewRoundButton = UI.getStartNewRoundButton();
    const leaveGameButton = UI.getLeaveGameButton();
    const exitSpectatorModeButton = UI.getExitSpectatorModeButton();
    const backToModesFromGame = UI.getBackToModesFromGame();

    const copyGameIdButton = UI.getCopyGameIdButton();
    const modalCloseButton = UI.getModalCloseButton();
    const sendChatButton = UI.getSendChatButton();
    const chatInput = UI.getChatInput();
    const themeToggle = UI.getThemeToggle();

    // Initialize auth & set UI name when ready
    Auth.initializeFirebaseAndAuth((userId) => {
        UI.setUserIdDisplay(userId || '');
        const nameInput = UI.getOnlinePlayerNameInput();
        if (nameInput) {
            nameInput.value = `Player (${userId ? userId.substring(0,4) : 'anon'})`;
            UI.setCurrentUserNameDisplay(nameInput.value);
        } else {
            UI.setCurrentUserNameDisplay(`Guest (${userId ? userId.substring(0,4) : 'anon'})`);
        }

        if (UI.isOnlineLobbyRequestPending()) {
            UI.showOnlineLobby(true);
            OnlineGame.listenToPublicLobby?.();
            UI.clearOnlineLobbyRequestPending();
        }
    });

    // Mode buttons
    localPvPButton?.addEventListener('click', () => {
        UI.showLocalPvPSetup();
        if (playerXNameInput) playerXNameInput.value = 'Player X';
        if (playerONameInput) playerONameInput.value = 'Player O';
    });

    onlinePvPButton?.addEventListener('click', () => {
        UI.showOnlineLobby(Auth.getCurrentUserId() !== null);
        if (Auth.getCurrentUserId() !== null) OnlineGame.listenToPublicLobby?.();
    });

    pvcModeButton?.addEventListener('click', () => {
        UI.showPvcSetup();
        if (pvcPlayerNameInput) pvcPlayerNameInput.value = 'Human Player';
    });

    // Start local PvP
    startLocalGameButton?.addEventListener('click', () => {
        const nameX = playerXNameInput?.value.trim() || 'Player X';
        const nameO = playerONameInput?.value.trim() || 'Player O';
        GameLogic.initializeGame?.('localPvP', false, { X: nameX, O: nameO });
        UI.showGameArea('localPvP');
    });

    backToModesFromLocalSetup?.addEventListener('click', () => UI.showModeSelection());

    // Start PvC using the single start button & difficulty from UI
    startPvCButton?.addEventListener('click', () => {
        const playerName = pvcPlayerNameInput?.value.trim() || 'You';
        const difficulty = UI.getSelectedAiDifficulty?.() || 'medium';
        GameLogic.initializeGame?.('PvC', false, { X: playerName, O: 'AI' }, difficulty);
        UI.showGameArea('PvC');
    });
    backToModesFromPvC?.addEventListener('click', () => UI.showModeSelection());

    // Online create/join
    createGameButton?.addEventListener('click', () => {
        const gameName = newGameNameInput?.value.trim() || '';
        const isPrivate = !!privateGameCheckbox?.checked;
        const playerName = onlinePlayerNameInput?.value.trim() || `Player (${Auth.getCurrentUserId()?.substring(0,4) ?? 'anon'})`;
        OnlineGame.createNewOnlineGame?.(gameName, isPrivate, playerName);
    });

    joinGameButton?.addEventListener('click', () => {
        const gameId = joinGameIdInput?.value.trim() || '';
        const playerName = onlinePlayerNameInput?.value.trim() || `Player (${Auth.getCurrentUserId()?.substring(0,4) ?? 'anon'})`;
        OnlineGame.joinOnlineGame?.(gameId, playerName);
    });

    backToModesFromOnline?.addEventListener('click', () => {
        OnlineGame.exitOnlineGame?.();
        UI.showModeSelection();
    });

    // Cells click handling - use data-index attribute (delegated per-cell listeners are ok)
    if (cells && cells.length) {
        cells.forEach(cell => {
            cell.addEventListener('click', (ev) => {
                const idxAttr = cell.getAttribute('data-index') ?? cell.dataset.index ?? null;
                const idx = idxAttr !== null ? parseInt(idxAttr, 10) : NaN;
                if (Number.isNaN(idx)) return;
                const mode = GameLogic.getGameMode?.() || 'localPvP';
                if (mode === 'localPvP' || mode === 'PvC') {
                    GameLogic.handleCellClick?.(idx);
                } else {
                    OnlineGame.handleOnlineMove?.(idx);
                }
            });
            // keyboard support
            cell.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    cell.click();
                }
            });
        });
    } else {
        console.warn("Main: No game cells found.");
    }

    // Reset / round / leave / spectator
    resetButton?.addEventListener('click', () => {
        const mode = GameLogic.getGameMode?.() || 'localPvP';
        if (mode === 'localPvP' || mode === 'PvC') {
            const playerNames = GameLogic.getPlayerNames?.() || { X: 'Player X', O: 'Player O' };
            GameLogic.initializeGame?.(mode, false, playerNames);
        }
    });

    startNewRoundButton?.addEventListener('click', () => OnlineGame.startNewOnlineRound?.());

    leaveGameButton?.addEventListener('click', () => OnlineGame.leaveOnlineGame?.());

    exitSpectatorModeButton?.addEventListener('click', () => OnlineGame.exitSpectatorMode?.());

    backToModesFromGame?.addEventListener('click', () => {
        const mode = GameLogic.getGameMode?.();
        if (mode === 'onlinePvP') {
            OnlineGame.exitOnlineGame?.();
        } else {
            UI.showModeSelection();
        }
    });

    modalCloseButton?.addEventListener('click', UI.hideModal);

    // Copy game id - robust clipboard handling
    copyGameIdButton?.addEventListener('click', async () => {
        const id = OnlineGame.getCurrentGameId?.() || UI.getGameIdDisplay?.()?.textContent || '';
        if (!id) { UI.showModal("No active game ID"); return; }
        try {
            if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(id);
            else {
                const ta = document.createElement('textarea');
                ta.value = id;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            UI.showModal("Game ID copied");
            setTimeout(UI.hideModal, 900);
        } catch (err) {
            console.error("Copy failed", err);
            UI.showModal("Copy failed");
        }
    });

    // Chat
    sendChatButton?.addEventListener('click', () => {
        const msg = chatInput?.value?.trim() || '';
        if (!msg) return;
        OnlineGame.sendChatMessage?.(msg);
        chatInput.value = '';
    });

    chatInput?.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            sendChatButton?.click();
        }
    });

    // Theme toggle
    themeToggle?.addEventListener('click', UI.toggleTheme);

    // Start view
    UI.showModeSelection();
});
// ...existing code...