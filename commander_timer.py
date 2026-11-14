from flask import Flask, render_template, request

app = Flask(__name__)
players = ["Player 1", "Player 2", "Player 3", "Player 4"]

@app.route("/", methods=["GET", "POST"])
def home():
    global players
    
    if request.method == "POST":
        players = request.form.getlist("players")
        players.append("New Player")

    return render_template("setup.html", players=players)

if __name__ == "__main__":
    app.run()