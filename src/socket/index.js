import React from 'react';
import ReactDOM from 'react-dom';
import socketIOClient from 'socket.io-client';
import serverLocation from './server.json';
import showDialog from '../Dialog/show';
import Connecting from './Connect/ing';
import ConnectFailed from './Connect/Failed';
import Home from '../Home';
import Lobby from '../Lobby';
import * as gameplay from '../Match/gameplay';

var socket = socketIOClient(serverLocation);
var connectedOnce = false;

ReactDOM.render(<Connecting />, document.getElementById('root'));

socket.on('connect', () => {
    if (!connectedOnce) {
        connectedOnce = true;
        ReactDOM.render(<Home />, document.getElementById('root'));
    }
});

function displayConnectionFail(error) {
    ReactDOM.render(<ConnectFailed error={error.toString()} />, document.getElementById('root'));
    socket.disconnect();
}

socket.on('connect_error', displayConnectionFail);
socket.on('connect_timeout', displayConnectionFail);
socket.on('disconnect', displayConnectionFail);

socket.on('err', (error='Unknown error', title='Error:') => {
    showDialog({
        title: title,
        description: error,
    });
});

/*
socket.on('disconnect', () => {
    setTimeout(() => {
        alert('Lost connection to the 8connect4 server.');
        window.location.reload();
    }, 200);
});
*/

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