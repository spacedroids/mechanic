'use strict';

//Internal vars
const cars = ["carRed2_007.png", "carRed3_007.png", "carRed4_006.png", "carRed5_004.png", "carRed6_006.png"];

let _idcounter = 0;
window.uniqueId = function(){
    return 'myid-' + _idcounter++
}

class Wallet {
    constructor($parent, funds=0) {
        this.funds = funds;
        this.$el = $(`<p id="wallet">${funds}</p>`);
        $parent.append(this.$el);
        this.redraw();
    }
    withdraw(cost) {
        if(this.funds >= cost) {
            this.funds = this.funds - cost;
            return true;
        } else {
            return false;
        }
    }
    deposit(amount) {
        this.funds += amount;
    }
    getBalance() {
        return this.funds;
    }
    redraw() {
        this.$el.text(this.funds);
    }
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

class Supply {
    constructor(max, cost, wallet) {
        this.amount = 0;
        this.max = max;
        this.cost = cost;
        this.wallet = wallet;
    }
    buy() {
        
    }
    add() {}
}

let garage1Obj = {
    el$: $('#garage1'),
    car: null,
    wallet: null,
    status: "empty",
    progressNumerator: $('#garage1 #progress #numerator'),
    progressDenomenator: $('#garage1 #progress #denomenator'),
    update: function() {
        if(this.status === "leaving") {
        }
        else if(this.status === "empty") {
            this.newCar(new Car(getRandomInt(3)+1, 100));
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
            this.wallet.deposit(this.car.value);
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

//Helper methods/game logic
let update = function() {
    garage1Obj.update();
}

let redraw = function(objects) {
    objects.forEach(function(obj) {
        obj.redraw();
    })
};

let setProgressBar = function($progressBar, newValue) {
    $progressBar.css("height", `${newValue}%`);
};

let oilLevel = 0;
//Event handlers
$('#oil').click(function() { 
    const oilCost = 10;
    /* Check cost and deduct money */
    if(wallet >= oilCost) {
        wallet -= oilCost;
    } else {return;}
    /* Adjust oil level of variable & progress bar UI */
    //Loading bar for oil. Use .set() to set to value up to 100
    oilLevel = Math.min(oilLevel + 10, 100);
    let currentOil = oilLevel;//$('#oil .ldbar-label').text(); //this updates over many frames
    console.log(this);
    console.log(parseInt(currentOil));
    setProgressBar($(this).find('.progress-bar'), parseInt(currentOil)+10);
});

//Document ready and main execution
$(function() {
    let gameObjects = [];
    let wallet = new Wallet($('#header'));
    gameObjects.push(wallet);
    garage1Obj.wallet = wallet;
    gameObjects.push(garage1Obj);

    //Game loop
    window.setInterval(function(){
        update();
        redraw(gameObjects);
    }, 1);
});