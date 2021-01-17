import React from 'react';
import { Typography, Divider, FormControl, Select, MenuItem, InputLabel, FormLabel, Slider, Grid, Switch, Button, ButtonGroup, FormControlLabel, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PublicIcon from '@material-ui/icons/Public';
import LockIcon from '@material-ui/icons/Lock';
import showDialog from '../Dialog/show';
import socket from '../socket';
const allowedPlayers = [1, 32];
const maxGamesAllowed = [1, 12];

const useStyles = makeStyles((theme) => ({
    formControl: {
      margin: theme.spacing(1),
      minWidth: 300,
    },
    selectEmpty: {
      marginTop: theme.spacing(2),
    },
}));

const timerMarks = [
    1,
    2,
    3,
    5,
    8,
    12,
    15,
    20,
    30,
    45,
    60,
    120,
];
const timerMarksFormat = n => `${timerMarks[n]}s`;

var options = {
    public: false,
    players: 9,
    gameMax: 4,
    turnTime: 8,
    runDownTimer: true,
    ...localStorage.MatchOptions ? JSON.parse(localStorage.MatchOptions) : {}
};

function NumberTweaker(props) {
    return (
        <ButtonGroup size="small">
            <Button onClick={() => props.fn(-Infinity)}>&lt;&lt;</Button>
            <Button onClick={() => props.fn(-10)}>- -</Button>
            <Button onClick={() => props.fn(-1)}>-</Button>
            <Button disabled>{props.state}</Button>
            <Button onClick={() => props.fn(+1)}>+</Button>
            <Button onClick={() => props.fn(+10)}>++</Button>
            <Button onClick={() => props.fn(+Infinity)}>&gt;&gt;</Button>
        </ButtonGroup>
    );
}

function MatchOptions() {
    const classes = useStyles();

    const [publicity, setPublicity] = React.useState(options.public);
    const handlePublicityChange = event => {
        options.public = !publicity;
        setPublicity(!publicity);
    };
    const [players, setPlayers] = React.useState(options.players);
    const changePlayers = change => {
        options.players += change;
        if (options.players < allowedPlayers[0]) options.players = allowedPlayers[0];
        if (options.players > allowedPlayers[1]) options.players = allowedPlayers[1];
        setPlayers(options.players);
    };
    const [gameMax, setGameMax] = React.useState(options.gameMax);
    const changeGameMax = change => {
        options.gameMax += change;
        if (options.gameMax < maxGamesAllowed[0]) options.gameMax = maxGamesAllowed[0];
        if (options.gameMax > maxGamesAllowed[1]) options.gameMax = maxGamesAllowed[1];
        setGameMax(options.gameMax);
    };
    const [turnTime, setTurnTime] = React.useState(timerMarks.indexOf(options.turnTime));
    const handleTurnTimeChange = (event, value) => {
        options.turnTime = timerMarks[value];
        setTurnTime(value);
    };
    const [runDownTimer, setRunDownTimer] = React.useState(options.runDownTimer);const
    handleRunDownTimerChange = event => {
        options.runDownTimer = !runDownTimer;
        setRunDownTimer(!runDownTimer);
    };

    return (
        <div>
            <Divider style={{marginTop: 16, marginBottom: 8}} />

            <FormLabel>Privacy</FormLabel>
            <Typography component="div">
                <Grid component="label" container alignItems="center" spacing={1}>
                    <Grid item><LockIcon /></Grid>
                    <Grid item>
                        <Switch color="primary" checked={publicity} onChange={handlePublicityChange} />
                    </Grid>
                    <Grid item><PublicIcon /></Grid>
                </Grid>
            </Typography>

            <Divider />
            
            <FormControl className={classes.formControl}>
                <FormLabel style={{marginBottom: 5}}>Max players</FormLabel>
                <NumberTweaker fn={changePlayers} state={players} />
            </FormControl>

            <Divider />

            <FormControl className={classes.formControl}>
                <FormLabel style={{marginBottom: 5}}>Max games per player per colour</FormLabel>
                <NumberTweaker fn={changeGameMax} state={gameMax} />
            </FormControl>

            {/*<FormControl className={classes.formControl}>
                <InputLabel>Players</InputLabel>
                <Select value={players} onChange={handlePlayersChange}>
                    {[...Array(allowedPlayersMax+1).keys()].slice(allowedPlayersMin).map(i => <MenuItem value={i}>{i}</MenuItem>)}
                </Select>
            </FormControl>*/}

            <Divider style={{marginBottom: 8}} />

            <FormLabel>Turn time</FormLabel>
            <Slider
                value={turnTime}
                onChange={handleTurnTimeChange}
                step={null}
                marks={[...timerMarks.keys()].map(n => ({value: n, label: String(timerMarks[n])}))}
                min={0}
                max={timerMarks.length-1}
                getAriaValueText={timerMarksFormat}
                valueLabelFormat={timerMarksFormat}
                valueLabelDisplay="auto"
            />
            
            <Divider style={{marginBottom: 8}} />

            <FormControlLabel
                control={<Checkbox color="primary" checked={runDownTimer} onChange={handleRunDownTimerChange} />}
                label="Always run down turn timer?"
                labelPlacement="start"
            />
        </div>
    );
}
  

async function showMatchOptions() {
    let elem;

    let dialog = await showDialog({
        title: 'Create Match',
        description: 'Match options:',
        buttonText: 'Create',
        buttonAction: () => {
            dialog.handleClose();
            localStorage.MatchOptions = JSON.stringify(options);
            socket.emit('createMatch', options);
        },
    }, <MatchOptions />);
}

export default showMatchOptions;