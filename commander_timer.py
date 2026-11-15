from flask import Flask, render_template, request, redirect,  url_for

app = Flask(__name__)

players = [
    {"name": "Player 1", "starting_time": 600, "remaining_time": 600},
    {"name": "Player 2", "starting_time": 600, "remaining_time": 600},
    {"name": "Player 3", "starting_time": 600, "remaining_time": 600},
    {"name": "Player 4", "starting_time": 600, "remaining_time": 600}
]

@app.route("/", methods=["GET", "POST"])
def home():
    global players

    if request.method == "POST":
        submitted_names = request.form.getlist("players")

        for i, name in enumerate(submitted_names):
            players[i]["name"] = name

        submitted_times = request.form.getlist("times")

        for i, time in enumerate(submitted_times):
            players[i]["remaining_time"] = int(time)

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
                "name": "New Player",
                "starting_time": 600,
                "remaining_time": 600
            })

    return render_template("setup.html", players=players)

@app.route("/scoreboard")
def scoreboard():
    return render_template("scoreboard.html", players=players)

if __name__ == "__main__":
    app.run()