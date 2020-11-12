import React from 'react';
import './centred.css';
import CircularProgress from '@material-ui/core/CircularProgress';

function Connecting() {
    return (
        <div className="centred">
            <CircularProgress />
            <h3>Attempting to connect to the 8connect4 server...</h3>
        </div>
    );
}

export default Connecting;