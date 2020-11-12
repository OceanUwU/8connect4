import React from 'react';
import ReactDOM from 'react-dom';
import Dialog from './';

async function showDialog(props = {}, children = null) {
    return new Promise(async res => {
        props = Object.assign({
            title: 'Dialog title',
            required: false,
        }, props);
    
        let dialog;
        ReactDOM.render((
            <Dialog {...props} ref={element => dialog = element}>
                {children}
            </Dialog>
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