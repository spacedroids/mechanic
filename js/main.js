//Internal vars
let wallet = 0;
let cars = ["carRed2_007.png", "carRed3_007.png", "carRed4_006.png", "carRed5_004.png", "carRed6_006.png"];

let car1Obj = {
    garage: "",
    progress: 0,
    workNeeded: 1,
    value: 100,
    img: "carRed2_007.png",
    element: {},
    reset: function() {
        this.progress = 0;
        this.workNeeded++;
        this.value += 100;
        this.img = getRandomElement(cars);
        car1.style.left = "0px";
        car1.style.top = "0px";
    },
    driveAway: function() {
        this.element = $('#car1');
        let x = -this.element.offset().left - this.element.width();
        let y = this.element.offset().top;
        this.element.animate({left: x + "px", top: y + "px"}, 400, 'swing', this.delete);

        // let left = parseInt( window.getComputedStyle(car1).getPropertyValue("left"));
        // let top = parseInt( window.getComputedStyle(car1).getPropertyValue("top"));
        // car1.style.left = left - 1 + "px";
        // car1.style.top = top + 1 + "px";
        // let offset = parseInt(window.getComputedStyle(garage1).getPropertyValue("left"));
        // if(left < -offset) {
        //     this.garage.empty();
        // }
    },
    delete: function() {
        this.element = $('#car1');
        this.element.remove();
    }
};

let garage1Obj = {
    car: car1Obj,
    status: "empty",
    progressNumerator: $('#garage1 #progress #numerator'),
    progressDenomenator: $('#garage1 #progress #denomenator'),
    update: function() {
        if(this.status === "leaving") {
        }
    },
    redraw: function() {
        this.progressNumerator.text(this.car.progress);
        this.progressDenomenator.text(this.car.workNeeded);
    },
    reset: function() {
        this.status = "repairing";
    },
    fix: function(unit) {
        if(!this.car) {
            return;
        }
        this.car.progress += unit;
        if(this.car.progress >= this.car.workNeeded) {
            wallet += this.car.value;
            this.status = "leaving";
            this.car.driveAway();
        }
    },
    newCar: function(car) {
        car.reset();
        car.garage = this;
        $('#car1').attr('src', 'img/' + car.img);
    },
    empty: function() {
        this.status = "empty";
        this.newCar(car1Obj);
    },
};

//Display elements
let walletEl = $('#wallet');
let garage1El = $('#garage1');

//Helper methods/game logic
let update = function() {
    garage1Obj.update();
}

let redraw = function() {
    walletEl.text(wallet);
    garage1Obj.redraw();
};

let newCustomer = function() {
    garage1Obj.newCar(car1Obj.reset());
};

//Event handlers
$('#car1').click(() => garage1Obj.fix(1));
$('#oil #fill').click(() => { 
    console.log($('#oil #fill').style.height);
});

//setup
garage1Obj.newCar(car1Obj);


window.setInterval(function(){
    update();
    redraw();
}, 1);