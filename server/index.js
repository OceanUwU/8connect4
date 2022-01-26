const cfg = require('./cfg');
const availableCounters = require('../src/Lobby/availableCounters.json');
const maxUsernameLength = 12;
const allowedUsernameChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 áéíóúÁÉÍÓÚ!"£$€%^&*()-=_+[]{};\'#:@~,./<>?\\|`¬¦';
const playersAllowed = [1, 25];
const maxGamesAllowed = [1, 4];
const turnTimesAllowed = [0, 1000];

const codeLength = 4;
const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const io = require("socket.io")(cfg.port, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
});

const defaultCosmetics = {};
for (let i of ['a', 'b']) {
    defaultCosmetics[i] = {
        s: 0, //shape
        c: 0, //colour
        f: 0, //filled
    }
}

let cosmeticsValid = cosmetics => {
    if (typeof cosmetics != 'object') return false;
    for (let i of ['a', 'b']) {
        if (!cosmetics.hasOwnProperty(i) || typeof cosmetics[i] != 'object') return false;
        for (let j of availableCounters) {
            if (!cosmetics[i].hasOwnProperty(j.key) || !j.available.includes(cosmetics[i][j.key])) return false;
        }
    }
    return true;
}

function generateUsername(socket) {
    socket.username = `player${String(Math.random()).slice(2, 2+3)}`;
}

function joinMatch(match, socket) {
    if (socket.ingame)
        return socket.emit('err');
    if (Object.keys(match.players).length >= match.maxPlayers)
        return socket.emit('err', 'That match was full or had already started.', 'Couldn\'t join match');
    match.join(socket.id);
    socket.join(match.code);
    socket.emit('joinMatch');
    socket.ingame = match.code;
}

function createMatch(socket, options) {
    if (socket != null && socket.ingame)
        return;
    let match = new Match(options);
    let code = generateMatchCode();
    matches[code] = match;
    match.code = code;
    if (socket != null)
        joinMatch(match, socket);
    setTimeout(() => {
        if (matches[code] && Object.keys(matches[code].players).length == 0)
            delete matches[code];
    }, 10000);
    return match;
}

let optionsValid = options => (
    typeof options == 'object'
    && options != null
    && typeof options.public == 'boolean'
    && Number.isInteger(options.players)
    && options.players >= playersAllowed[0]
    && options.players <= playersAllowed[1]
    && Number.isInteger(options.gameMax)
    && options.gameMax >= maxGamesAllowed[0]
    && options.gameMax <= maxGamesAllowed[1]
    && Number.isInteger(options.lineLength)
    && options.lineLength >= 3
    && options.lineLength <= 6
    && Number.isInteger(options.columns)
    && options.columns >= 3
    && options.columns <= 10
    && Number.isInteger(options.rows)
    && options.rows >= 3
    && options.rows <= 10
    && typeof options.turnTime == 'number'
    && options.turnTime >= turnTimesAllowed[0]
    && options.turnTime <= turnTimesAllowed[1]
    && typeof options.runDownTimer == 'boolean'
    && typeof options.customBots == 'boolean'
    && Number.isInteger(options.names)
    && options.names >= 0
    && options.names <= 2
);

io.on('connection', socket => {
    generateUsername(socket);
    socket.cosmetics = defaultCosmetics;
    socket.ingame = false;

    socket.on('changeName', newName => {
        if (typeof newName == 'string') {
            let usernameAllowed = true;
            for (let i of newName)
                if (!allowedUsernameChars.includes(i))
                    usernameAllowed = false;
                
            if (usernameAllowed && newName.length > 0 && newName.length <= maxUsernameLength) {
                socket.username = newName;
            } else
                generateUsername(socket);
            
            if (socket.ingame && matches[socket.ingame].turnNum == 0) {
                matches[socket.ingame].players[socket.id].name = socket.username;
                matches[socket.ingame].matchUpdate();
            }
        }
    });

    socket.on('cosmetics', cosmetics => {
        if (cosmeticsValid(cosmetics)) {
            socket.cosmetics = cosmetics;
            if (socket.ingame && matches[socket.ingame].turnNum == 0) {
                matches[socket.ingame].players[socket.id].cosmetics = socket.cosmetics;
                matches[socket.ingame].matchUpdate();
            }
        }
    });

    socket.on('joinMatch', code => {
        if (typeof code == 'string' && matches.hasOwnProperty(code.toUpperCase())) {
            let match = matches[code.toUpperCase()];
            if (Object.keys(match.players).length < match.maxPlayers) {
                if (!match.started)
                    joinMatch(match, socket);
                else
                    socket.emit('err', ':(', 'That match has already started.');
            } else
                socket.emit('err', `It's reached its ${match.maxPlayers} player limit, and no more players can join.`, 'That match is full.');
        } else
            socket.emit('err', 'Try again.', 'Invalid room code')
    });

    socket.on('findMatch', () => {
        let matchesAvailable = Object.values(matches).filter(e => e.isPublic && !e.started && Object.keys(e.players).length < e.maxPlayers);
        if (matchesAvailable.length > 0) //if there are available matches
            joinMatch(matchesAvailable[Math.floor(Math.random()*matchesAvailable.length)], socket);
        else
            socket.emit('noMatches');
    });

    socket.on('rejoin', (rejoinCode, options) => {
        if (typeof rejoinCode == 'string') {
            let match = Object.values(matches).find(m => m.rejoinCode == rejoinCode);
            if (match != undefined) {
                socket.emit('rejoin', match.code);
            } else {
                if (optionsValid(options)) {
                    match = createMatch(null, options);
                    match.rejoinCode = rejoinCode;
                    socket.emit('rejoin', match.code);
                }
            }
        }
    });

    socket.on('createMatch', options => {
        if (optionsValid(options))
            createMatch(socket, {
                public: options.public,
                players: options.players,
                gameMax: options.gameMax,
                lineLength: options.lineLength,
                rows: options.rows,
                columns: options.columns,
                turnTime: options.turnTime,
                runDownTimer: options.runDownTimer,
                names: options.names,
                customBots: options.customBots,
            });
    });

    socket.on('updateOptions', newOptions => {
        if (socket.ingame && matches[socket.ingame].host == socket.id && !matches[socket.ingame].started && optionsValid(newOptions))
            matches[socket.ingame].setOptions({
                ...newOptions,
                players: matches[socket.ingame].maxPlayers,
            });
    });

    socket.on('newRoomCode', () => {
        if (socket.ingame && matches[socket.ingame].host == socket.id && !matches[socket.ingame].started) {
            let match = matches[socket.ingame];
            let oldCode = match.code;
            let newCode = generateMatchCode();
            delete matches[oldCode];
            matches[newCode] = match;
            match.code = newCode;
            Object.keys(match.players).forEach(id => {
                let p = io.sockets.sockets.get(id);
                p.ingame = newCode;
                p.leave(oldCode);
                p.join(newCode);
            });
            match.matchUpdate();
        }
    });

    socket.on('bot', difficulty => {
        if (socket.ingame)
            matches[socket.ingame].addBot(difficulty, socket.id);
    });

    socket.on('kick', toKick => {
        if (socket.ingame)
            matches[socket.ingame].kick(toKick, socket.id);
    });

    socket.on('promote', toPromote => {
        if (socket.ingame)
            matches[socket.ingame].promote(toPromote, socket.id);
    });

    socket.on('startMatch', () => {
        if (socket.ingame)
            matches[socket.ingame].startStartTimer(socket.id);
    });

    socket.on('move', (colour, column) => {
        if (socket.ingame && typeof colour == 'string' && typeof column == 'number') {
            let match = matches[socket.ingame];
            if (match && match.allowMoves)
                if (match.move(socket.id, colour, column))
                    socket.emit('takenTurn', colour);
        }
    });

    socket.on('hover', column => {
        if (socket.ingame && typeof column == 'number') {
            let match = matches[socket.ingame];
            if (match && match.allowMoves)
                match.hover(socket.id, column);
        }
    })

    socket.on('disconnect', () => {
        if (socket.ingame && matches[socket.ingame])
            matches[socket.ingame].leave(socket.id);
    });
});

function generateMatchCode() {
    let code;
    do {
        code = '';
        for (let i = 0; i < codeLength; i++)
            code += codeChars[Math.floor(Math.random()*codeChars.length)];
    } while (matches.hasOwnProperty(code))
    return code;
}

var matches = {};

module.exports = {
    io,
    matches
};

const Match = require('./Match');

console.log(`Server up, port ${cfg.port}`);
