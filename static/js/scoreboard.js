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

// =====================================
// 2. DISPLAY FUNCTIONS
// =====================================

// Update the active player highlight
function updateActivePlayer() {

    let playerRows = document.querySelectorAll(".player-row");
    // Remove the highlight from all players    
    playerRows.forEach(function(row) {
        row.classList.remove("active-player");
    });
    // Highlight the active player
    playerRows[activePlayer].classList.add("active-player");
}

// Time display as MM:SS
function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;

    return String(minutes).padStart(2, "0") + ":" +
        String(remainingSeconds).padStart(2, "0");
}

// =====================================
// 3. GAME MECHANICS
// =====================================

// Advance to the next player
async function nextTurn() {

    // Remember the player whose turn is ending
    let startingPlayer = activePlayer;

    // Work out who should play next, skipping eliminated players
    let nextPlayer = activePlayer;
    let playersChecked = 0;

    do {
        nextPlayer = (nextPlayer + 1) % timers.length;
        playersChecked++;
    }
    while (
        playerRows[nextPlayer].dataset.eliminated === "true"
        && playersChecked < timers.length
    );

    // Stop if everyone is eliminated
    if (nextPlayer === startingPlayer) {
        return;
    }

   // Determine whether the next turn starts a new round
    let nextRound = round;

    if (nextPlayer <= startingPlayer) {
        nextRound++;
    }

    // Capture the outgoing player's historical snapshot
    let logEntry = captureLogEntry();

    // Save the snapshot and the upcoming game state to Flask
    let saved = await saveLogEntry(
        logEntry,
        nextRound,
        nextPlayer
    );

    // Do not advance if saving failed
    if (!saved) {
        return;
    }

    // Commit the new active player and round
    activePlayer = nextPlayer;
    round = nextRound;

    document.getElementById("round-counter").textContent = round;

    updateActivePlayer();
}

// Toggle timeout
function toggleTimeout() {
    gamePaused = !gamePaused;

    if (gamePaused) {
        document.querySelector("button[onclick='toggleTimeout()']").textContent = "Resume Game";
    } else {
        document.querySelector("button[onclick='toggleTimeout()']").textContent = "Timeout";
    }
}

// Timeout hotkey: CTRL+P
document.addEventListener("keydown", function(event) {

    if (event.ctrlKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        toggleTimeout();
    }

});

// Checks for active clock
function checkForWinner() {

    // Count players who have not been eliminated
    let playersRemaining = Array.from(playerRows).filter(function(row) {
        return row.dataset.eliminated !== "true";
    }).length;

    // If only one player remains, the game is over
    if (playersRemaining === 1) {
        gamePaused = true;
        return true;
    }

    return false;
}

function decreaseLife(playerIndex) {
    let lifeElement = document.getElementById("life-" + playerIndex);
    let playerRow = playerRows[playerIndex];

    // Do not allow eliminated players to gain life
    if (playerRow.dataset.eliminated === "true") {
        return;
    }

    let currentLife = parseInt(lifeElement.textContent);

    if (currentLife > 0) {
        currentLife = currentLife - 1;

        // Update life display and metadata
        lifeElement.textContent = currentLife;
        playerRow.dataset.playerLife = currentLife;
    }

    if (currentLife === 0) {
        playerRow.dataset.eliminated = true;
        playerRow.dataset.eliminationReason = "Life";

        // Update elimination status
        document.getElementById(
            "status-" + playerIndex
        ).textContent = "Eliminated - Life";
    }
}

function increaseLife(playerIndex) {
    let lifeElement = document.getElementById("life-" + playerIndex);
    let playerRow = playerRows[playerIndex];

    // Do not allow eliminated players to gain life
    if (playerRow.dataset.eliminated === "true") {
        return;
    }

    let currentLife = parseInt(lifeElement.textContent);

    currentLife = currentLife + 1;
    // Update both the display and the metadata used when saving game state
    lifeElement.textContent = currentLife;
    playerRow.dataset.playerLife = currentLife;
}

// =====================================
// 4. TIMER MANAGEMENT
// =====================================

// Start the countdown timer
function startTimer() {
    // Prevent multiple countdown intervals
    if (timerInterval !== null) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(function() {
        // Do nothing while the game is paused
        if (gamePaused) {
            return;
        }
        if (timers.length === 0) {
            return;
        }
        if (timers[activePlayer] > 0) {

                timers[activePlayer] = timers[activePlayer] - 1;

                document.getElementById(
                    "timer-" + activePlayer
                ).textContent =
                    formatTime(timers[activePlayer]);

                if (timers[activePlayer] === 0) {

            let playerRow = playerRows[activePlayer];

            // Record time-based elimination
            playerRow.dataset.eliminated = true;
            playerRow.dataset.eliminationReason = "Time";

            // Update scoreboard status
            document.getElementById(
                "status-" + activePlayer
            ).textContent = "Eliminated - Time";

            checkForWinner();
        }
        }
    }, 1000);
}

// =====================================
// 5. STATE PERSISTENCE
// =====================================

// Capture the current game state
function captureGameState() {

    let currentPlayers = [];

    // Find every player displayed on the scoreboard
    let playerRows = document.querySelectorAll(".player-row");
    playerRows.forEach(function(row) {
        // Capture player ID
        let id = Number(row.dataset.playerId);
        // Capture player name
        let name = row.dataset.playerName;
        // Capture displayed time
        let timeDisplay = row.querySelector(".player-timer").textContent;
        // Convert MM:SS into seconds
        let timeParts = timeDisplay.split(":");
        let minutes = parseInt(timeParts[0]);
        let seconds = parseInt(timeParts[1]);
        let remainingTime = (minutes * 60) + seconds;
        // Capture displayed life
        let life =  row.querySelector(".player-life").textContent;

        // Add player information to our array
        currentPlayers.push({
            id: id,
            name: name,
            remaining_time: remainingTime,
            life_total: life
        });
    });

    return currentPlayers;
}        

// Save the current game state to Flask
async function saveGameState() {

    // Capture current player information
    let currentPlayers = captureGameState();

    // Identify the active player using their unique ID
    let activePlayerId = Number(
        playerRows[activePlayer].dataset.playerId
    );

    // Combine player information and game information
    let currentGameState = {
        players: currentPlayers,

        game_state: {
            round: round,
            active_player_id: activePlayerId
        }
    };

    // Send the data to Flask
    let response = await fetch("/save_game_state", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(currentGameState)
    });

    // Check whether Flask successfully saved the data
    if (response.ok) {
        console.log("Saved GS");
        return true;
    } else {
        console.log("Failed to save game state!");
        return false;
    }
}

// Capture a log entry for a completed turn
function captureLogEntry() {

    // Identify the player whose turn is ending
    let activePlayerRow = playerRows[activePlayer];

    let playerName = activePlayerRow.dataset.playerName;

    // Capture the active player's remaining time in seconds
    let remainingTime = timers[activePlayer];

    // Capture every player's current life total
    let lifeTotals = Array.from(playerRows).map(function(row) {
        return Number(row.querySelector(".player-life").textContent);
    });

    // Return the historical snapshot
    return {
        round: round,
        player_name: playerName,
        remaining_time: remainingTime,
        life_totals: lifeTotals
    };
}

// Send a historical snapshot to Flask
async function saveLogEntry(logEntry, nextRound, nextPlayerIndex) {
    try {
        let response = await fetch("/save_game_state", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                players: captureGameState(),
                game_state: {
                    round: nextRound,
                    active_player_id: Number(
                        playerRows[nextPlayerIndex].dataset.playerId
                    )
                },
                log_entry: logEntry
            })
        });

        if (response.ok) {

            // Update the local game log
            gameLog.push(logEntry);

            console.log("Game log saved");
            return true;
        } 
        else {
            console.log("Failed to save game log!");
            return false;
        }

    } catch (error) {
        console.error("Error saving game log:", error);
        return false;
    }
}

// Return to Setup after saving the game state
async function backToSetup() {
    let saved = await saveGameState();
    if (saved) {
        window.location.href = "/";
    }
}

// Start a new game
async function newGame() {

    // Confirm before destroying current game progress
    let confirmed = confirm(
        "Are you sure you want to start a new game? " +
        "All current game progress will be reset."
    );

    // Stop if the user cancels
    if (!confirmed) {
        return;
    }

    // Send request to Flask
    let response = await fetch("/new_game", {
        method: "POST"
    });

    // Redirect after successful reset
    if (response.ok) {
        window.location.href = "/scoreboard";
    } else {
        alert("Failed to start a new game!");
    }
}

// =====================================
// 6. LOGGING
// =====================================

// Display the historical game log
function displayGameLog() {

    let logBody = document.getElementById("game-log-body");

    // Clear existing rows before rebuilding the table
    logBody.innerHTML = "";

    // Loop through every historical snapshot
    gameLog.forEach(function(entry) {

        let row = document.createElement("tr");

        // Round
        let roundCell = document.createElement("td");
        roundCell.textContent = entry.round;

        // Player
        let playerCell = document.createElement("td");
        playerCell.textContent = entry.player_name;

        // Remaining time
        let timeCell = document.createElement("td");
        timeCell.textContent = formatTime(entry.remaining_time);

        row.appendChild(roundCell);
        row.appendChild(playerCell);
        row.appendChild(timeCell);

        // Individual player life totals
        entry.life_totals.forEach(function(life) {
            let lifeCell = document.createElement("td");
            lifeCell.textContent = life;
            row.appendChild(lifeCell);
        });

        logBody.appendChild(row);
    });
}

// Show or hide the game log
function toggleGameLog() {

    let logContainer = document.getElementById("game-log-container");

    if (logContainer.style.display === "none") {
        displayGameLog();
        logContainer.style.display = "block";
    } else {
        logContainer.style.display = "none";
    }
}

// =====================================
// 7. INITIALIZATION
// =====================================

// Display the saved round number
document.getElementById("round-counter").textContent = round;

// Highlight the saved active player
updateActivePlayer();

// Automatically start the game when the scoreboard loads
startTimer();