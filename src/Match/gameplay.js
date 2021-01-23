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
const boardWidth = 7;
const boardHeight = 6;
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
            name: (i+1 > gameNameChars.length ? `${gameNameChars[~~(i/gameNameChars.length)]}${gameNameChars[i%gameNameChars.length]}` : gameNameChars[i]),
            players: game.players,
            state: state,
        });
    }
    gamesLeft = games.length;
    ReactDOM.render(<ThemeProvider theme={theme}><CssBaseline /><Match players={startingMatchInfo.players} games={games} myId={myId} /></ThemeProvider>, document.getElementById('root'), () => {
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
    game.hover = null;
    drawBoardsOfId(gameId);
    if (!myId.startsWith(game.players[colour]))
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

function checkLine(a,b,c,d) {
    // Check first cell non-zero and all cells match
    return ((a !== null) && (a === b) && (a === c) && (a === d));
}

function drawBoard(game, overlayImage = null, isDraw = false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas

    //draw gridlines
    ctx.fillStyle = 'white';
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
            if (images.hover[turn].complete) {
                ctx.globalAlpha = 0.15;
                ctx.drawImage(images.hover[turn], ((boxSize+gridlineSize)*Number(game.hover))+gridlineSize, boxSize+gridlineSize, boxSize, (boxSize+gridlineSize)*(Number(row)+1)-gridlineSize);
            }
            ctx.globalAlpha = 0.5;
            drawCounter(images[turn], game.hover, row);
            ctx.globalAlpha = 1; //reset alpha
        }
        

    }

    if (overlayImage != null && overlayImage.complete) {
        if (!isDraw) {
            let winner;
            let winLocation;

            //Check down
            for (let r = 0; r < 3; r++)
                for (let c = 0; c < 7; c++)
                    if (checkLine(game.state[r][c], game.state[r+1][c], game.state[r+2][c], game.state[r+3][c])) {
                        winner = game.state[r][c];
                        winLocation = [r,c,r+1,c,r+2,c,r+3,c];
                    }
        
            //Check right
            for (let r = 0; r < 6; r++)
                for (let c = 0; c < 4; c++)
                    if (checkLine(game.state[r][c], game.state[r][c+1], game.state[r][c+2], game.state[r][c+3])) {
                        winner = game.state[r][c];
                        winLocation = [r,c,r,c+1,r,c+2,r,c+3];
                    }
        
            //Check down-right
            for (let r = 0; r < 3; r++)
                for (let c = 0; c < 4; c++)
                    if (checkLine(game.state[r][c], game.state[r+1][c+1], game.state[r+2][c+2], game.state[r+3][c+3])) {
                        winner = game.state[r][c];
                        winLocation = [r,c,r+1,c+1,r+2,c+2,r+3,c+3];
                    }
        
            //Check down-left
            for (let r = 3; r < 6; r++)
                for (let c = 0; c < 4; c++)
                    if (checkLine(game.state[r][c], game.state[r-1][c+1], game.state[r-2][c+2], game.state[r-3][c+3])) {
                        winner = game.state[r][c];
                        winLocation = [r,c,r-1,c+1,r-2,c+2,r-3,c+3];
                    }
            
            ctx.fillStyle = {a: '#f58600af', b: '#03ffffaf'}[winner];
            for (let i = 0; i < 4; i++)
                ctx.fillRect(
                    ((boxSize+gridlineSize)*Number(winLocation[i*2+1]))+gridlineSize,
                    (boxSize+gridlineSize)*(Number(winLocation[i*2])+1),
                    boxSize, boxSize
                );
            /*ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(((boxSize+gridlineSize)*Number(winLocation[1]))+gridlineSize, (boxSize+gridlineSize)*(Number(winLocation[0])+1));
            ctx.lineTo(((boxSize+gridlineSize)*Number(winLocation[3]))+gridlineSize, (boxSize+gridlineSize)*(Number(winLocation[2])+1));
            ctx.stroke();*/
        }
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

function endMatch(results) {
    for (let i in intervals) {
        clearInterval(intervals[i]);
        delete intervals[i];
    }

    for (let game of games) {
        game.src = drawBoard(game, images.outcomeOverlay.end, game.outcome == false);
        for (let i in game.players) {
            game.players[i] = matchInfo.players.find(player => player.id == game.players[i]);
        }
    }
    games.sort((a, b) => gameNameChars.indexOf(a.name) - gameNameChars.indexOf(b.name));

    ReactDOM.render(<ThemeProvider theme={theme}><CssBaseline /><Results myId={myId} results={results} games={games} /></ThemeProvider>, document.getElementById('root'));

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