// =====================================
// 1. GAME STATE
// =====================================

let round = savedGameState.round; // Initialize the round counter
let activePlayer = 0; // Initialize the active player index
let gamePaused = false; // Initialize the game paused state to false
let timerInterval = null; // Prevent multiple countdown intervals

// Store each player's remaining time
let playerRows = document.querySelectorAll(".player-row");

let timers = Array.from(playerRows).map(function(row) {
    return Number(row.dataset.remainingTime);
});

// Find the active player's current position using their unique ID
activePlayer = Array.from(playerRows).findIndex(function(row) {
    return Number(row.dataset.playerId) ===
        Number(savedGameState.active_player_id);
});

// If the saved active player no longer exists, default to the first player
if (activePlayer === -1) {
    activePlayer = 0;
}

// Maintain a local copy of the historical game log
let gameLog = savedGameState.game_log || [];
