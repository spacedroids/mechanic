

//Internal vars
let wallet = 0;
let cars = ["carRed2_007.png", "carRed3_007.png", "carRed4_006.png", "carRed5_004.png", "carRed6_006.png"];
let garage1Obj = {
    status: "repairing",
    move: function() {
        if(this.status === "leaving") {
            garage1.style.left = garage1.style.left - 10 + "px";
            garage1.style.top = garage1.style.top - 10 + "px";
        }
    }
};

//Display elements
let walletEl = $('#wallet');

//Helper methods/game logic
let newCustomer = function() {
    $('#garage1 > img').attr('src', 'img/' + getRandomElement(cars));
};

let update = function() {
    walletEl.text(wallet);
};

let mainClick = function() {
    wallet++;
    update();
};

//Event handlers
$('#garages').on('click', $('button'), mainClick);
$('#newCar').click(newCustomer);
driveaway.onmousedown = function() {
    console.log('yesss');
    garage1Obj.status = "leaving";
}

//Tick
window.setInterval(function(){
    garage1Obj.move();
    update();
}, 100);