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
const CAR_SPRITES = ["carRed2_007.png", "carRed3_007.png", "carRed4_006.png", "carRed5_004.png", "carRed6_006.png", "carSilver6_007.png", "carSilver5_010.png", "carSilver4_007.png", "carSilver3_007.png", "carSilver2_008.png", "carSilver1_007.png", "carGreen6_010.png", "carGreen5_009.png", "carGreen4_010.png", "carGreen3_007.png", "carGreen2_007.png", "carGreen1_007.png", "carBlue6_010.png", "carBlue5_007.png", "carBlue4_010.png", "carBlue3_010.png", "carBlue2_009.png", "carBlue1_007.png", "carBlack6_007.png", "carBlack5_007.png", "carBlack4_008.png", "carBlack3_007.png", "carBlack2_008.png", "carBlack1_006.png", "police_SW.png", "taxi_SW.png"];
const LABEL_OIL = "Oil";
const LABEL_ENGINE = "Engine";
/* Game Tuning Variables */
//Click Speed Related
const MECHANIC_BASE_SPEED = 0.006;
//Economy
const OIL_COST = 10;
const ENGINE_COST = 1000;
const PROFIT_MARGIN = 0.1;
const BASE_SHOP_RATE = 100;
const MECHANIC_HIRE_COST = 1000;

//Abstract class so that all game objects can be guaranteed to have a common updated, redrawn interface
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

//Manages the user's funds and operations to deposit, withdraw, etc
class Wallet extends GameObject {
    constructor($parent, funds=0, saveData) {
        super();
        this.funds = funds;
        this.$el = $('#wallet');
        this.$body = this.$el.find('.card-body')
        this.loadSaveData(saveData);
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
        gc.checkScore(this.funds);
    }
    getBalance() {
        return this.funds;
    }
    redraw() {
        this.$body.text('$' + this.funds);
    }
}

class QueueManager extends GameObject {
    constructor() {
        super();
        this.$el = $('#jobQueue');
        this.jobs = [];
        for(let i=0; i<3; i++) {
            let job = new QueuedCar(this.$el);
            job.populate(carGenerator(gc.progress));
            this.jobs.push(job);
        }
    }
    update() {
        // let numJobs = $('#jobQueue .job').length;
        if(gc.gameobjects.garages[0].status === 'empty') {
            $('#jobQueue .btn-success').attr("disabled", false);
        } else {
            $('#jobQueue .btn-success').attr("disabled", true);
        }
        this.jobs.forEach(function (job) {
            if(job.state === QUEUEDCAR_STATE_EMPTY) {
                job.populate(carGenerator(gc.progress));
            }
        })
    }
}

const QUEUEDCAR_STATE_EMPTY = "e";
const QUEUEDCAR_STATE_HASCAR = "c";
//Represents a queued available job that will flow into the garages for work
class QueuedCar {
    constructor($parent) {
        this.state = QUEUEDCAR_STATE_EMPTY;
        this.$el = $(`
        <div class="col job">
            <div class="value row justify-content-center"></div>
            <div class="sprite-container row justify-content-center no-gutters">
                <div class="col car-slot col-md-auto"></div>
            </div>
            <div class="row">
                <div class="supply-needs centered-col">nothing</div>
            </div>
            <div class="row justify-content-center">
                <button type="button" class="btn btn-success m-1">Take Job</button><button type="button" class="btn btn-danger m-1">Get Lost</button>
            </div>
        </div>`);
        $parent.append(this.$el);
        this.car = {};
        this.$el.find('.btn-success').click(() => {
            gc.gameobjects.garages[0].newCar(this.car);
            this.state = QUEUEDCAR_STATE_EMPTY;
        });
    }
    populate(car) {
        this.car = car;
        this.$el.find('.car-slot').append(car.$el);
        this.$el.find('.value').text('$' + car.value);
        if(this.car.suppliesNeeded.length !== 0) { //If there are any supplies needed
            this.$el.find('.supply-needs').text(this.car.suppliesNeeded[0].label + ' ' + this.car.suppliesNeeded[0].quantity);
            this.$el.find('.supply-needs').show();
        } else {
            this.$el.find('.supply-needs').hide();
        }
        this.state = QUEUEDCAR_STATE_HASCAR;
    }

}

//The car object, responsible for value of the job and supplies needed to complete it and the avatar of the car
class Car {
    constructor(workNeeded, value, supplies=[]) {
        this.progress = 0;
        this.workNeeded = workNeeded;
        this.suppliesNeeded = supplies;
        this.value = value;
        this.img = getRandomElement(CAR_SPRITES);
        this.$el = $(`<img class="car" src="img/${this.img}">`);
    }
    //Animate driving this car away
    driveAway() {
        //Record the car's current position relative to the whole window
        let left = this.$el.offset().left;
        let top = this.$el.offset().top;
        //To make animation work, have to detach from current box and move this to the 'body'
        this.$el.detach();
        $('body').append(this.$el);
        //Set position absolute so it can move freely
        this.$el.css('position', 'absolute');
        //Place it back right where it was a moment ago
        this.$el.css('left', left);
        this.$el.css('top', top);
        let x = -this.$el.position().left - this.$el.width();
        let y = this.$el.position().left;
        this.$el.animate({left: x, top: y*2}, 1200, 'swing', () => { this.delete() });
    }
    delete() {
        this.$el.remove();
    }
}

//Abstract class to handle supply objects that can hold a limited number of items for use, and can be refilled by purchasing more
class Supply extends GameObject {
    constructor(max, cost, amount, saveData) {
        super();
        this.amount = amount;
        this.max = max;
        this.cost = cost;
    }
    //Buy more units and add them to this supply
    buy(units=1) {
        //Check how many can fit
        units = Math.min(units, this.canFit());
        if(units === 0) {
            return false;
        }
        //Check cost and deduct money
        if(gc.gameobjects.wallet.withdraw(this.cost * units)) {
            //Add purchased units to the supply
            this.amount += units;
        } else {
            return false;
        }
        return true;
    }
    add() {}
    //Remove units from this supply
    take(units=1) {
        if(this.amount >= units) {
            this.amount -= units;
            return true;
        }
        return false;
    }
    //Check if this supply is full
    isFull() {
        return this.amount >= this.max;
    }
    //Return how many more can fit
    canFit() {
        return this.max - this.amount;
    }
}

//Supply items that should be rendered with a vertical progress bar
class VerticalSupply extends Supply {
    constructor($parent, max, cost, label, color, amount=0, saveData=0) {
        super(max, cost, amount);
        this.$el = $(`
        <div class="col" style="text-align: left;">
            <div class="progress progress-bar-vertical supply-stack">
                <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="height: 0%; background-color: ${color}"></div>
            </div>
            <button type="button" class="btn btn-primary">${label} $${cost}</button>
        </div>`);
        $parent.append(this.$el);
        this.$el.click(() => {
            if(this.isFull()) {
                return;
            }
            this.buy(5);
        });
    }
    redraw() {
        this.$el.find('.progress-bar').css("height", `${(this.amount / this.max) * 100}%`);
    }
}

//Manages the button that will let users hire Mechanics from the Upgrade shop
class MechanicUpgrade extends Supply {
    constructor($parent, max, cost, amount=0, saveData=0) {
        super(max, cost, amount);
        this.$el = $(`<button type="button" class="btn btn-primary">Hire Mechanic $${cost}</button>`);
        this.cost = cost;
        $parent.append(this.$el);
        this.$el.click(() => { this.buy(); });
    }
    buy() {
        if(super.buy()) {
            //Look for the first available garage mechanic empty slot
            let $emptySlot = $('.garage .mechanic-slot.empty-slot').first();
            //and remove the class that indicates the slot is empty
            $emptySlot.removeClass('empty-slot');
            //and put the new mechanic there
            let bob = new Mechanic($emptySlot);
            gc.gameobjects.mechanics.push(bob);
        }
    }
    update() {
        if(!$('.garage .mechanic-slot.empty-slot').length) {
            this.$el.hide();
        }
    }
}

//Mechanic sprites in various poses
const MECHANIC_IDLE_RIGHT_SPRITE = "img/mechanics/1-idle-se.png";
const MECHANIC_IDLE_LEFT_SPRITE = "img/mechanics/1-idle-sw.png";
const MECHANIC_KNEELING_LEFT_SPRITE = "img/mechanics/1-kneel-nw.png";
const MECHANIC_KNEELING_RIGHT_SPRITE = "img/mechanics/1-kneel-ne.png";
class Mechanic extends GameObject{
    constructor($parent) {
        super();
        //Determines how fast the mechanic will "auto-click" on the car
        this.speed = MECHANIC_BASE_SPEED;
        this.counter = 0;
        this.$el = $(`<div class="mechanic"><img class="mechanic-sprite text-right" src="${MECHANIC_IDLE_LEFT_SPRITE}"/></div>`);
        $parent.append(this.$el);
        if(this.$el.parent().hasClass('face-left')) {
            this.kneeling_pose_img = MECHANIC_KNEELING_LEFT_SPRITE;
            this.standing_pose_img = MECHANIC_IDLE_LEFT_SPRITE;
        } else if(this.$el.parent().hasClass('face-right')) {
            this.kneeling_pose_img = MECHANIC_KNEELING_RIGHT_SPRITE;
            this.standing_pose_img = MECHANIC_IDLE_RIGHT_SPRITE;
        }
        this.idle();
    }
    update() {
        //Keep a local counter to track the number of updates that pass so we can throttle the "auto-clicking"
        //to occur only after a certain number of update ticks
        this.counter++;
        if(this.counter * this.speed >= 1) {
            this.counter = 0;
            gc.gameobjects.garages[0].fix(1) ? this.working() : this.idle();
        }
    }
    idle() {
        this.$el.find('img').attr('src', this.standing_pose_img);
    }
    working() {
        this.$el.find('img').attr('src', this.kneeling_pose_img);
    }
}

//Not used, but keep for future considerations
const emptyGarageButton = `<button type="button" class="empty-button btn btn-dark centered-col" disabled style="display: none;">Empty Garage</button>`;

//The garage container is responsible for displaying the car being fixed, metadata about the repair in progress
//and any mechanics or other upgrades that should be shown around the car in progress
class Garage {
    constructor($parent) {
        this.$el = $(`
        <div class="garage container">
            <div class="value row justify-content-center"></div>
            <div class="sprite-container row justify-content-center no-gutters">
                <div class="col mechanic-slot empty-slot col-lg-1 face-right"></div>
                <div class="col car-slot col-md-auto"></div> 
                <div class="col mechanic-slot empty-slot col-lg-1 face-left"></div>
            </div>
            <div class="row">
                <button type="button" class="fix-button btn btn-primary centered-col">Repaired
                    <span class="numerator">0</span>
                    <span class="divider">/</span>
                    <span class="denominator">10</span>
                </button>
            </div>
            <div class="row"><div class="supply-needs centered-col">nothing</div></div>
        </div>`);
        $parent.append(this.$el);
        this.empty();
        this.$el.find('.fix-button').click(() => this.fix(1));
    }
    update() {
        if(this.status === "leaving") {
        }
        else if(this.status === "empty") {
            this.newCar(carGenerator(gc.progress));
            this.status = "repairing";
        }
    }
    redraw() {
        if(this.car) {
            this.$el.find('.numerator').text(this.car.progress);
            this.$el.find('.denominator').text(this.car.workNeeded);
            if(this.car.suppliesNeeded.length !== 0) { //If there are any additional supplies needed
                this.$el.find('.supply-needs').text(this.car.suppliesNeeded[0].label + ' ' + this.car.suppliesNeeded[0].quantity);
                this.$el.find('.supply-needs').show();
            } else {
                this.$el.find('.supply-needs').hide();
            }
        }
    }
    newCar(car) {
        this.car = car;
        car.garage = this;
        this.$el.find('.car-slot').append(car.$el);
        this.$el.find('.value').text('$' + car.value);
        this.status = "reparing";
    }
    fix(unit) {
        if(!this.car) {
            return false;
        }
        if(this.car.suppliesNeeded.length !== 0) {
            if(!this.car.suppliesNeeded[0].supply.take(1)) {
                triggerShake(this.car.suppliesNeeded[0].supply.$el);
                return false; //that supply is empty
            }
            this.car.suppliesNeeded[0].quantity -= 1;
            if(this.car.suppliesNeeded[0].quantity === 0) {
                this.car.suppliesNeeded.shift();
            }
            return true;
        } else {
            this.car.progress += unit;
        }
        if(this.car.progress >= this.car.workNeeded) {
            gc.gameobjects.wallet.deposit(this.car.value);
            gc.tallyCar();
            this.status = "leaving";
            this.car.driveAway();
            this.empty();
        }
        return true;
    }
    empty() {
        this.$el.find()
        this.car = null;
        this.$el.find('.value').text('');
        this.status = "empty";
    }
}

//This manages creating new cars (essentially new repair jobs) and their difficulty (i.e. how many clicks, what supplies are required)
//Takes the current user "level" as input so that it can scale up more difficult jobs as the user progresses
let carGenerator = function(level=1) {
    let selection;
    //Use the level to determine weightings on a few different possible selections of car jobs to be generated
    switch(level) {
        case 1:
            selection = 0;
            break;
        case 2:
        case 3:
            selection = weightedRand({0:0.8, 1:0.2});
            break;
        case 4:
            selection = weightedRand({0:0.75, 1:0.2, 2:0.05});
            break;
    }

    //Given the selection, generate the JSON representing the config of the job and return it
    switch(selection) {
        case 0: return new Car(getRandomInt(3)+1, BASE_SHOP_RATE);
        case 1:
            return new Car(3, BASE_SHOP_RATE + OIL_COST * 2,
            [
                {
                    label: LABEL_OIL,
                    quantity: 2,
                    supply: gc.gameobjects.oilSupply,
                },
            ]);
        case 2:
            return new Car(6, BASE_SHOP_RATE * 3 + OIL_COST * 5 + ENGINE_COST,
            [
                {
                    label: LABEL_ENGINE,
                    quantity: 1,
                    supply: gc.gameobjects.engineSupply,
                },
                {
                    label: LABEL_OIL,
                    quantity: 5,
                    supply: gc.gameobjects.oilSupply,
                },
            ]);
        default: return new Car(getRandomInt(3)+1, BASE_SHOP_RATE);
    }
};

//The update method takes a list of GameObjects and loops through all of them, calling their update method on each one
//The objects list passed in contains both single objects and arrays of objects
const update = function(objects) {
    for (let key in objects) {
        let object = objects[key];
        if(Array.isArray(object)) {
            //If it's an array of objects, loop through and update each one
            object.forEach(function (element) {
                element.update();
            })
        } else {
            //Otherwise just update that one object
            object.update();
        }
    }
}

//The redraw method takes a list of GameObjects and loops through all of them, calling their redraw method on each one
//The objects list passed in contains both single objects and arrays of objects
const redraw = function(objects) {
    for (let key in objects) {
        let object = objects[key];
        if(Array.isArray(object)) {
            //If it's an array of objects, loop through and update each one
            object.forEach(function (element) {
                element.redraw();
            })
        } else {
            //Otherwise just update that one object
            object.redraw();
        }
    }
}

//Responsible for orchestration of the overall game. A global object so that various game objects can access each other when necessary
//This should be a singleton (but I haven't implemented with any proper singleton enforcement)
class GameController {
    constructor() {
        this.gameobjects = {
            "garages": [],
            "mechanics": [],
        };
    }
    loadGame(saveFile={}) {
        this.progress = 1;
        this.carsFixed = 0;
        this.resetDom();
        let wallet = new Wallet($('#header'), 0, saveFile.wallet ? saveFile.wallet : 0);
        let oilSupply = new VerticalSupply($('#supplies'), 10, OIL_COST, LABEL_OIL, "black", 5, saveFile.oilSupply ? saveFile.oilSupply : 0);
        let engineSupply = new VerticalSupply($('#supplies'), 1, ENGINE_COST, LABEL_ENGINE, "grey", 1, saveFile.engineSupply ? saveFile.engineSupply : 0);
        engineSupply.$el.addClass('level-4');
        engineSupply.$el.hide();
        //Add the game objects to the list of objects
        this.gameobjects.wallet = wallet;
        this.gameobjects.garages.push(new Garage($('#garages')));
        this.gameobjects.oilSupply = oilSupply;
        this.gameobjects.engineSupply = engineSupply;
        this.gameobjects.mechanicHire = new MechanicUpgrade($('#upgradeShop'), 2, MECHANIC_HIRE_COST);
        // this.gameobjects.queueManager = new QueueManager();
    }
    resetDom() {
        $('.game-state div').remove();
    }
    //The player has leveled up
    levelUp(minLevel) {
        if(this.progress >= minLevel) {
            return; //If already at that level, ignore
        }
        this.progress = minLevel;
        switch(this.progress) {
            case 4:
                $('.level-4').show();
            case 3:
                $('.level-3').show();
            case 2:
                $('.level-2').show();
        }
    }
    //Pass in the current funds, this checks if the user is qualifying for a levelup
    checkScore(funds) {
        let easy = {2:299, 3:999, 4:2000};
        let debug = {2:1, 3:1, 4:1};
        let levelReqs = easy;
        let lvl;
        for(lvl in levelReqs) {
            if(funds > levelReqs[lvl]) {
                this.levelUp(parseInt(lvl))
            }
        }
    }
    tallyCar() {
        this.carsFixed++;
        $('#highScore .output-value').text(this.carsFixed);
    }
}

//Strip out a few unnecessary properties and then return a copy of the object that can be stored
const serialize = function(object) {
    //First make a copy because we need to remove a few children before we pack it up to send for saving
    let copy = $.extend({}, object);
    //Delete the jquery ref to the DOM, don't want to be part of save
    delete copy.$el;
    delete copy.$body;
    return copy;
}

//Pass in the critical game objects and generate a save file for storage in the cloud
const createSaveFile = function(wallet, oilSupply) {
    return {
        "wallet": serialize(wallet),
        "oilSupply": serialize(oilSupply),
    }
}

//Create the gloabl game controller object
let gc = new GameController();

//Document ready and main execution
$(function() {
    $('.save-game').click(function() {
        let userSaveBucket = userSavesDB.ref('test_user2');
        userSaveBucket.set(createSaveFile(gc.gameobjects.wallet, gc.gameobjects.oilSupply, gc.gameobjects.engineSupply));
    });
    $('.load-game').click(function() {
        let userSaveBucket = userSavesDB.ref('test_user2');
        userSavesDB.ref('test_user2').once('value').then(function(saveFile) {
            gc = new GameController();
            gc.loadGame(saveFile.val());
        });
    });

    //Initialize the global game controller and instantiate the various game objects for gameplay
    gc.loadGame();
    //CHEAT CODE
    // gc.gameobjects.wallet.deposit(999999);

    //Game loop
    window.setInterval(function(){
        update(gc.gameobjects);
        redraw(gc.gameobjects);
    }, 12);
});