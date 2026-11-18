// =====================================
// 3. SCOREBOARD GAME MECHANICS
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

    // Do not allow eliminated players to lose life
    if (playerRow.dataset.eliminated === "true") {
        return;
    }

    let currentLife = Number(lifeElement.value);

    if (currentLife > 0) {

        currentLife = currentLife - 1;

        // Update life display and metadata
        lifeElement.value = currentLife;
        playerRow.dataset.playerLife = currentLife;
    }

    if (currentLife === 0) {

        playerRow.dataset.eliminated = true;
        playerRow.dataset.eliminationReason = "Life";

        // Update elimination status
        document.getElementById(
            "status-" + playerIndex
        ).textContent = "Eliminated - Life";

        // Disable life controls
        disableLifeControls(playerIndex);

        checkForWinner();
    }
}

function increaseLife(playerIndex) {
    let lifeElement = document.getElementById("life-" + playerIndex);
    let playerRow = playerRows[playerIndex];

    // Do not allow eliminated players to gain life
    if (playerRow.dataset.eliminated === "true") {
        return;
    }

    let currentLife = Number(lifeElement.value);

    currentLife = currentLife + 1;
    // Update both the display and the metadata used when saving game state
    lifeElement.value = currentLife;
    playerRow.dataset.playerLife = currentLife;
}

function editLife(playerIndex) {

    let lifeElement = document.getElementById("life-" + playerIndex);
    let playerRow = playerRows[playerIndex];

    // Do not allow eliminated players to edit life
    if (playerRow.dataset.eliminated === "true") {
        return;
    }

    // Reject empty input
    if (lifeElement.value.trim() === "") {
        lifeElement.value = playerRow.dataset.playerLife;
        return;
    }

    let newLife = Number(lifeElement.value);

    // Validate input
    if (!Number.isInteger(newLife) || newLife < 0) {
        lifeElement.value = playerRow.dataset.playerLife;
        return;
    }

    // Update stored life total
    playerRow.dataset.playerLife = newLife;

    // Handle elimination
    if (newLife === 0) {

        playerRow.dataset.eliminated = true;
        playerRow.dataset.eliminationReason = "Life";

        document.getElementById(
            "status-" + playerIndex
        ).textContent = "Eliminated - Life";

        disableLifeControls(playerIndex);

        checkForWinner();
    }

    saveGameState();
}

// Disable life controls for eliminated players
function disableLifeControls(playerIndex) {

    document.getElementById("life-" + playerIndex).disabled = true;

    document.getElementById("decrease-" + playerIndex).disabled = true;

    document.getElementById("increase-" + playerIndex).disabled = true;
}

// =====================================
// 3b. INITIALIZATION
// =====================================

// Display the saved round number
document.getElementById("round-counter").textContent = round;

// Highlight the saved active player
updateActivePlayer();

// Automatically start the game when the scoreboard loads
startTimer();