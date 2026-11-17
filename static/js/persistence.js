// =====================================
// 3. STATE PERSISTENCE - How does JavaScript communicate with Flask?
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