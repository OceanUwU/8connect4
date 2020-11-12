import React from 'react';
import { Typography, Tooltip, IconButton, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';
import PublicIcon from '@material-ui/icons/Public';
import LockIcon from '@material-ui/icons/Lock';
import socket from '../socket';
import d from '../';

const useStyles = makeStyles({
    root: {
        textAlign: 'center',
    },

    privacyIcon: {
        marginRight: 10
    },

    table: {
        width: 400,
        margin: 'auto',
    },

    head: {
        backgroundColor: 'lightgrey',
    },

    tableCell: {
        textAlign: 'center',
    },

    you: {
        color: 'red',
        fontWeight: 'bold',
    },
});

function Lobby(props) {
    const classes = useStyles();

    let tableBody = [];
    for (let i = 0; i < props.matchInfo.maxPlayers; i++) {
        let content = '';
        let you = false
        if (i in props.matchInfo.players) {
            content = props.matchInfo.players[i].name;
            you = socket.id.startsWith(props.matchInfo.players[i].id);
        }
        tableBody.push(
            <TableRow key={i}>
                <TableCell className={classes.tableCell}>
                    {you ? <span className={classes.you}>{content}</span> : content}
                </TableCell>
            </TableRow>
        );
    }

    return (
        <div>
            <IconButton onClick={() => window.location.reload()}>
                <MeetingRoomIcon />
            </IconButton>
            <div className={classes.root}>
                <Typography variant="overline" display="block" gutterBottom>
                    Room code
                </Typography>
                <Typography variant="h3" gutterBottom>
                    <span className={classes.privacyIcon}>
                        {props.matchInfo.public ? <Tooltip title="This is a public match. Anyone can join this match from the 'Find Match' button on the homepage."><PublicIcon /></Tooltip> : <Tooltip title="This is a private match. Only people with the room code can join."><LockIcon /></Tooltip>}
                    </span>
                    {props.matchInfo.code}
                </Typography>

                
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow className={classes.head}>
                                <TableCell className={classes.tableCell}>
                                    Players: {props.matchInfo.players.length}/{props.matchInfo.maxPlayers}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tableBody}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
}

export default Lobby;