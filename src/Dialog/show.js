import React from 'react';
import ReactDOM from 'react-dom';
import theme from '../theme';
import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/core/styles';
import Dialog from './';

async function showDialog(props = {}, children = null) {
    return new Promise(async res => {
        props = Object.assign({
            title: 'Dialog title',
            required: false,
        }, props);
    
        let dialog;
        ReactDOM.render((
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Dialog {...props} ref={element => dialog = element}>
                    {children}
                </Dialog>
            </ThemeProvider>
        ), document.getElementById('dialog'));
        
        if (!dialog) //if it didnt work,
            setTimeout(async () => res(await showDialog(props, children)), 100); //try it again with a delay (yes i know i shouldnt but shut up it works)
        else {
            dialog.handleOpen();
            res(dialog);
        }
    });
}

export default showDialog;