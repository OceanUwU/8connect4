import React from 'react';
import { Typography, Button, Divider, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CodeInput from './CodeInput';
import NameInput from './NameInput';
import socket from '../socket';
import showMatchOptions from './showMatchOptions';
import showDialog from '../Dialog/show';

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
    let showTutorial = async () => {
        let videoId = 'x8DtojIWZC4';
        let dialog = await showDialog({
            layer: 'tutorial',
            title: 'New to 8connect4?',
            description: <span>Watch <Link href={`https://youtu.be/${videoId}`} target="_blank" rel="noopener">this short video</Link> for an explanation of 8connect4.</span>,
            buttonText: 'Don\'t show again',
            buttonAction: () => {
                dialog.handleClose();
                localStorage.tutorialWatched = true
            },
        }, <iframe width="550" height="300" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>)
    };
    React.useEffect(() => {
        if (!localStorage.hasOwnProperty('tutorialWatched'))
            showTutorial();
    }, []);

    return (
        <div>
            <Typography className={classes.title} variant="h3" gutterBottom><img className={classes.logoImage} src="/iconanimated.png" alt="8connect4" /></Typography>

            <Typography variant="body1" gutterBottom>
                Play 8 games of connect 4 at once. <Link onClick={showTutorial}>Watch tutorial</Link>
            </Typography>

            <div className={classes.controls}>
                <NameInput />

                <Divider />
                <br />

                <Button size="large" color="primary" onClick={() => socket.emit('findMatch')}>Find Match</Button>
                <br />
                <Button size="small" color="secondary" onClick={() => showMatchOptions.showMatchOptions(true, false)}>Create Match</Button>

                <br /><br /><br />

                <CodeInput />
            </div>
        </div>
    );
}

export default Home;