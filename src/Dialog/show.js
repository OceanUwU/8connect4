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
        let id = `dialog${props.layer ? props.layer : 0}`;
        let element = document.getElementById(id);
        if (element == null) {
            element = document.createElement('div');
            element.id = id;
            document.getElementById('dialog').appendChild(element);
        }
        ReactDOM.render((
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Dialog {...props} ref={element => dialog = element}>
                    {children}
                </Dialog>
            </ThemeProvider>
        ), element);
        
        if (!dialog) //if it didnt work,
            setTimeout(async () => res(await showDialog(props, children)), 100); //try it again with a delay (yes i know i shouldnt but shut up it works)
        else {
            dialog.handleOpen();
            res(dialog);
        }
    });
}

export default showDialog;