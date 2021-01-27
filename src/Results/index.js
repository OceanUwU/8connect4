import React from 'react';
import { Typography, Tooltip, IconButton, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Button, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import HomeIcon from '@material-ui/icons/Home';
import socket from '../socket/';
//import { gameNameChars } from '../Match/gameplay';

const useStyles = makeStyles({
    root: {
        textAlign: 'center',
    },

    tableCell: {
        textAlign: 'center',
    },

    gamesContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        '& div': {
            marginLeft: 25,
            marginRight: 25,
        },
    },

    gameImage: {
        width: 150,
    },

    counterImage: {
        height: 10,
    },

    you: {
        color: 'red',
    },

    otherPlayer: {
    },
});

function Results(props) {
    const classes = useStyles();

    let playerClass = player => {
        return props.myId.startsWith(player.id) ? classes.you : classes.otherPlayer;
    }

    let winnersStop = 0;
    for (let i = 1; i < props.results.length; i++) {
        if (props.results[i].score == props.results[0].score)
            winnersStop = i;
        else
            break;
    }

    (new Audio('/endMatch.mp3')).play();

    return (
        <div>
            <div className={classes.root}>
                <IconButton onClick={() => window.location.reload()}>
                    <HomeIcon />
                </IconButton>

                <Typography variant="h2">
                    Winner{winnersStop == 0 ? '' : 's'}:
                </Typography>
                <Typography variant="h4" gutterBottom>
                    {props.results.slice(0, winnersStop+1).map(player => player.name).join(', ')}
                </Typography>

                <TableContainer component={Paper}>
                    <Table>
                        <TableBody>
                            {props.results.map(player => (
                                <TableRow>
                                    <TableCell className={classes.tableCell}>
                                        {player.placement}. {props.myId.startsWith(player.id) ? <span className={classes.you}>{player.name}</span> : player.name} with a score of {player.score}.
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Button color="primary" size="large" style={{margin: '16px 0'}} onClick={() => socket.emit('rejoin', props.rjCode, props.matchInfo.options)}>Play again</Button>

                <Divider/>

                <Typography variant="h3">
                    Games
                </Typography>
                <div className={classes.gamesContainer}>
                    {props.games.map(game => (
                        <div>
                            <img src={game.src} className={classes.gameImage} />
                            <Typography variant="caption" display="block">
                                Game {game.name}
                                <br />
                                <span className={playerClass(game.players.a)}>{game.players.a.name}</span> <img className={classes.counterImage} src="/a.png" /> vs <img className={classes.counterImage} src="/b.png" /> <span className={playerClass(game.players.b)}>{game.players.b.name}</span>
                                {/*<br />
                                {game.outcome == false ? 'Draw' : <span>Winner: <img className={classes.counterImage} src={`/${game.outcome}.png`} /></span>}*/}
                            </Typography>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Results;