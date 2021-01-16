const Game = require('./Game');
const { matches, io } = require('./');

const boardWidth = 7;
const opposite = {'a': 'b', 'b': 'a'};


class Match {
    constructor(options) {
        this.isPublic = options.public;
        this.started = false;
        this.startTimer = 6;
        this.allowMoves = false;
        this.endingTurn = false;
        this.turnTime = options.turnTime * 1000;
        this.runDownTimer = options.runDownTimer;
        this.maxPlayers = options.players;
        this.players = {};
        this.gameMax = options.gameMax;
        this.games = [];
        this.turn = 'a';
        this.turnNum = 1;
        this.host = null;
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
                starting: this.started,
                startTimer: this.startTimer,
                host: this.host.slice(0, 6),
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
        if (Object.keys(this.players).length == 1)
            this.host = Object.keys(this.players)[0];
        this.matchUpdate();
    }

    leave(player) {
        if (!this.started) {
            delete this.players[player];
            
            if (Object.keys(this.players).length == 1)
                this.host = Object.keys(this.players)[0];

            this.matchUpdate();

            if (Object.keys(this.players).length == 0)
                delete matches[this.code];
        }
    }

    startStartTimer(player) {
        if (player == this.host && !this.started) {
            this.started = true;
            this.updateStartTimer();
        }
    }

    updateStartTimer() {
        this.startTimer--;
        if (this.startTimer <= 0) {
            this.start();
        } else {
            this.matchUpdate();
    
            setTimeout(this.updateStartTimer.bind(this), 1000);
        }
    }

    start() {

        let playerList = Object.keys(this.players);
        let n = 0;
        for (let i = 0; i < playerList.length; i++)
            for (let j = 1; j <= (playerList.length > this.gameMax ? this.gameMax : (playerList.length == 1 ? 1 : playerList.length - 1)); j++) {
                let b = ((i + j) >= playerList.length ? (i-playerList.length)+j : i+j);
                this.games.push(new Game(n++, {a: playerList[i], b: playerList[b]}, this));
            }

        let matchInfo = {
            players: this.playerInfo(),
            games: this.games.map(game => ({
                id: game.id,
                players: {
                    a: game.players.a.slice(0,6),
                    b: game.players.b.slice(0,6)
                }
            })),
            turnTime: this.turnTime,
        };
        io.to(this.code).emit('matchStart', matchInfo);

        setTimeout(this.startTurn.bind(this), 250);
    }

    startTurn() {
        this.allowMoves = true;
        for (let i of Object.keys(this.players).filter(player => this.games.find(game => game.outcome == null && game.players[this.turn] == player) != null)) {
            this.players[i].takenTurn = false;
        }

        io.to(this.code).emit('turnSwitch', this.turn);
        
        let currentTurnNum = this.turnNum;
        setTimeout((() => this.endTurn(currentTurnNum)).bind(this), this.turnTime+1000);
    }

    endTurn(turnNum) {
        if (turnNum != this.turnNum || this.endingTurn) return;
        this.turnNum++;
        this.endingTurn = true;

        for (let i of Object.keys(this.players).filter(player => !this.players[player].takenTurn)) { //for every player who hasn't taken their turn
            if (this.players[i].hover != null && this.move(i, this.turn, this.players[i].hover)) //if the player is hovering over a slot, try moving in that slot. if that move is successful,
                continue; //go to the next player who hasnt moved
            for (let k = 0; k < boardWidth; k++) //for every column of that game's board
                if (this.move(i, this.turn, k)) //attempt to make a move in that column
                    continue; //stop attempting moves
        }

        let matchFinished = true;
        for (let i of this.games)
            if (i.outcome === null)
                matchFinished = false;

        if (matchFinished) {
            for (let game of this.games) {
                if (game.outcome == false) { //if the game was a draw
                    //add score to both players
                    for (let i of Object.values(game.players))
                        this.players[i].score += 0.5;
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
            this.endingTurn = false;
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
            if (game.move(column, player, colour))
                moved = true;
            if (game.outcome === null)
                finished = false;
        }
        if (finished)
            this.players[player].finished = true;
        if (moved) {
            this.players[player].takenTurn = true;
            this.hover(player, null);
            if (!this.runDownTimer && Object.values(this.players).find(e => e.takenTurn == false) == null)
                this.endTurn(this.turnNum);
        }
        
        return moved;
    }

    hover(player, column) {
        if (this.players[player].takenTurn) //if the player has already taken their turn
            return;
        if (!Number.isInteger(column) || column < 0 && column >= boardWidth)
            return;
        for (let game of this.games.filter(e => e.players[this.turn] == player && e.outcome == null)) {
            this.players[player].hover = column;
            io.to(this.code).emit('hover', game.id, this.turn, column);
        }
    }
}

module.exports = Match;