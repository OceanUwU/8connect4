import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import MUIDialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

const useStyles = theme => ({
    text: {
        margin: 0,
    },
});

class Dialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    handleOpen() {
        this.setState({open: true});
    };

    handleClose() {
        this.setState({open: false});
    };

    render() {
        const { classes } = this.props;

        return (
            <div>
                <MUIDialog
                    open={this.state.open}
                    onClose={this.handleClose}
                    disablePortal
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    disableBackdropClick={this.props.required}
                    disableEscapeKeyDown={this.props.required}
                >
                    <DialogTitle id="alert-dialog-title">{this.props.title}</DialogTitle>
                    <DialogContent dividers>
                        <DialogContentText className={classes.text} id="alert-dialog-description">
                            {this.props.description}
                        </DialogContentText>
                        {this.props.children}
                    </DialogContent>
                    <DialogActions>
                        {this.props.required ? null : (
                            <Button onClick={this.handleClose} color="primary">
                                Close
                            </Button>
                        )}
                        {this.props.buttonText ? (
                            <Button onClick={this.props.buttonAction} color="primary">
                                {this.props.buttonText}
                            </Button>
                        ) : null}
                    </DialogActions>
                </MUIDialog>
            </div>
        );
    }
}

export default withStyles(useStyles)(Dialog);