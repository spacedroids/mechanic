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
    update() {}
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
        this.$el = $('<img>').addClass('car').attr('id',uniqueId()).attr('src','img/'+this.img);
    }
    //Animate driving this car away
    driveAway() {
        this.$el.css('position', 'absolute');
        let left = this.$el.offset().left;
        this.$el.css('left', left);
        let x = -this.$el.offset().left - this.$el.width();
        let y = this.$el.offset().left;
        this.$el.animate({left: x, top: y*2}, 1200, 'swing', () => { this.delete() });
    }
    //Return the HTML element that should represent this car
    get html() {
        console.log(this);
        return this.$el;
    }
    delete() {
        this.$el.remove();
    }
}

class Supply {
    constructor(max, cost, wallet, amount) {
        this.amount = amount;
        this.max = max;
        this.cost = cost;
        this.wallet = wallet;
    }
    buy(units=1) {
        console.log("you bought something");
    }
    add() {}
    update() {}
    redraw() {}
    checkMax() {
        return this.amount >= this.max;
    }
}

class verticalSupply extends Supply {
    constructor($parent, max, cost, wallet, amount=0) {
        super(max, cost, wallet, amount);
        this.$el = $(`
        <div>
        <div class="progress progress-bar-vertical">
            <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="height: 0%; background-color: black"></div>
        </div>
        <div>Oil</div>
        </div>`);
        $parent.append(this.$el);
        this.$el.click(() => {
            if(this.checkMax()) {
                return;
            }
            this.buy(10);
        });
    }
    buy(units=1) {
        /* Check cost and deduct money */
        if(this.wallet.withdraw(this.cost * units)) {
            /* Adjust oil level of variable & progress bar UI */
            this.amount += units;
            this.setProgressBar(this.amount);
        }
    }
    setProgressBar(newValue) {
        this.$el.find('.progress-bar').css("height", `${newValue}%`);
    };    
    
}

class Garage {
    constructor($parent, wallet) {
        this.$el = $(`<div class="garage" id="garage1">
        <div>
           <span class="numerator">0</span>
           <span class="divider">/</span>
           <span class="denominator">10</span>
        </div>
     </div>`);
        $parent.append(this.$el);
        this.car = null;
        this.wallet = wallet;
        this.status = "empty";
    }
    update() {
        if(this.status === "leaving") {
        }
        else if(this.status === "empty") {
            this.newCar(new Car(getRandomInt(3)+1, 100));
            this.status = "repairing";
        }
    }
    redraw() {
        if(this.car) {
            this.$el.find('.numerator').text(this.car.progress);
            this.$el.find('.denominator').text(this.car.workNeeded);
        }
    }
    newCar(car) {
        this.car = car;
        car.garage = this;
        this.$el.prepend(car.$el);
        car.$el.click(() => this.fix(1));
    }
    fix(unit) {
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
    }
    empty() {
        this.status = "empty";
    }
}

//Helper methods/game logic
let update = function(objects) {
    objects.forEach(function(obj) {
        obj.update();
    })
}

let redraw = function(objects) {
    objects.forEach(function(obj) {
        obj.redraw();
    })
};

//Document ready and main execution
$(function() {
    let gameObjects = [];
    let wallet = new Wallet($('#header'));
    let garage1 = new Garage($('#garages'), wallet);
    let oilSupply = new verticalSupply($('#supplies'), 100, 1, wallet);
    gameObjects.push(wallet);
    gameObjects.push(garage1);
    gameObjects.push(oilSupply);

    //Game loop
    window.setInterval(function(){
        update(gameObjects);
        redraw(gameObjects);
    }, 1);
});