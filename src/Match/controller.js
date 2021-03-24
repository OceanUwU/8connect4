import socket from '../socket';

var images;

const boxSize = 100;
const gridlineSize = 4;
var boardWidth = 7;

var canvas = document.createElement('canvas');
canvas.width = ((gridlineSize + boxSize) * boardWidth) + gridlineSize;
canvas.height = boxSize + (gridlineSize * 2);
var ctx = canvas.getContext('2d');

var slot = null;
var turn = 'a';

function setImages(newImages) {
    images = newImages;
}

function turnChange(newTurn) {
    turn = newTurn;
    slot = null;
    render();
}

function setupController(matchInfo, newImages) {
    images = newImages;
    boardWidth = matchInfo.columns;
    canvas.width = ((gridlineSize + boxSize) * boardWidth) + gridlineSize;
}

function render(event = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas
    ctx.fillStyle = 'white';

    for (let i = 0; i < boardWidth + 1; i++)
        ctx.fillRect((boxSize+gridlineSize)*i, 0, gridlineSize, canvas.height);
    for (let i = 0; i < 2; i++)
        ctx.fillRect(0, (boxSize+gridlineSize)*i, canvas.width, gridlineSize);

    if (event != null) {
        if (event.type.startsWith('touch'))
            event = event.changedTouches[0];
        let bbox = event.target.getBoundingClientRect();
        let x = (event.clientX - bbox.left - gridlineSize) * (canvas.width / bbox.width);
        let y = (event.clientY - bbox.top - gridlineSize) * (canvas.height / bbox.height);
        if (x < 0 || y < 0) return;

        if (y >= boxSize) return;
        if (x%(boxSize+gridlineSize) >= boxSize) return;

        let newSlot = Math.floor(x/(boxSize+gridlineSize));
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
canvas.addEventListener('touchstart', render);
canvas.addEventListener('touchmove', render);
canvas.addEventListener('touchend', move);
canvas.addEventListener('mousedown', move);

export {
    canvas,
    setImages,
    setupController,
    turnChange,
};