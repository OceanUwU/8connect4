import React from 'react';
import { Typography, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import './index.css';

const useStyles = makeStyles({
    gameInfo: {
        display: 'flex',
        width: '100%',
        marginBottom: 20,
        margin: 'auto',
        alignItems: 'center',
        justifyContent: 'space-between',
        '& div': {
            flexGrow: 1,
        },
    },

    gameInfoTitle: {
        textAlign: 'center',
    },

    gameInfoContent: {
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'center',
        /*textAlign: 'center',
        '& *': {
            display: 'inline',
        },*/
    },

    title: {
        textAlign: 'center',
    },

    playerArea: {
        paddingTop: 8,
        paddingBottom: 8,
        marginBottom: 16,
        textAlign: 'center',
        border: '1px solid #0000001f',
        borderRadius: 10,
    },

    selfGameImage: {
        width: 125,
    },

    otherGameImage: {
        width: 100,
    },

    playingGamesContainer: {
    },

    playingGames: {
        display: 'flex',
        width: 600,
        margin: 'auto',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    otherGamesContainer: {
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    otherGames: {
        display: 'flex',
        width: 600,
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    vsMe: {
        color: 'red',
    }
});

function GameImage(props) {
    const classes = useStyles();
    let colour = Object.keys(props.game.players).find(c => props.playerId.startsWith(props.game.players[c]));
    let opponent = props.players.find(player => player.id.startsWith(props.game.players[colour == 'a' ? 'b' : 'a']));// props.players.find(player => player.id.startsWith(Object.values(props.game.players).find(player => !props.playerId.startsWith(player))));

    return (
        <div>
            <img data-playercolour={props.playerColour} className={`${props.self ? 'self-game ' : ''}${props.self ? classes.selfGameImage : classes.otherGameImage} game-${colour} game${props.game.id}`} />
            <Typography variant="caption" display="block">
                Game {props.game.name} vs {props.myId.startsWith(opponent.id) ? <span className={classes.vsMe}>{opponent.name}</span> : opponent.name}
            </Typography>
        </div>
    );
}

function PlayerGames(props) {
    const classes = useStyles();
    let gameRowClass = props.self ? classes.playingGames : classes.otherGames;

    return (
        <div className={classes.playerArea}>
            {
                props.self
                ?
                <div>
                    <Typography variant="h4">{props.player.name}</Typography>
                    <Divider />
                </div>
                :
                <Typography variant="h6" gutterBottom>{props.player.name}</Typography>
            }
            <div className={props.self ? classes.playingGamesContainer : classes.otherGamesContainer}>
                <div className={gameRowClass}>
                    {props.self ? <img src="/a.png" /> : null}
                    {props.games.filter(game => props.player.id.startsWith(game.players.a)).map(game => <GameImage self={props.self} game={game} players={props.players} playerColour={'a'} playerId={props.player.id} myId={props.myId} />)}
                    {props.self ? null : <img src="/a.png" />}
                </div>
                {props.self ? <div id="controller" className={classes.controls} /> : null}
                <div className={gameRowClass}>
                    <img src="/b.png" />
                    {props.games.filter(game => props.player.id.startsWith(game.players.b)).map(game => <GameImage self={props.self} game={game} players={props.players} playerColour={'b'} playerId={props.player.id} myId={props.myId} />)}
                </div>
            </div>
        </div>
    );
}

function Match(props) {
    const classes = useStyles();
    let selfPlayer = props.players.find(player => props.myId.startsWith(player.id));

    return (
        <div>
            <div className={classes.gameInfo}>
                <div>
                    <div className={classes.gameInfoTitle}>
                        <Typography variant="subtitle1">
                            Ongoing games
                        </Typography>
                    </div>
                    <div className={classes.gameInfoContent}>
                        <Typography variant="h3">
                            <span id="gamesLeft">0</span>
                        </Typography>
                        <Typography variant="h5">
                            /<span id="maxGames">0</span>
                        </Typography>
                    </div>
                </div>

                <div>
                    <div className={classes.gameInfoTitle}>
                        <Typography variant="subtitle1">
                            Turn time left
                        </Typography>
                    </div>
                    <div className={classes.gameInfoContent}>
                        <Typography variant="h3">
                            <span id="turnTime">0</span>
                        </Typography>
                    </div>
                </div>

                <div>
                    <div className={classes.gameInfoTitle}>
                        <Typography variant="subtitle1">
                            Turn
                        </Typography>
                    </div>
                    <div className={classes.gameInfoContent}>
                        <Typography variant="h3">
                            <span id="turnNumber">0</span>
                        </Typography>
                    </div>
                </div>
            </div>

            <div>
                <PlayerGames player={selfPlayer} players={props.players} games={props.games} self={true} myId={props.myId} />
                {props.players.filter(player => !props.myId.startsWith(player.id)).map(player => (
                    <PlayerGames player={player} players={props.players} games={props.games} self={false} myId={props.myId} />
                ))}
            </div>
        </div>
    );
}

export default Match;