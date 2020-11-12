import React from 'react';
import './centred.css';
import ClearIcon from '@material-ui/icons/Clear';
import Button from '@material-ui/core/Button';

function ConnectFailed(props) {
    return (
        <div className="centred">
            <ClearIcon />
            <h3>Failed to connect to the 8connect4 server.</h3>
            {props.error ? <p>Error: "{props.error}"</p> : null}
            <h4>Are you offline? If not, the 8connect4 server might be down.</h4>
            <Button variant="contained" color="primary" onClick={() => window.location.reload(false)}>Retry</Button>
        </div>
    );
}

export default ConnectFailed;