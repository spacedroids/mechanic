'use strict';

// Initialize Firebase
const config = {
    apiKey: "AIzaSyCFs2JP217VB5o7PzKhxqZDv1B7XmU02tg",
    authDomain: "mechanic-clicker.firebaseapp.com",
    databaseURL: "https://mechanic-clicker.firebaseio.com",
    projectId: "mechanic-clicker",
    storageBucket: "mechanic-clicker.appspot.com",
    messagingSenderId: "610150464775"
};
firebase.initializeApp(config);
let userSavesDB = firebase.database();

//Internal vars
const cars = ["carRed2_007.png", "carRed3_007.png", "carRed4_006.png", "carRed5_004.png", "carRed6_006.png"];

let _idcounter = 0;
window.uniqueId = function(){
    return 'myid-' + _idcounter++
}
class GameObject {
    constructor() {}
    loadSaveData(saveData) {
        if(saveData) {
            Object.assign(this, saveData);
        }
    }
    attach($parent) {
        if($parent) {
            $parent.append(this.$el);
        }
    }
    update() {}
    redraw() {}
}

class Wallet extends GameObject {
    constructor($parent, funds=0, saveData) {
        super();
        this.funds = funds;
        this.$el = $(`<p id="wallet">${funds}</p>`);
        this.loadSaveData(saveData);
        this.attach($parent);
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
    constructor(workNeeded, value, supplies={}) {
        this.progress = 0;
        this.workNeeded = workNeeded;
        this.suppliesNeeded = supplies;
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

class Supply extends GameObject {
    constructor(max, cost, amount, saveData) {
        super();
        this.amount = amount;
        this.max = max;
        this.cost = cost;
    }
    buy(units=1) {
        console.log("you bought something");
    }
    add() {}
    take() {}
    checkMax() {
        return this.amount >= this.max;
    }
}

class VerticalSupply extends Supply {
    constructor($parent, max, cost, amount=0, saveData=0) {
        super(max, cost, amount);
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
            this.buy(5);
        });
    }
    buy(units=1) {
        /* Check cost and deduct money */
        if(gc.wallet.withdraw(this.cost * units)) {
            /* Adjust oil level of variable & progress bar UI */
            this.amount += units;
        }
    }
    take(units=1) {
        if(this.amount >= units) {
            this.amount -= units;
            return true;
        }
        return false;
    }
    redraw() {
        this.$el.find('.progress-bar').css("height", `${(this.amount / this.max) * 100}%`);
    }
}

class MechanicUpgrade {
    constructor($parent, wallet, cost) {
        this.$el = $('<div>Hire</div>');
        this.wallet = wallet;
        this.cost = cost;
        $parent.append(this.$el);
        this.$el.click(() => { this.hire(); });
    }
    hire() {
        if(this.wallet.withdraw(this.cost)) {
            let bob = new Mechanic($('#upgrades'), gc.wallet);
            gc.mechanics.push(bob);
            gc.gameObjects.push(bob);
        } else {
            return;
        }
    }
}

class Mechanic {
    constructor($parent, wallet) {
        this.$el = $('<div>Bob</div>');
        this.wallet = wallet;
        $parent.append(this.$el);
    }
    update() {
        gc.garages[0].fix(1);
    }
    redraw() {}
}

class Garage {
    constructor($parent, wallet, oilSupply) {
        this.$el = $(`<div class="garage" id="garage1">
        <div>
           <span class="numerator">0</span>
           <span class="divider">/</span>
           <span class="denominator">10</span>
        </div>
        <div class="supply-needs">nothing</div>
     </div>`);
        $parent.append(this.$el);
        this.car = null;
        this.wallet = wallet;
        this.status = "empty";
        this.oilSupply = oilSupply;
    }
    update() {
        if(this.status === "leaving") {
        }
        else if(this.status === "empty") {
            this.newCar(carGenerator());
            this.status = "repairing";
        }
    }
    redraw() {
        if(this.car) {
            this.$el.find('.numerator').text(this.car.progress);
            this.$el.find('.denominator').text(this.car.workNeeded);
            if(this.car.suppliesNeeded.oil) {
                this.$el.find('.supply-needs').text(this.car.suppliesNeeded.oil + "Oil");
                this.$el.find('.supply-needs').show();
            } else {
                this.$el.find('.supply-needs').hide();
            }
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
        if(this.car.suppliesNeeded.oil) {
            if(!this.oilSupply.take(1)) {
                return; //not enough oil
            }
            this.car.suppliesNeeded.oil -= 1;
            if(this.car.suppliesNeeded.oil === 0) {
                delete this.car.suppliesNeeded.oil;
            }
        } else {
            this.car.progress += unit;
        }
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

let carGenerator = function() {
    if(getRandomInt(3) === 0) {
        return new Car(3, 200, {"oil": 2});
    }
    return new Car(getRandomInt(3)+1, 100);
};

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

class GameController {
    constructor() {
        this.wallet = {};
        this.garages = [];
        this.mechanics = [];
        this.oilSupply = {};
        this.gameObjects = [];
    }
    loadGame(saveFile={}) {
        this.resetDom();
        let wallet = new Wallet($('#header'), 0, saveFile.wallet ? saveFile.wallet : 0);
        let oilSupply = new VerticalSupply($('#supplies'), 10, 10, 5, saveFile.oilSupply ? saveFile.oilSupply : 0);
        let garage1 = new Garage($('#garages'), wallet, oilSupply);
        let mechanicUpgrades = new MechanicUpgrade($('#upgradeShop'), wallet, 1);
        this.gameObjects.push(wallet);
        this.wallet = wallet;
        this.oilSupply = oilSupply;
        this.gameObjects.push(garage1);
        this.garages.push(garage1);
        this.gameObjects.push(oilSupply);
    }
    resetDom() {
        $('.game-state').empty();
    }
}

const serialize = function(object) {
    //First make a copy because we need to remove a few children before we pack it up to send for saving
    let copy = $.extend({}, object);
    //Delete the jquery ref to the DOM, don't want to be part of save
    delete copy.$el;
    return copy;
}

const createSaveFile = function(wallet, oilSupply) {
    return {
        "wallet": serialize(wallet),
        "oilSupply": serialize(oilSupply),
    }
}

let gc = new GameController();

//Document ready and main execution
$(function() {
    $('.save-game').click(function() {
        let userSaveBucket = userSavesDB.ref('test_user2');
        userSaveBucket.set(createSaveFile(gc.wallet, gc.oilSupply));
    });
    $('.load-game').click(function() {
        let userSaveBucket = userSavesDB.ref('test_user2');
        userSavesDB.ref('test_user2').once('value').then(function(saveFile) {
            gc = new GameController();
            gc.loadGame(saveFile.val());
        });
    });

    gc.loadGame();

    //Game loop
    window.setInterval(function(){
        update(gc.gameObjects);
        redraw(gc.gameObjects);
    }, 1);
});