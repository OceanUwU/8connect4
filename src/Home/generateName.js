const adjectives = [
    'Crazy',
    'Insane',
    'Mental',
];
const nouns = [
    'Goon',
    'Gamer'
];

function generateName() {
    return `${adjectives[Math.floor(Math.random()*adjectives.length)]}${nouns[Math.floor(Math.random()*nouns.length)]}`;
}

export default generateName;