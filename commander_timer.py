from flask import Flask, render_template, request, redirect,  url_for
import threading
import webbrowser

def parse_mmss(value):
    minutes_text, seconds_text = value.strip().split(":")
    minutes = int(minutes_text)
    seconds = int(seconds_text)

    if minutes < 0 or not 0 <= seconds < 60:
        raise ValueError("Time must be MM:SS with seconds from 00 to 59")

    return minutes * 60 + seconds

app = Flask(__name__)

players = [
    {"id": 1,"name": "Player 1", "starting_time": 600, "remaining_time": 600, "life_total": 40},
    {"id": 2,"name": "Player 2", "starting_time": 600, "remaining_time": 600, "life_total": 40},
    {"id": 3,"name": "Player 3", "starting_time": 600, "remaining_time": 600, "life_total": 40},
    {"id": 4,"name": "Player 4", "starting_time": 600, "remaining_time": 600, "life_total": 40}
]

game_state = {
    "round": 1,
    "active_player_id": 1
}

next_player_id = 5

@app.route("/", methods=["GET", "POST"])
def home():
    global players, next_player_id

    if request.method == "POST":
        submitted_names = request.form.getlist("players")

        for i, name in enumerate(submitted_names):
            players[i]["name"] = name

        submitted_times = request.form.getlist("times")

        for i, time in enumerate(submitted_times):
            players[i]["remaining_time"] = parse_mmss(time)

        if "delete_index" in request.form:
            del_index = int(request.form.get("delete_index"))
            players.pop(del_index)

        elif "move_up" in request.form:
            index = int(request.form.get("move_up"))
            if index > 0:
                player = players.pop(index)
                players.insert(index - 1, player)

        elif "move_down" in request.form:
            index = int(request.form.get("move_down"))
            if index < len(players) - 1:
                player = players.pop(index)
                players.insert(index + 1, player)

        elif "start_game" in request.form:
            return redirect(url_for("scoreboard"))
        
        else:
            players.append({
                "id": next_player_id,
                "name": f"Player {next_player_id}",
                "starting_time": 600,
                "remaining_time": 600,
                "life_total": 40
            })

            next_player_id += 1

    return render_template("setup.html", players=players)

@app.route("/scoreboard")
def scoreboard():
    return render_template("scoreboard.html", players=players, game_state=game_state)

@app.route("/save_game_state", methods=["POST"])
def save_game_state():

    global players, game_state

    # Receive the JSON data from JavaScript
    current_data = request.get_json()

    # Extract player information
    current_players = current_data["players"]

    # Extract overall game information
    current_game_state = current_data["game_state"]

    # Update existing player records using unique IDs
    for current_player in current_players:
        for player in players:
            if player["id"] == current_player["id"]:
                player["name"] = current_player["name"]
                player["remaining_time"] = int(
                    current_player["remaining_time"]
                )
                break

    # Update overall game state
    game_state["round"] = current_game_state["round"]

    game_state["active_player_id"] = current_game_state["active_player_id"]

    return "Game state saved", 200

if __name__ == "__main__":
    url = "http://127.0.0.1:5000"

    # Wait briefly so the server has time to start, then open the browser
    threading.Timer(1, lambda: webbrowser.open(url)).start()

    app.run(host="127.0.0.1", port=5000)