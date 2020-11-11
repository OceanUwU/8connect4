import images from './images';
import socket from '../socket';

const boxSize = 100;
const gridlineSize = 4;
const boardWidth = 7;

var canvas = document.createElement('canvas');
canvas.width = ((gridlineSize + boxSize) * boardWidth) + gridlineSize;
canvas.height = boxSize + (gridlineSize * 2);
var ctx = canvas.getContext('2d');

var slot = null;
var turn = 'a';

function turnChange(newTurn) {
    turn = newTurn;
    slot = null;
    render();
}

function render(event = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas
    ctx.fillStyle = 'black';

    for (let i = 0; i < boardWidth + 1; i++)
        ctx.fillRect((boxSize+gridlineSize)*i, 0, gridlineSize, canvas.height);
    for (let i = 0; i < 2; i++)
        ctx.fillRect(0, (boxSize+gridlineSize)*i, canvas.width, gridlineSize);

    if (event != null) {
        let x = event.layerX - gridlineSize;
        let y = event.layerY - gridlineSize;
        if (x < 0 || y < 0) return;

        if (y >= boxSize) return;
        if (x%(boxSize+gridlineSize) >= boxSize) return;

        let newSlot = Math.floor(event.layerX/(boxSize+gridlineSize));
        if (slot != newSlot) {
            slot = newSlot;
            socket.emit('hover', slot);
        }
    }

    if (slot != null) {
        let image = images[turn];
        if (image.complete)
            ctx.drawImage(image, gridlineSize+((boxSize+gridlineSize)*slot), gridlineSize, boxSize, boxSize);
    }
}

function move() {
    socket.emit('move', turn, slot);
    slot = null;
    socket.emit('hover', slot);
    render();
}

render();
canvas.addEventListener('mousemove', render);
canvas.addEventListener('mousedown', move);

export {
    canvas,
    turnChange,
};