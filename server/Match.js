const Game = require('./Game');
const { matches, io } = require('./');

const boardWidth = 7;
const numberOfPlayers = [9, 5];
const turnTime = 8000;
const opposite = {'a': 'b', 'b': 'a'};


class Match {
    constructor(isPublic, type) {
        this.isPublic = isPublic;
        this.started = false;
        this.allowMoves = false;
        this.type = type;
        this.maxPlayers = numberOfPlayers[type];
        this.players = {};
        this.games = [];
        this.turn = 'a';
    }

    playerInfo() {
        return Object.keys(this.players).map(player => ({
            id: player.slice(0,6),
            name: this.players[player].name
        }));
    }

    matchUpdate() {
        setTimeout(() => {
            let matchInfo = {
                started: this.games.length > 1 ? true : false,
                public: this.isPublic,
                code: this.code,
                maxPlayers: this.maxPlayers,
                players: this.playerInfo()
            };
            io.to(this.code).emit('matchUpdate', matchInfo);
        }, 100);
    }

    join(player) {
        this.players[player] = {
            score: 0,
            finished: false,
            takenTurn: false,
            name: io.sockets.sockets.get(player).username
        }
        if (Object.keys(this.players).length == this.maxPlayers) {
            this.started = true; //mark this match as started
            setTimeout(() => this.start(), 2000);
        }
        this.matchUpdate();
    }

    leave(player) {
        if (!this.started) {
            delete this.players[player];
            this.matchUpdate();

            if (Object.keys(this.players).length == 0)
                delete matches[this.code];
        }
    }

    start() {

        let playerList = Object.keys(this.players);
        let n = 0;
        switch (this.type) {
            case 0:        
                for (let i = 0; i < this.maxPlayers; i++) {
                    for (let j = i+1; j < this.maxPlayers; j++) {
                        let gamePlayers = {a: playerList[i], b: playerList[j]}
                        if (++n % 2 == 0)  
                            gamePlayers = {a: gamePlayers.b, b: gamePlayers.a};

                        this.games.push(new Game(n-1, gamePlayers, this));
                    }
                }
                break;

            case 1:
                for (let i of playerList) {
                    for (let j of playerList) {
                        if (i != j)
                            this.games.push(new Game(n++, {a: i, b: j}, this));
                    }
                }
                break;
        }

        this.turnTimer = setInterval(this.endTurn.bind(this), turnTime+1000);

        let matchInfo = {
            players: this.playerInfo(),
            games: this.games.map(game => ({
                id: game.id,
                players: {
                    a: game.players.a.slice(0,6),
                    b: game.players.b.slice(0,6)
                }
            })),
            turnTime: turnTime,
        };
        io.to(this.code).emit('matchStart', matchInfo);

        setTimeout(this.startTurn.bind(this), 250);
    }

    startTurn() {
        this.allowMoves = true;
        for (let i in this.players) {
            this.players[i].takenTurn = false;
        }

        io.to(this.code).emit('turnSwitch', this.turn);
    }

    endTurn() {
        for (let i of Object.keys(this.players).filter(player => !this.players[player].takenTurn)) //for every player who hasn't taken their turn
            for (let j of this.games.filter(game => game.players[this.turn] == i)) //for every game where it's that player's turn
                for (let k = 0; k < boardWidth; k++) //for every column of that game's board
                    if (j.move(k, i)) //attempt to make a move in that column
                        break; //stop attempting moves

        let matchFinished = true;
        for (let i of this.games)
            if (i.outcome === null)
                matchFinished = false;

        if (matchFinished) {
            clearInterval(this.turnTimer); //stop future turns from happening
            for (let game of this.games) {
                if (game.outcome == null) { //if the game was a draw
                    //add score to both players
                    for (let i in game.players)
                        this.players[i].score += 0;
                } else { //if not draw
                    this.players[game.players[game.outcome]].score += 1; //add score to winner
                    this.players[game.players[opposite[game.outcome]]].score -= 0; //subtract score from loser
                }
            }

            let results = Object.keys(this.players).map(player => ({
                id: player.slice(0, 6),
                name: this.players[player].name,
                score: this.players[player].score,
            }));

            results.sort((a, b) => b.score - a.score);
            let j = 0;
            let lastScore = null;
            for (let i = 0; i < results.length; i++) {
                if (lastScore !== results[i].score) {
                    j = i + 1;
                    lastScore = results[i].score;
                }
                results[i].placement = j;
            }

            setTimeout(() => {
                io.to(this.code).emit('endMatch', results);
                delete matches[this.code];
            }, 3000);
        } else {
            this.turn = this.turn == 'a' ? 'b' : 'a'; //switch the turn
            this.startTurn(); //start the next turn
        }
    }

    move(player, colour, column) {
        if (this.players[player].takenTurn) //if the player has already taken their turn
            return;
        if (colour !== this.turn)
            return;
        if (!Number.isInteger(column) || column < 0 && column >= boardWidth)
            return;

        let moved = false;
        let finished = true;
        for (let game of this.games.filter(e => e.players[this.turn] == player)) {
            if (game.move(column, player))
                moved = true;
            if (game.outcome === null)
                finished = false;
        }
        if (finished)
            this.players[player].finished = true;
        if (moved)
            this.players[player].takenTurn = true;
        
        return moved;
    }

    hover(player, column) {
        if (this.players[player].takenTurn) //if the player has already taken their turn
            return;
        if (!Number.isInteger(column) || column < 0 && column >= boardWidth)
            return;
        for (let game of this.games.filter(e => e.players[this.turn] == player))
            if (game.outcome == null)
                io.to(this.code).emit('hover', game.id, this.turn, column);
    }
}

module.exports = Match;