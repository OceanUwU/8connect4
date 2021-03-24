import React from 'react';
import { Typography } from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import availableCounters from './availableCounters.json';
import socket from '../socket';
import getCounter from './getCounter';

const emptySelection = {};
for (let i of ['a', 'b']) {
    emptySelection[i] = {
        s: 0, //shape
        c: 0, //colour
        f: 0, //filled
    }
}

function Cosmetics() {
    const [selection, setSelection] = React.useState(localStorage.hasOwnProperty('cosmetics') ? JSON.parse(localStorage.cosmetics) : JSON.parse(JSON.stringify(emptySelection)));
    let select = (a, p, s) => {
        let newSelection = JSON.parse(JSON.stringify(selection));
        newSelection[a][p] = s;
        setSelection(newSelection);
        socket.emit('cosmetics', newSelection);
        localStorage.cosmetics = JSON.stringify(newSelection);
    };

    return (
        <div>
            {['a', 'b'].map(c => {
                let imgName = getCounter(c, selection);
                
                return <div>
                    <hr />
                    {availableCounters.map(a => <div>
                        <ToggleButtonGroup value={[selection[c][a.key]]}>{a.available.map(choice => <ToggleButton style={{padding: 2}} onClick={() => select(c, a.key, choice)} value={choice}>
                            <img width={30} src={`/counters/${imgName.slice(0, a.char) + choice + imgName.slice(a.char+1)}.png`} />
                        </ToggleButton>)}</ToggleButtonGroup>
                    </div>)}
                </div>;
            })}
        </div>
    );
}

export default Cosmetics;