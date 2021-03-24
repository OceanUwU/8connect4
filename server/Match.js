const Game = require('./Game');
const availableCounters = require('../src/Lobby/availableCounters.json');
const { matches, io } = require('./');
const nameWords = require('./nameWords.js');

const opposite = {'a': 'b', 'b': 'a'};
const difficulties = ['E', 'M', 'H'];
const generateMove = require('./bot');
const defaultPlayer = {
    score: 0,
    finished: false,
    takenTurn: false,
};

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

class Match {
    constructor(options) {
        this.isPublic = options.public;
        this.started = false;
        this.startTimer = 6;
        this.allowMoves = false;
        this.endingTurn = false;
        this.lineLength = options.lineLength;
        this.rows = options.rows;
        this.columns = options.columns;
        this.turnTime = options.turnTime * 1000;
        this.runDownTimer = options.runDownTimer;
        this.names = options.names;
        this.maxPlayers = options.players;
        this.players = {};
        this.gameMax = options.gameMax;
        this.games = [];
        this.turn = 'a';
        this.turnNum = 0;
        this.host = null;
    }

    setOptions(options) {
        this.isPublic = options.public;
        this.lineLength = options.lineLength;
        this.rows = options.rows;
        this.columns = options.columns;
        this.turnTime = options.turnTime * 1000;
        this.runDownTimer = options.runDownTimer;
        this.names = options.names;
        this.maxPlayers = options.players;
        this.gameMax = options.gameMax;
        this.matchUpdate();
    }

    playerInfo() {
        return Object.keys(this.players).map(player => ({
            id: player.slice(0,6),
            name: this.turnNum > 0 ? this.players[player].genName : this.players[player].name,
            cosmetics: this.players[player].cosmetics,
            bot: this.players[player].bot,
        }));
    }

    matchInfo() {
        return {
            starting: this.started,
            startTimer: this.startTimer,
            host: this.host.slice(0, 6),
            started: this.games.length > 1 ? true : false,
            code: this.code,
            options: {
                public: this.isPublic,
                lineLength: this.lineLength,
                rows: this.rows,
                columns: this.columns,
                turnTime: Math.round(this.turnTime / 1000),
                runDownTimer: this.runDownTimer,
                players: this.maxPlayers,
                gameMax: this.gameMax,
                names: this.names,
            },
            players: this.playerInfo()
        };
    }

    matchUpdate() {
        setTimeout(() => {
            io.to(this.code).emit('matchUpdate', this.matchInfo());
        }, 100);
    }

    join(player) {
        this.players[player] = {
            ...defaultPlayer,
            name: io.sockets.sockets.get(player).username,
            cosmetics: io.sockets.sockets.get(player).cosmetics,
            bot: false,
            difficulty: 1,
        }
        if (Object.keys(this.players).length == 1)
            this.host = Object.keys(this.players)[0];
        this.matchUpdate();
    }

    leave(player) {
        if (!this.started) {
            delete this.players[player];
            
            if (Object.keys(this.players).length == 0 || !(Object.values(this.players).some(p => !p.bot))) //if there are no players left (not including bots)
                delete matches[this.code];
            else {
                if (!this.players.hasOwnProperty(this.host))
                    this.host = Object.keys(this.players)[0];
                this.matchUpdate();
            }
        } else {
            this.players[player].bot = true;
            if (!(Object.values(this.players).some(p => !p.bot))) { //if there are no non-bot players left
                if (this.turnNum > 0)
                    this.games.forEach(game => game.outcome = false);
                else
                    this.ditchGame = true;
            } else {
                this.players[player].name += '(E🤖)';
                let boards = this.games.filter(game => game.outcome == null && game.players[this.turn] == player);
                if (boards.length > 0)
                    this.move(player, this.turn, generateMove(boards, this.turn, this.players[player].difficulty, this.lineLength));
            }
        }
    }

    addBot(difficulty, adder) {
        if (adder == this.host && !this.started && Object.keys(this.players).length < this.maxPlayers && difficulties.hasOwnProperty(difficulty)) {
            if (Object.values(this.players).filter(p => p.bot).length >= 4)
                return io.sockets.sockets.get(adder).emit('err', 'The maximum amount of bots in a match is 4.', 'Too many bots!');
            difficulty = Number(difficulty);
            let cosmetics = {};
            for (let i of ['a', 'b']) {
                cosmetics[i] = {};
                for (let j of availableCounters) {
                    cosmetics[i][j.key] = j.available[Math.floor(Math.random() * j.available.length)]
                }
            }
            this.players[String(Math.random()).slice(2, 12)] = {
                ...defaultPlayer,
                name: `${difficulties[difficulty]}🤖${String(Math.random()).slice(2, 5)}`,
                cosmetics: cosmetics,
                bot: true,
                difficulty: difficulty+1,
            }
            this.matchUpdate();
        }
    }

    kick(player, kicker) {
        if (kicker == this.host && !this.started) {
            let toKick = Object.keys(this.players).find(p => p.startsWith(player));
            if (toKick != null && toKick != kicker) {
                if (this.players[toKick].bot) {
                    delete this.players[toKick];
                } else {
                    this.leave(toKick);
                    let socket = io.sockets.sockets.get(toKick);
                    socket.emit('kicked', io.sockets.sockets.get(kicker).username);
                    socket.disconnect();
                }
                this.matchUpdate();
            }
        }
    }

    promote(player, promoter) {
        if (promoter == this.host && !this.started) {
            let toPromote = Object.keys(this.players).find(p => p.startsWith(player));
            if (toPromote != null && toPromote != promoter && !this.players[toPromote].bot) {
                this.host = toPromote;
                this.matchUpdate();
            }
        }
    }

    startStartTimer(player) {
        if (player == this.host && !this.started) {
            this.started = true;
            delete this.rejoinCode;
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
        this.turnNum = 1;
        let playerList = Object.keys(this.players);
        shuffleArray(playerList);
        let n = 0;
        for (let i = 0; i < playerList.length; i++)
            for (let j = 1; j <= (playerList.length > this.gameMax ? this.gameMax : (playerList.length == 1 ? 1 : playerList.length - 1)); j++) {
                let b = ((i + j) >= playerList.length ? (i-playerList.length)+j : i+j);
                this.games.push(new Game(n++, {a: playerList[i], b: playerList[b]}, this));
            }
        shuffleArray(this.games);
        this.games.forEach((game, index) => game.id = index);

        switch (this.names) {
            case 0: //normal
                Object.values(this.players).forEach(player => player.genName = player.name);
                break;

            case 1: //gifted
                let shuffledNames = shuffleArray(Object.values(this.players).map(player => player.name));
                Object.values(this.players).forEach((player, index) => player.genName = shuffledNames[index]);
                break;

            case 2: //random
                Object.values(this.players).forEach((player, index) => player.genName = `${nameWords.adjectives[Math.floor(Math.random() * nameWords.adjectives.length)]}${nameWords.nouns[Math.floor(Math.random() * nameWords.nouns.length)]}`);
                break;         
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
            lineLength: this.lineLength,
            rows: this.rows,
            columns: this.columns,
            options: this.matchInfo().options,
        };
        io.to(this.code).emit('matchStart', matchInfo);

        if (this.ditchGame)
            this.games.forEach(game => game.outcome = false);

        setTimeout(this.startTurn.bind(this), 250);
    }

    startTurn() {
        this.allowMoves = true;
        for (let i of Object.keys(this.players).filter(player => this.games.some(game => game.outcome == null && game.players[this.turn] == player))) {
            this.players[i].takenTurn = false;
            io.to(this.code).emit('ts', i.slice(0, 6), false);
        }

        io.to(this.code).emit('turnSwitch', this.turn);
        
        let currentTurnNum = this.turnNum;
        setTimeout((() => this.endTurn(currentTurnNum)).bind(this), this.turnTime+1000);

        //move all bots
        for (let i of Object.keys(this.players).filter(p => this.players[p].bot && !this.players[p].takenTurn)) {
            let boards = this.games.filter(game => game.outcome == null && game.players[this.turn] == i);
            let move;
            if (this.turnNum <= 2) { //if it is the first turn on either side
                move = Math.floor(Math.random() * this.columns);
            } else {
                move = generateMove(boards, this.turn, this.players[i].difficulty, this.lineLength);
            }
            if (Object.keys(this.players).some(player => !this.players[player].bot && this.games.some(game => game.outcome == null && (game.players[this.turn] == player || game.players[this.turn == 'a' ? 'b' : 'a'] == player)))) {
                this.hover(i, move);
                setTimeout(() => this.move(i, this.turn, move), 500);
            } else {
                this.move(i, this.turn, move);
            }
        }
    }

    endTurn(turnNum) {
        if (turnNum != this.turnNum || this.endingTurn) return;
        this.turnNum++;
        this.endingTurn = true;

        for (let i of Object.keys(this.players).filter(player => !this.players[player].takenTurn)) { //for every player who hasn't taken their turn
            if (this.players[i].hover != null && this.move(i, this.turn, this.players[i].hover)) //if the player is hovering over a slot, try moving in that slot. if that move is successful,
                continue; //go to the next player who hasnt moved
            for (let k = 0; k < this.columns; k++) //for every column of that game's board
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
                        this.players[i].score += 1 / 2; //win amount divided by 2
                } else { //if not draw
                    this.players[game.players[game.outcome]].score += 1; //add score to winner
                    this.players[game.players[opposite[game.outcome]]].score -= 0; //subtract score from loser
                }
            }

            let results = Object.keys(this.players).map(player => ({
                id: player.slice(0, 6),
                name: this.names == 0 ? this.players[player].genName : `${this.players[player].name} (${this.players[player].genName})`,
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
                io.to(this.code).emit('endMatch', results, String(Math.random()).slice(2));
                delete matches[this.code];
            }, 3000);
        } else {
            this.turn = this.turn == 'a' ? 'b' : 'a'; //switch the turn
            this.endingTurn = false;
            this.startTurn(); //start the next turn
        }
    }

    move(player, colour, column) {
        if (this.turnNum < 1 || this.players[player].takenTurn) //if the player has already taken their turn
            return;
        if (colour !== this.turn)
            return;
        if (!Number.isInteger(column) || column < 0 && column >= this.columns)
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
            io.to(this.code).emit('ts', player.slice(0, 6), true);
            this.hover(player, null);
            if (!this.runDownTimer && Object.values(this.players).find(e => e.takenTurn == false) == null)
                this.endTurn(this.turnNum);
        }
        
        return moved;
    }

    hover(player, column) {
        if (this.turnNum < 1 || this.players[player].takenTurn) //if the player has already taken their turn
            return;
        if (!Number.isInteger(column) || column < 0 && column >= this.columns)
            return;
        for (let game of this.games.filter(e => e.players[this.turn] == player && e.outcome == null)) {
            this.players[player].hover = column;
            io.to(this.code).emit('hover', game.id, this.turn, column);
        }
    }
}

module.exports = Match;
