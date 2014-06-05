define(function(require) {
    "use strict";

    var _ = require("underscore"),
        Car = require("car"),
        Intersection = require("intersection"),
        Road = require("road"),
        Pool = require("pool"),
        settings = require("settings");

    function World(o) {
        this.set(o);
        this.isRunning = false;
    }

   World.prototype.set = function(o) {
        if (o === undefined) {
            o = {};
        }
        this.intersections= new Pool(Intersection, o.intersections);
        this.roads = new Pool(Road, o.roads);
        this.cars = new Pool(Car, o.cars);
        this.ticks = o.ticks || 0;
        window.__nextId = o.__nextId || 1;
    };

    World.prototype.save = function() {
        var data = {
            intersections: this.intersections,
            roads: this.roads,
            __numOfCars: this.cars.length,
            __nextId: window.__nextId,
        };
        localStorage.world = JSON.stringify(data);
    };

    World.prototype.load = function() {
        var data = localStorage.world;
        data = data && JSON.parse(data);
        if (data) {
            this.clear();
            window.__nextId = data.__nextId || 1;
            _.each(data.intersections, function(intersection) {
                intersection = Intersection.copy(intersection);
                this.addIntersection(intersection);
            }, this);
            _.each(data.roads, function(road) {
                road = Road.copy(road);
                this.addRoad(road);
            }, this);
            for (var i = 0; i < data.__numOfCars; i++) {
                this.addRandomCar();
            }
        }
    };

    World.prototype.clear = function() {
        this.set({});
    };

    World.prototype.onTick = function() {
        this.ticks++;
        _.each(this.intersections.all(), function(intersection) {
            intersection.onTick(this.ticks);
        }, this);
        _.each(this.cars.all(), function(car) {
            car.move();
            if (!car.alive) {
                this.cars.pop(car.id);
            }
        }, this);
    };

    World.prototype.addRoad = function(road) {
        this.roads.put(road);
        road.source.roads.push(road);
        road.update();
    };

    World.prototype.getRoad = function(id) {
        return this.roads.get(id);
    };

    World.prototype.addCar = function(car) {
        this.cars.put(car);
    };

    World.prototype.getCar = function(id) {
        return this.cars.get(id);
    };

    World.prototype.addIntersection = function(intersection) {
        this.intersections.put(intersection);
    };

    World.prototype.getIntersection = function(id) {
        return this.intersections.get(id);
    };

    World.prototype.addRandomCar = function() {
        var road = _.sample(this.roads.all());
        if (road) {
            var lane = _.sample(road.lanes);
            if (lane) {
                this.addCar(new Car(lane));
            }
        }
    };

    World.prototype.removeAllCars = function() {
        // FIXME: actually remove cars
        // this.cars.each(function(index, car) {
            // car.moveToLane(null);
        // });
        this.cars.clear();
    };

    World.prototype.start = function() {
        if (!this._interval) {
            this._interval = setInterval(this.onTick.bind(this), 1000 / settings.fps);
            this.isRunning = true;
        }
    };

    World.prototype.stop = function() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
            this.isRunning = false;
        }
    };

    World.prototype.getInstantSpeed = function() {
        var speeds = _.map(this.cars.all(), function(car) {
            return car.speed;
        });
        if (speeds.length === 0) {
            return 0;
        }
        return _.reduce(speeds, function(a, b) { return a + b; }) / speeds.length;
    };

    return World;
});
