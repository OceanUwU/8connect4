import React from 'react';
import ReactDOM from 'react-dom';
import theme from '../theme';
import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/core/styles';
import Match from './';
import Results from '../Results';
import shuffleString from './shuffleString';
import images from './images';
import * as controller from './controller';

const boxSize = 50;
const gridlineSize = 4;
const gameNameChars = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const placeAudio = new Audio('/place.mp3');
const otherPlaceAudio = new Audio('/otherPlace.mp3');
const gameEndAudio = new Audio('/endGame.mp3');
const startTurnAudio = new Audio('/startTurn.mp3');


var matchInfo;
var myId;
var games = [];
var gamesLeft;
var intervals = [];
var turnNumber = 0;
var turn = 'a';
var turnTimerEnd = Date.now();

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');

function showTimer() {
    let timeLeft = (turnTimerEnd - Date.now()) / 1000;
    if (timeLeft < 0)
        timeLeft = 0;
    document.getElementById('turnTime').innerHTML = timeLeft.toFixed(2);
}

function playMatch(startingMatchInfo, sentId) {
    myId = sentId;
    matchInfo = startingMatchInfo;
    canvas.width = (boxSize * matchInfo.columns) + ((matchInfo.columns + 1) * gridlineSize);
    canvas.height = (boxSize + gridlineSize) * (matchInfo.rows + 1);
    ctx.font = `30px Roboto`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    turnNumber = 0;
    for (let i in startingMatchInfo.games) {
        let game = startingMatchInfo.games[i];
        let state = [];
        for (let y = 0; y < matchInfo.rows; y++) {
            let column = [];
            for (let x = 0; x < matchInfo.columns; x++) {
                column.push(null);
            }
            state.push(column);
        }

        games.push({
            id: i,
            name: (i+1 > gameNameChars.length ? `${gameNameChars[~~(i/gameNameChars.length)]}${gameNameChars[i%gameNameChars.length]}` : gameNameChars[i]),
            playerIDs: game.players,
            players: Object.fromEntries(Object.keys(game.players).map(i => [i, matchInfo.players.find(player => player.id == game.players[i])])),
            state: state,
            order: JSON.parse(JSON.stringify(state)),
        });
    }
    gamesLeft = games.length;
    ReactDOM.render(<ThemeProvider theme={theme}><CssBaseline /><Match matchInfo={matchInfo} players={startingMatchInfo.players} games={games} myId={myId} /></ThemeProvider>, document.getElementById('root'), () => {
        controller.setupController(startingMatchInfo, Object.fromEntries(['a', 'b'].map(c => [c, getImage(games.find(g => myId.startsWith(g.playerIDs[c])), c)])));
        document.getElementById('controller').appendChild(controller.canvas);
        controller.canvas.style.touchAction = 'none';
        document.getElementById('maxGames').innerHTML = gamesLeft;
        document.getElementById('gamesLeft').innerHTML = gamesLeft;
        for (let i in games)
            drawBoardsOfId(i);
        intervals.timer = setInterval(showTimer, 1000/24);
        (new Audio('/startMatch.mp3')).play();
    });
}

function switchTurn(newTurn) {
    document.getElementById('turnNumber').innerHTML = ++turnNumber;
    turn = newTurn;
    turnTimerEnd = Date.now() + matchInfo.turnTime;
    for (let element of [...document.getElementsByClassName(`game-${turn == 'a' ? 'b' : 'a'}`), ...document.getElementsByClassName(`colour-indicator-${turn == 'a' ? 'b' : 'a'}`)])
        element.classList.add('inactive-game');
    for (let element of [...document.getElementsByClassName(`game-${turn}`), ...document.getElementsByClassName(`colour-indicator-${turn}`)])
        element.classList.remove('inactive-game');
    setTimeout(() => {
        for (let element of [...document.getElementsByClassName(`game-${turn == 'a' ? 'b' : 'a'}`), ...document.getElementsByClassName(`colour-indicator-${turn == 'a' ? 'b' : 'a'}`)])
            element.classList.add('inactive-game');
        for (let element of [...document.getElementsByClassName(`game-${turn}`), ...document.getElementsByClassName(`colour-indicator-${turn}`)])
            element.classList.remove('inactive-game');
    }, 50);
    for (let game of games) {
        game.hover = null;
    }
    document.getElementById('turnIndicator').src = `/${turn}.png`;
    controller.turnChange(turn);
    if (turnNumber > 1)
        startTurnAudio.play();
}

function hover(gameId, colour, column) {
    if (colour == turn)
        games[gameId].hover = column;
    drawBoardsOfId(gameId);
}

function move(gameId, colour, column, row) {
    let game = games[gameId];
    game.state[column][row] = colour;
    game.order[column][row] = turnNumber;
    game.hover = null;
    drawBoardsOfId(gameId);
    if (!myId.startsWith(game.players[colour].id))
        otherPlaceAudio.play();
}

function takenTurn(colour) {
    placeAudio.play();
    if (colour == turn) {
        for (let i of document.querySelectorAll(`.self-game.game-${colour}`))
            i.classList.add('inactive-game');
    }
}

function drawCounter(image, column, row) {
    if (image.complete)
        ctx.drawImage(image, ((boxSize+gridlineSize)*Number(column))+gridlineSize, (boxSize+gridlineSize)*(Number(row)+1), boxSize, boxSize);
}

function checkLine(state, r, c, rD, cD) {
    let toCheck = state[r][c];
    if (toCheck === null) return null;
    let checking = [];
    for (let i = 1; i < matchInfo.lineLength; i++)
        checking.push([r + (i * rD), c + (i * cD)]);
    if (checking.every(t => state[t[0]][t[1]] === toCheck))
        return [[r, c], ...checking];
    else
        return null;
}

function getImage(game, colour) {
    let c = game.players[colour].cosmetics[colour];
    return images.counters[colour][c.c][c.s][c.f];
}

const highlightColours = {a: ['f58600', 'ff0010', 'ffd700', 'ff1a96'], b: ['03ffff', '2415ff', '00ff00', '0fff7d']};
function drawBoard(game, overlayImage = null, isDraw = false, showOrder = false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas

    //draw gridlines
    ctx.fillStyle = 'white';
    for (let i = 0; i <= matchInfo.rows; i++)
        ctx.fillRect(0, boxSize+((boxSize+gridlineSize)*i), canvas.width, gridlineSize);
    for (let i = 0; i <= matchInfo.columns; i++)
        ctx.fillRect((boxSize+gridlineSize)*i, boxSize, gridlineSize, canvas.height-boxSize);

    for (let i in game.state)
        for (let j in game.state[i]) {
            let piece = game.state[i][j];
            if (piece != null) {
                drawCounter(getImage(game, piece), j, i);
                if (showOrder) {
                    ctx.fillStyle = 'white';
                    ctx.fillText(String(game.order[i][j]), ((boxSize+gridlineSize)*Number(j))+gridlineSize+(boxSize/2), (boxSize+gridlineSize)*(Number(i)+1)+(boxSize/2)+3);
                }
            }
        }
    
    if (game.hover !== null) {

        drawCounter(getImage(game, turn), game.hover, -1); //draw counter above board

        //draw counter inside board
        let row = null;       
        for (let i = 0; i < matchInfo.rows; i++) {
            if (game.state[i][game.hover] != null) {
                row = i - 1;
                break;
            }
        }
        if (row == -1) //if the top slot was full
            row = false; //skip this turn
        if (row == null) //if all the slots were empty
            row = matchInfo.rows - 1; //use the bottom slot
        if (row !== false) {
            if (images.hover[turn][game.players[turn].cosmetics[turn].c].complete) {
                ctx.globalAlpha = 0.15;
                ctx.drawImage(images.hover[turn][game.players[turn].cosmetics[turn].c], ((boxSize+gridlineSize)*Number(game.hover))+gridlineSize, boxSize+gridlineSize, boxSize, (boxSize+gridlineSize)*(Number(row)+1)-gridlineSize);
            }
            ctx.globalAlpha = 0.5;
            drawCounter(getImage(game, turn), game.hover, row);
            ctx.globalAlpha = 1; //reset alpha
        }
        

    }

    if (!isDraw) {
        let winner;
        let winLocation = [];

        //Check down
        for (let r = 0; r <= matchInfo.rows - matchInfo.lineLength; r++)
            for (let c = 0; c < matchInfo.columns; c++) {
                let tiles = checkLine(game.state, r, c, 1, 0);
                if (tiles != null) {
                    winner = game.state[r][c];
                    winLocation = winLocation.concat(tiles);
                }
            }
    
        //Check right
        for (let r = 0; r < matchInfo.rows; r++)
            for (let c = 0; c <= matchInfo.columns - matchInfo.lineLength; c++) {
                let tiles = checkLine(game.state, r, c, 0, 1);
                if (tiles != null) {
                    winner = game.state[r][c];
                    winLocation = winLocation.concat(tiles);
                }
            }
    
        //Check down-right
        for (let r = 0; r <= matchInfo.rows - matchInfo.lineLength; r++)
            for (let c = 0; c <= matchInfo.columns - matchInfo.lineLength; c++) {
                let tiles = checkLine(game.state, r, c, 1, 1);
                if (tiles != null) {
                    winner = game.state[r][c];
                    winLocation = winLocation.concat(tiles);
                }
            }
    
        //Check down-left
        for (let r = matchInfo.rows - (matchInfo.rows - matchInfo.lineLength + 1); r < matchInfo.rows; r++)
            for (let c = 0; c <= matchInfo.columns - matchInfo.lineLength; c++) {
                let tiles = checkLine(game.state, r, c, -1, 1);
                if (tiles != null) {
                    winner = game.state[r][c];
                    winLocation = winLocation.concat(tiles);
                }
            }
        let squaresDone = [];
        for (let i of winLocation) {
            if (!squaresDone.some(square => JSON.stringify(square) == JSON.stringify(i))) {
                squaresDone.push(i);
                ctx.fillStyle = '#' + highlightColours[winner][game.players[winner].cosmetics[winner].c] + 'af';
                ctx.fillRect(
                    ((boxSize+gridlineSize)*i[1])+gridlineSize,
                    (boxSize+gridlineSize)*(i[0]+1),
                    boxSize, boxSize
                );
            }
        }
        /*ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(((boxSize+gridlineSize)*Number(winLocation[1]))+gridlineSize, (boxSize+gridlineSize)*(Number(winLocation[0])+1));
        ctx.lineTo(((boxSize+gridlineSize)*Number(winLocation[3]))+gridlineSize, (boxSize+gridlineSize)*(Number(winLocation[2])+1));
        ctx.stroke();*/
    }

    if (overlayImage != null && overlayImage.complete) {
        ctx.globalAlpha = 0.75;
        //draw grey "window"
        ctx.fillStyle = '#6060607B';
        ctx.fillRect(gridlineSize, boxSize+gridlineSize, ((boxSize+gridlineSize)*matchInfo.columns)-gridlineSize, ((boxSize+gridlineSize)*matchInfo.rows)-gridlineSize);
        //draw black border
        ctx.fillStyle = 'black';
        ctx.fillRect(0, boxSize, canvas.width, gridlineSize); //top border
        ctx.fillRect(0, canvas.height-gridlineSize, canvas.width, gridlineSize); //bottom border
        ctx.fillRect(0, boxSize+gridlineSize, gridlineSize, canvas.height - boxSize - gridlineSize * 2); //left border
        ctx.fillRect(canvas.width-gridlineSize, boxSize+gridlineSize, gridlineSize, canvas.height - boxSize - gridlineSize * 2); //right border
        //draw icon
        let wrh = overlayImage.width / overlayImage.height;
        let newWidth = canvas.width - (gridlineSize * 2);
        let newHeight = newWidth / wrh;
        if (newHeight > canvas.height) {
            newHeight = canvas.height - (boxSize + (gridlineSize * 2));
            newWidth = newHeight * wrh;
        }
        let xOffset = newWidth < canvas.width ? ((canvas.width - newWidth) / 2) : 0;
        let yOffset = newHeight < canvas.height ? ((canvas.height + boxSize - newHeight) / 2) : 0;

        ctx.drawImage(overlayImage, xOffset, yOffset, newWidth, newHeight);
        //
        //ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
        //reset
        ctx.globalAlpha = 1;
        ctx.setTransform(1,0,0,1,0,0);
    }
    
    return canvas.toDataURL();
}

function drawBoardsOfId(id) {
    let board = drawBoard(games[id]);
    for (let i of document.getElementsByClassName(`game${id}`))
        i.src = board;
}

function outcomeDecided(boardId, outcome) {
    document.getElementById('gamesLeft').innerHTML = --gamesLeft;
    games[boardId].outcome = outcome;

    for (let i of document.getElementsByClassName(`game${boardId}`)) {
        i.classList.add('game-outcome-decided');
        let relativeOutcome;
        let glowColor;
        if (outcome == false) {
            relativeOutcome = 'draw';
            glowColor = 'red';
        } else if (outcome == i.getAttribute('data-playercolour')) {
            relativeOutcome = 'win';
            glowColor = 'green';
        } else {
            relativeOutcome = 'loss';
            glowColor = 'grey';
        }
        i.src = drawBoard(games[boardId], images.outcomeOverlay[relativeOutcome], outcome == false);
    }

    gameEndAudio.play();
}

function endMatch(results, rjCode) {
    for (let i in intervals) {
        clearInterval(intervals[i]);
        delete intervals[i];
    }

    for (let game of games) {
        game.src = drawBoard(game, null, game.outcome == false, true);
    }
    games.sort((a, b) => gameNameChars.indexOf(a.name) - gameNameChars.indexOf(b.name));

    ReactDOM.render(<ThemeProvider theme={theme}><CssBaseline /><Results myId={myId} results={results} matchInfo={matchInfo} games={games} rjCode={rjCode} /></ThemeProvider>, document.getElementById('root'));

    matchInfo = null;
    games = [];
    intervals = [];
}

function turnStatus(player, status) {
    document.getElementById(`playerTurnIndicator-${player}`).setAttribute('fill', status ? 'green' : 'red');
}

export {
    playMatch,
    hover,
    move,
    takenTurn,
    drawBoard,
    switchTurn,
    outcomeDecided,
    endMatch,
    turnStatus,
};