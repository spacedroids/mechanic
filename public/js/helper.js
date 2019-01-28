function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getRandomElement(array) {
    return array[getRandomInt(array.length)];
}

//https://stackoverflow.com/questions/8435183/generate-a-weighted-random-number
//Picks a number based on spec of provided weightings
//e.g. weightedRand({0:0.8, 1:0.1, 2:0.1});
function weightedRand(spec) {
    let i, sum=0, r=Math.random();
    for (i in spec) {
        sum += spec[i];
        if (r <= sum) return parseInt(i);
    }
}
