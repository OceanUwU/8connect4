import React from 'react';
import { Typography, Button, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CodeInput from './CodeInput';
import NameInput from './NameInput';
import socket from '../socket';
import showMatchOptions from './showMatchOptions';

const useStyles = makeStyles({
    logoImage: {
        display: 'block',
        textAlign: 'center',
        margin: 'auto',
        maxWidth: 350,
    },

    controls: {
        textAlign: 'center',
        border: '1px solid #ffffff1f',
        borderRadius: 10,
    },
});

function Home() {
    const classes = useStyles();

    return (
        <div>
            <Typography className={classes.title} variant="h3" gutterBottom><img className={classes.logoImage} src="/iconanimated2.png" alt="8connect4" /></Typography>

            <Typography variant="body1" gutterBottom>
                Play 8 games of connect 4 at once.
            </Typography>

            <div className={classes.controls}>
                <NameInput />

                <Divider />
                <br />

                <Button size="large" color="primary" onClick={() => socket.emit('findMatch')}>Find Match</Button>
                <br />
                <Button size="small" color="secondary" onClick={showMatchOptions}>Create Match</Button>

                <br /><br /><br />

                <CodeInput />
            </div>
        </div>
    );
}

export default Home;