// =====================================
// 5. LOGGING
// =====================================

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