import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import AccountCircle from '@material-ui/icons/AccountCircle';
import socket from '../socket';

const useStyles = makeStyles((theme) => ({
    margin: {
        margin: theme.spacing(1),
    },
    input: {
        width: 250,
    },
    label: {
        textAlign: 'center',
    },
}));

function NameInput() {
    const classes = useStyles();
    const [name, setName] = React.useState(localStorage.name ? localStorage.name : '');
    const changeName = (newName, first = false) => {
        if (!first)
            setName(newName);
        localStorage.name = newName;
        socket.emit('changeName', newName);
    }
    changeName(name, true);

    const handleChange = event => changeName(event.target.value)

    return (
        <div className={classes.margin}>
            <Grid container justify="center" spacing={1} alignItems="flex-end">
                <Grid item>
                    <AccountCircle />
                </Grid>
                <Grid item>
                    <TextField
                        id="nameInput"
                        label="Your name"
                        value={name}
                        onChange={handleChange}
                        inputProps={{
                            className: classes.input,
                            maxLength: 12,
                            onKeyDown: e => {if (e.key == 'Enter') document.activeElement.blur()},
                        }}
                        InputLabelProps={{
                            className: classes.label,
                        }}
                    />
                </Grid>
            </Grid>
        </div>
    );
}

export default NameInput