//Internal vars
let wallet = 0;
const cars = ["carRed2_007.png", "carRed3_007.png", "carRed4_006.png", "carRed5_004.png", "carRed6_006.png"];

let _idcounter = 0;
window.uniqueId = function(){
    return 'myid-' + _idcounter++
}

class Car {
    constructor(workNeeded, value) {
        this.progress = 0;
        this.workNeeded = workNeeded;
        this.value = value;
        this.img = getRandomElement(cars);
        this.id = uniqueId();
        this.el$ = $('<img>').addClass('car').attr('id',uniqueId()).attr('src','img/'+this.img);
    }
    //Animate driving this car away
    driveAway() {
        this.el$.css('position', 'absolute');
        let left = this.el$.offset().left;
        this.el$.css('left', left);
        let x = -this.el$.offset().left - this.el$.width();
        let y = this.el$.offset().left;
        this.el$.animate({left: x, top: y*2}, 1200, 'swing', () => { this.delete() });
    }
    //Return the HTML element that should represent this car
    get html() {
        console.log(this);
        return this.el$;
    }
    delete() {
        this.el$.remove();
    }
}

let garage1Obj = {
    el$: $('#garage1'),
    car: null,
    status: "empty",
    progressNumerator: $('#garage1 #progress #numerator'),
    progressDenomenator: $('#garage1 #progress #denomenator'),
    update: function() {
        if(this.status === "leaving") {
        }
        else if(this.status === "empty") {
            this.newCar(new Car(2, 100));
            this.status = "repairing";
        }
    },
    redraw: function() {
        if(this.car) {
            this.progressNumerator.text(this.car.progress);
            this.progressDenomenator.text(this.car.workNeeded);    
        }
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
            this.status = "empty";
        }
    },
    newCar: function(car) {
        this.car = car;
        car.garage = this;
        this.el$.prepend(car.el$);
        car.el$.click(() => garage1Obj.fix(1));
    },
    empty: function() {
        this.status = "empty";
    },
};

//Display elements
let walletEl = $('#wallet');

//Helper methods/game logic
let update = function() {
    garage1Obj.update();
}

let redraw = function() {
    walletEl.text(wallet);
    garage1Obj.redraw();
};

//Event handlers
$('#oil #fill').click(() => { 
    console.log($('#oil #fill').style.height);
});

//Game loop
window.setInterval(function(){
    update();
    redraw();
}, 1);