import React from 'react';
import ReactDOM from 'react-dom';
import socketIOClient from 'socket.io-client';
import serverLocation from './server.json';
import Lobby from '../Lobby';
import * as gameplay from '../Match/gameplay';

var socket = socketIOClient(serverLocation);

socket.on('connect', () => {});

socket.on('disconnect', () => {
    setTimeout(() => {
        alert('Lost connection to the 8connect4 server.');
        window.location.reload();
    }, 200);
});

socket.on('joinMatch', () => {
});

socket.on('matchUpdate', matchInfo => {
    if (!matchInfo.started)
        ReactDOM.render(<Lobby matchInfo={matchInfo} />, document.getElementById('root'));
});

socket.on('matchStart', matchInfo => gameplay.playMatch(matchInfo, socket.id));
socket.on('turnSwitch', newTurn => gameplay.switchTurn(newTurn));
socket.on('hover', (gameId, colour, column) => gameplay.hover(gameId, colour, column));
socket.on('move', (gameId, colour, column, row) => gameplay.move(gameId, colour, column, row));
socket.on('takenTurn', colour => gameplay.takenTurn(colour));
socket.on('outcomeDecided', (gameId, outcome) => gameplay.outcomeDecided(gameId, outcome));
socket.on('endMatch', results => gameplay.endMatch(results));

export default socket;