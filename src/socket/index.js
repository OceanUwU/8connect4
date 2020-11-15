import React from 'react';
import ReactDOM from 'react-dom';
import theme from '../theme';
import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/core/styles';
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

ReactDOM.render(<ThemeProvider theme={theme}><CssBaseline /><Connecting /></ThemeProvider>, document.getElementById('root'));

socket.on('connect', () => {
    if (!connectedOnce) {
        connectedOnce = true;
        ReactDOM.render(<ThemeProvider theme={theme}><CssBaseline /><Home /></ThemeProvider>, document.getElementById('root'));
    }
});

function displayConnectionFail(error) {
    ReactDOM.render(<ThemeProvider theme={theme}><CssBaseline /><ConnectFailed error={error.toString()} /></ThemeProvider>, document.getElementById('root'));
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
        ReactDOM.render(<ThemeProvider theme={theme}><CssBaseline /><Lobby matchInfo={matchInfo} /></ThemeProvider>, document.getElementById('root'));
});

socket.on('matchStart', matchInfo => gameplay.playMatch(matchInfo, socket.id));
socket.on('turnSwitch', newTurn => gameplay.switchTurn(newTurn));
socket.on('hover', (gameId, colour, column) => gameplay.hover(gameId, colour, column));
socket.on('move', (gameId, colour, column, row) => gameplay.move(gameId, colour, column, row));
socket.on('takenTurn', colour => gameplay.takenTurn(colour));
socket.on('outcomeDecided', (gameId, outcome) => gameplay.outcomeDecided(gameId, outcome));
socket.on('endMatch', results => gameplay.endMatch(results));

export default socket;