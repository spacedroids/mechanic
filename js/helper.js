function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getRandomElement(array) {
    return array[getRandomInt(array.length)];
}