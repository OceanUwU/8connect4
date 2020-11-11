const images = {
    a: new Image(),
    b: new Image(),
    outcomeOverlay: {}
};

for (let i of ['a', 'b']) {
    let src = `/${i}.png`;
    images[i].src = src;
}

for (let i of ['win', 'loss', 'draw']) {
    let img = new Image();
    img.src = `/outcome/${i}.png`;
    images.outcomeOverlay[i] = img;
}

export default images;