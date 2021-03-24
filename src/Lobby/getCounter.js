import availableCounters from './availableCounters.json';

export default function getCounter(c, cosmetics) {
    let imgName = `${c}${'x'.repeat(availableCounters.length)}`;
    for (let i of availableCounters)
        imgName = imgName.slice(0, i.char) + cosmetics[c][i.key] + imgName.slice(i.char+1);
    return imgName;
}