const images = {
    a: new Image(),
    b: new Image(),
    hover: {},
    outcomeOverlay: {}
};

for (let i of ['a', 'b']) {
    let src = `/${i}.png`;
    images[i].src = src;
    images.hover[i] = new Image();
    images.hover[i].src = `/hover_${i}.png`;
}

for (let i of ['win', 'loss', 'draw', 'end']) {
    let img = new Image();
    img.src = `/outcome/${i}.png`;
    images.outcomeOverlay[i] = img;
}

export default images;