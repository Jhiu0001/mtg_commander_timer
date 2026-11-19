// =====================================
// Timer
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
                    eliminatePlayer(activePlayer, "Time");
                }
        }
    }, 1000);
}

// Time display as MM:SS
function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;

    return String(minutes).padStart(2, "0") + ":" +
        String(remainingSeconds).padStart(2, "0");
}