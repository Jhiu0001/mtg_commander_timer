// =====================================
// 1. GAME STATE
// =====================================


let round = 1; // Initialize the round counter
let activePlayer = 0; // Initialize the active player index
let gamePaused = false; // Initialize the game paused state to false

// Store each player's remaining time
let playerRows = document.querySelectorAll(".player-row");

let timers = Array.from(playerRows).map(function(row) {
    return Number(row.dataset.remainingTime);
});

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
function nextTurn() {

    // Remember where we started
    let startingPlayer = activePlayer;

    // Keep looking for the next player with time remaining
    do {
        activePlayer = (activePlayer + 1) % timers.length;
        } 
            while (
            timers[activePlayer] === 0 && activePlayer !== startingPlayer
            );

    // Update the round when we return to Player 1
    if (activePlayer === 0) {
        round = round + 1;
        document.getElementById("round-counter").textContent = round;
    }

    // Highlight the new active player
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

    // Count how many players still have time
    let playersRemaining = timers.filter(function(time) {
        return time > 0;
    }).length;

    // If only one player remains, the game is over
    if (playersRemaining === 1) {
        gamePaused = true;
        return true;
    }
    return false;
}

// =====================================
// 4. TIMER MANAGEMENT
// =====================================

// Start the countdown timer
function startTimer() {
    setInterval(function() {
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
        // Capture player name
        let name = row.dataset.playerName;
        // Capture displayed time
        let timeDisplay = row.querySelector("span").textContent;
        // Convert MM:SS into seconds
        let timeParts = timeDisplay.split(":");
        let minutes = parseInt(timeParts[0]);
        let seconds = parseInt(timeParts[1]);
        let remainingTime = (minutes * 60) + seconds;

        // Add player information to our array
        currentPlayers.push({
            name: name,
            remaining_time: remainingTime
        });
    });
    console.log(currentPlayers);
    return currentPlayers;
}        

// Save the current game state to Flask
async function saveGameState() {

    // Capture current player information
    let currentPlayers = captureGameState();

    // Send the data to Flask
    let response = await fetch("/save_game_state", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(currentPlayers)
    });

    // Check whether Flask successfully saved the data
    if (response.ok) {
        console.log("Game state saved successfully!");
        return true;
    } else {
        console.log("Failed to save game state!");
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

// =====================================
// 6. INITIALIZATION
// =====================================

// Highlight the starting player
updateActivePlayer();

// Automatically start the game when the scoreboard loads
startTimer();