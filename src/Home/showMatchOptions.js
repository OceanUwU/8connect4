import React from 'react';
import { Typography, Divider, FormControl, Select, MenuItem, InputLabel, FormLabel, Slider, Grid, Switch, Button, ButtonGroup, FormControlLabel, Checkbox, RadioGroup, Radio, FormHelperText } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PublicIcon from '@material-ui/icons/Public';
import LockIcon from '@material-ui/icons/Lock';
import showDialog from '../Dialog/show';
import socket from '../socket';
import defaultMatchOptions from './defaultMatchOptions.json';
const allowedPlayers = [1, 25];
const maxGamesAllowed = [1, 4];

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
    },
    select: {
        width: 50,
    },
}));

const timerMarks = [
    5,
    8,
    12,
    15,
    20,
    25,
    30,
    45,
    60,
    120,
    200,
    300,
];
const timerMarksFormat = n => `${timerMarks[n]}s`;

var options = {
    ...defaultMatchOptions,
    ...localStorage.MatchOptions ? JSON.parse(localStorage.MatchOptions) : {}
};

function NumberTweaker(props) {
    return (
        <ButtonGroup size="small">
            <Button onClick={() => props.fn(-10)} disabled={props.disabled || props.state == props.min}>- -</Button>
            <Button onClick={() => props.fn(-1)} disabled={props.disabled || props.state == props.min}>-</Button>
            <Button disabled>{props.state}</Button>
            <Button onClick={() => props.fn(+1)} disabled={props.disabled || props.state == props.max}>+</Button>
            <Button onClick={() => props.fn(+10)} disabled={props.disabled || props.state == props.max}>++</Button>
        </ButtonGroup>
    );
}

function MatchOptions(props) {
    const classes = useStyles();

    const sendUpdate = () => {
        if (props.editable && props.started)
            socket.emit('updateOptions', options);
    }
    const [publicity, setPublicity] = React.useState(options.public);
    const handlePublicityChange = event => {
        options.public = !publicity;
        setPublicity(!publicity);
        sendUpdate();
    };
    const [players, setPlayers] = React.useState(options.players);
    const changePlayers = change => {
        options.players += change;
        if (options.players < allowedPlayers[0]) options.players = allowedPlayers[0];
        if (options.players > allowedPlayers[1]) options.players = allowedPlayers[1];
        setPlayers(options.players);
        sendUpdate();
    };
    const [gameMax, setGameMax] = React.useState(options.gameMax);
    const changeGameMax = change => {
        options.gameMax += change;
        if (options.gameMax < maxGamesAllowed[0]) options.gameMax = maxGamesAllowed[0];
        if (options.gameMax > maxGamesAllowed[1]) options.gameMax = maxGamesAllowed[1];
        setGameMax(options.gameMax);
        sendUpdate();
    };
    const [lineLength, setLineLength] = React.useState(options.lineLength);
    const changeLineLength = (event, value) => {
        value = Number(value);
        options.lineLength = value;
        setLineLength(value);
        if (columns < value)
            changeColumns({target: {value}});
        if (rows < value)
            changeRows({target: {value}});
        sendUpdate();
    };
    const [columns, setColumns] = React.useState(options.columns);
    const changeColumns = event => {
        options.columns = event.target.value;
        setColumns(event.target.value);
        sendUpdate();
    };
    const [rows, setRows] = React.useState(options.rows);
    const changeRows = event => {
        options.rows = event.target.value;
        setRows(event.target.value);
        sendUpdate();
    };
    const [turnTime, setTurnTime] = React.useState(timerMarks.indexOf(options.turnTime));
    const handleTurnTimeChange = (event, value) => {
        options.turnTime = timerMarks[value];
        setTurnTime(value);
        sendUpdate();
    };
    const [runDownTimer, setRunDownTimer] = React.useState(options.runDownTimer);
    const handleRunDownTimerChange = event => {
        options.runDownTimer = !runDownTimer;
        setRunDownTimer(!runDownTimer);
        sendUpdate();
    };
    
    let updateOptions = () => {
        setPublicity(options.public);
        setPlayers(options.players);
        setGameMax(options.gameMax);
        setLineLength(options.lineLength);
        setColumns(options.columns);
        setRows(options.rows);
        setTurnTime(timerMarks.indexOf(options.turnTime));
        setRunDownTimer(options.runDownTimer);
    };
    React.useEffect(() => {
        window.addEventListener('matchOptionsChanged', updateOptions);
        return () => window.removeEventListener('matchOptionsChanged', updateOptions);
    }, []);

    return (
        <div>
            <Divider style={{marginTop: 16}} />

            <FormControl className={classes.formControl}>
                <FormLabel>Privacy</FormLabel>
                <Typography component="div">
                    <Grid component="label" container alignItems="center" spacing={1}>
                        <Grid item><LockIcon /></Grid>
                        <Grid item>
                            <Switch color="primary" checked={publicity} onChange={handlePublicityChange} disabled={!props.editable} />
                        </Grid>
                        <Grid item><PublicIcon /></Grid>
                    </Grid>
                </Typography>
            </FormControl>

            {props.started ? null : <span>
                <Divider />
                
                <FormControl className={classes.formControl}>
                    <FormLabel style={{marginBottom: 5}}>Max players</FormLabel>
                    <NumberTweaker fn={changePlayers} min={allowedPlayers[0]} max={allowedPlayers[1]} state={players} disabled={!props.editable} />
                </FormControl>
            </span>}

            <Divider />

            <FormControl className={classes.formControl}>
                <FormLabel style={{marginBottom: 5}}>Max games per player per colour</FormLabel>
                <NumberTweaker fn={changeGameMax} min={maxGamesAllowed[0]} max={maxGamesAllowed[1]} state={gameMax} disabled={!props.editable} />
            </FormControl>

            <Divider />

            <FormControl className={classes.formControl}>
                <FormLabel>Row length to win</FormLabel>
                <RadioGroup value={lineLength} onChange={changeLineLength} row>
                    {[3, 4, 5, 6].map(n => <FormControlLabel value={n} key={n} control={<Radio color="primary" disabled={!props.editable} />} label={n} />)}
                </RadioGroup>
            </FormControl>

            <Divider />

            <FormControl className={classes.formControl}>
                <FormLabel>Board Size</FormLabel>
            </FormControl>
            <br />
            <FormControl className={classes.formControl}>
                <Select
                    value={columns}
                    onChange={changeColumns}
                    displayEmpty
                    className={classes.select}
                    disabled={!props.editable}
                >
                    {[3, 4, 5, 6, 7, 8, 9, 10].filter(n => n >= lineLength).map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
                <FormHelperText>Columns</FormHelperText>
            </FormControl>
            <span style={{
                position: 'relative',
                top: 10,
                fontSize: 35,
            }}>×</span>
            <FormControl className={classes.formControl}>
                <Select
                    value={rows}
                    onChange={changeRows}
                    displayEmpty
                    className={classes.select}
                    disabled={!props.editable}
                >
                    {[3, 4, 5, 6, 7, 8, 9, 10].filter(n => n >= lineLength).map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
                <FormHelperText>Rows</FormHelperText>
            </FormControl>

            {/*<FormControl className={classes.formControl}>
                <InputLabel>Players</InputLabel>
                <Select value={players} onChange={handlePlayersChange}>
                    {[...Array(allowedPlayersMax+1).keys()].slice(allowedPlayersMin).map(i => <MenuItem value={i}>{i}</MenuItem>)}
                </Select>
            </FormControl>*/}

            <Divider />

            <FormControl className={classes.formControl} style={{minWidth: 300, paddingRight: 10}}>
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
                    disabled={!props.editable}
                />
            </FormControl>
            
            <Divider style={{marginBottom: 8}} />

            <FormControlLabel
                control={<Checkbox color="primary" checked={runDownTimer} onChange={handleRunDownTimerChange} disabled={!props.editable} />}
                label="Always run down turn timer?"
                labelPlacement="start"
            />
        </div>
    );
}

function changeOptions(newOptions) {
    options = newOptions;
    window.dispatchEvent(new Event('matchOptionsChanged'));
}

function hostChanged(amNowHost) {
    if (dialog.state.open && dialog.editable != amNowHost)
        showMatchOptions(amNowHost, true);
}

var dialog = {
    state: {
        open: false,
    }
};

async function showMatchOptions(editable, started) {
    let elem;

    dialog = await showDialog({
        ...(started ? {
            title: 'Match options',
            description: 'Current options (editable by the host):',
        } : {
            title: 'Create Match',
            description: 'Match options:',
            buttonText: 'Create',
            buttonAction: () => {
                dialog.handleClose();
                localStorage.MatchOptions = JSON.stringify(options);
                socket.emit('createMatch', options);
            }
        }),
    }, <MatchOptions editable={editable} started={started} />);
    dialog.editable = editable;
}

export default {
    showMatchOptions,
    changeOptions,
    hostChanged,
};