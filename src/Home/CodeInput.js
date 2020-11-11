import React from 'react';
import socket from '../socket/';
import clsx from 'clsx';
import { withStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import FilledInput from '@material-ui/core/FilledInput';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

const useStyles = theme => ({
    margin: {
        margin: theme.spacing(1),
        marginBottom: 0,
    },
    joinLabel: {
        display: 'inline-block',
        marginTop: 22,
        marginRight: 4,
    },
    textField: {
        width: '18ch',
    },
    textInput: {
        textTransform: 'uppercase',
    },
});

class CodeInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            code: '',
        };
        this.changeInput = this.changeInput.bind(this);
        this.tryCode = this.tryCode.bind(this);
    }

    changeInput(event) {
        let code = event.target.value; //get the code entered from the input element
        code = code.replace(' ', ''); //remove spaces, if any
        this.setState({code}); //store the code in the state, so that it can be shown on the input element and accessed when the join button is clicked
    }

    tryCode() {
        socket.emit('joinMatch', this.state.code);
    }

    render() {
        const { classes } = this.props;

        return (
            <div>
                <label {...{}/*className={classes.joinLabel}*/} htmlFor="roomCodeInput">Or, join by code:</label>
                <br />

                <FormControl className={clsx(classes.margin, classes.textField)} variant="filled">
                    <InputLabel htmlFor="roomCodeInput">Room code</InputLabel>
                    <FilledInput
                        id="roomCodeInput"
                        type="text"
                        value={this.state.code}
                        onChange={this.changeInput}
                        inputProps={{
                            className: classes.textInput,
                            maxLength: 6,
                            onKeyDown: e => {if (e.key == 'Enter') this.tryCode()},
                        }}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="Join"
                                    onClick={this.tryCode}
                                    edge="end"
                                >
                                    <ArrowForwardIcon />
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                </FormControl>
            </div>
        );
    }
}

export default withStyles(useStyles)(CodeInput);