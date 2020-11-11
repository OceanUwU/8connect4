import React from 'react';
import ReactDOM from 'react-dom';
import Match from './';
import Results from '../Results';
import shuffleString from './shuffleString';
import images from './images';
import * as controller from './controller';

const boxSize = 50;
const gridlineSize = 4;
const boardWidth = 7;
const boardHeight = 6;
const numberOfGames = 36;
const gameNameChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'


var matchInfo;
var myId;
var games = [];
var gamesLeft;
var intervals = [];
var turnNumber = 0;
var turn = 'a';
var turnTimerEnd = Date.now();

var canvas = document.createElement('canvas');
canvas.width = (boxSize * boardWidth) + ((boardWidth + 1) * gridlineSize);
canvas.height = (boxSize + gridlineSize) * (boardHeight + 1);
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
    turnNumber = 0;
    let gameNames = shuffleString(gameNameChars);
    for (let i in startingMatchInfo.games) {
        let game = startingMatchInfo.games[i];
        let state = [];
        for (let y = 0; y < boardHeight; y++) {
            let column = [];
            for (let x = 0; x < boardWidth; x++) {
                column.push(null);
            }
            state.push(column);
        }

        games.push({
            id: i,
            name: gameNames[i],
            players: game.players,
            state: state,
        });
    }
    gamesLeft = games.length;
    ReactDOM.render(<Match players={startingMatchInfo.players} games={games} myId={myId} />, document.getElementById('root'), () => {
        document.getElementById('controller').appendChild(controller.canvas);
        for (let i in games)
            drawBoardsOfId(i);
        intervals.timer = setInterval(showTimer, 1000/24);
    });
}

function switchTurn(newTurn) {
    document.getElementById('turnNumber').innerHTML = ++turnNumber;
    turn = newTurn;
    turnTimerEnd = Date.now() + matchInfo.turnTime;
    for (let element of document.getElementsByClassName(`game-${newTurn == 'a' ? 'b' : 'a'}`))
        element.classList.add('inactive-game');
    for (let element of document.getElementsByClassName(`game-${newTurn}`))
        element.classList.remove('inactive-game');
    for (let game of games) {
        game.hover = null;
    }
    controller.turnChange(newTurn);
}

function hover(gameId, colour, column) {
    if (colour == turn)
        games[gameId].hover = column;
    drawBoardsOfId(gameId);
}

function move(gameId, colour, column, row) {
    let game = games[gameId];
    game.state[column][row] = colour;
    game.hover = null;
    drawBoardsOfId(gameId);
}

function takenTurn(colour) {
    if (colour == turn)
        for (let i of document.querySelectorAll(`.self-game.game-${colour}`))
            i.classList.add('inactive-game');
}

function drawCounter(image, column, row) {
    if (image.complete)
        ctx.drawImage(image, ((boxSize+gridlineSize)*Number(column))+gridlineSize, (boxSize+gridlineSize)*(Number(row)+1), boxSize, boxSize);
}

function drawBoard(game, overlayImage = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas

    //draw gridlines
    ctx.fillStyle = 'black';
    for (let i = 0; i <= boardHeight; i++)
        ctx.fillRect(0, boxSize+((boxSize+gridlineSize)*i), canvas.width, gridlineSize);
    for (let i = 0; i <= boardWidth; i++)
        ctx.fillRect((boxSize+gridlineSize)*i, boxSize, gridlineSize, canvas.height-boxSize);

    for (let i in game.state)
        for (let j in game.state[i]) {
            let piece = game.state[i][j];
            if (piece != null) {
                drawCounter(images[piece], j, i);
            }
        }
    
    if (game.hover !== null) {
        ctx.globalAlpha = 0.5;

        drawCounter(images[turn], game.hover, -1); //draw counter above board

        //draw counter inside board
        let row = null;       
        for (let i = 0; i < boardHeight; i++) {
            if (game.state[i][game.hover] != null) {
                row = i - 1;
                break;
            }
        }
        if (row == -1) //if the top slot was full
            row = false; //skip this turn
        if (row == null) //if all the slots were empty
            row = boardHeight - 1; //use the bottom slot
        if (row !== false) {
            drawCounter(images[turn], game.hover, row);
        }
        

        ctx.globalAlpha = 1; //reset alpha
    }

    if (overlayImage != null) {
        ctx.globalAlpha = 0.75;
        ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);    
        ctx.globalAlpha = 1; //reset alpha
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
        let relativeOutcome, glowColor;
        if (outcome == null) {
            relativeOutcome = 'draw';
            glowColor = 'red';
        } else if (outcome == i.getAttribute('data-playercolour')) {
            relativeOutcome = 'win';
            glowColor = 'green';
        } else {
            relativeOutcome = 'loss';
            glowColor = 'grey';
        }
        i.src = drawBoard(games[boardId], images.outcomeOverlay[relativeOutcome]);
    }
}

function endMatch(results) {
    for (let i in intervals) {
        clearInterval(intervals[i]);
        delete intervals[i];
    }

    for (let game of games) {
        game.src = drawBoard(game);
        for (let i in game.players) {
            game.players[i] = matchInfo.players.find(player => player.id == game.players[i]);
        }
    }
    games.sort((a, b) => gameNameChars.indexOf(a.name) - gameNameChars.indexOf(b.name));

    ReactDOM.render(<Results myId={myId} results={results} games={games} />, document.getElementById('root'));

    matchInfo = null;
    games = [];
    intervals = [];
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
};