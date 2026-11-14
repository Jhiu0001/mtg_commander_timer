from flask import Flask, render_template, request, redirect,  url_for

app = Flask(__name__)
players = ["Player 1", "Player 2", "Player 3", "Player 4"]

@app.route("/", methods=["GET", "POST"])
def home():
    global players

    if request.method == "POST":
        players = request.form.getlist("players")

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
            players.append("New Player")

    return render_template("setup.html", players=players)

@app.route("/scoreboard")
def scoreboard():
    return render_template("scoreboard.html", players=players)

if __name__ == "__main__":
    app.run()