import availableCounters from '../Lobby/availableCounters.json';

const images = {
    counters: {},
    a: new Image(),
    b: new Image(),
    hover: {},
    outcomeOverlay: {}
};

for (let i of ['a', 'b']) {
    images.hover[i] = [];
    for (let j of availableCounters.find(a => a.key == 'c').available) {
        let src = `/${i}.png`;
        images.hover[i].push(new Image());
        images.hover[i][images.hover[i].length - 1].src = `/hover_${i}${j}.png`;
    }
    images.counters[i] = [];
    for (let j of availableCounters[0].available) {
        let jA = []
        for (let k of availableCounters[1].available) {
            let kA = []
            for (let l of availableCounters[2].available) {
                let img = new Image();
                img.src = `/counters/${i}${k}${j}${l}.png`;
                kA.push(img);
            }
            jA.push(kA)
        }
        images.counters[i].push(jA);
    }
}

for (let i of ['win', 'loss', 'draw', 'end']) {
    let img = new Image();
    img.src = `/outcome/${i}.png`;
    images.outcomeOverlay[i] = img;
}

export default images;