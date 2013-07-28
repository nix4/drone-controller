var nodeUtil = require("util"),
    events = require("events");

var DroneController = (function(){

    events.EventEmitter.call(this);
    var self = this;

    var arDrone = require('ar-drone');
    var client  = arDrone.createClient({});

    var started = false;

    this.control = {
        start:function(callback){
            client.config('general:navdata_demo', 'FALSE');
            //Register client events:landed, hovering, flying, landing, batteryChange, and altitudeChange
            var simpleEvents = ["landed", "hovering", "flying", "landing", "batteryChange"];
            simpleEvents.forEach(function(ev, index, list){
                client.on(ev, function(){
                    console.log(ev);
                    self.emit("Drone.Status.Changed", ev);
                });
            });
            //client.on('navdata', console.log);
            started = true;
            if(callback &&  callback instanceof Function)
                callback("Drone Started");
        },
        takeoff: function(callback){
            console.log("Take-off requested");
            client.takeoff(function(){
                console.log("Drone is hovering..");
                self.emit("Drone.Status", {Message: "Drone took-off"});
                    if(callback &&  callback instanceof Function)
                        callback("Drone took off");
            });
        },
        land: function(callback){
            console.log("Landing requested");
            client.land(function(){
                console.log("Drone is landing..");
                self.emit("Drone.Status", {Message: "Drone landing"});
                if(callback &&  callback instanceof Function)
                callback();
            });
        },
        stop: function(callback){
            console.log("Stopping drone");
            client.stop();
            if(callback &&  callback instanceof Function)
            callback();
        },
        turn: {
            left: function(speed, callback){
                march(speed,  "turn", "left");
                if(callback &&  callback instanceof Function)
                callback("Finished Left Turn");
            },
            right: function(speed, callback){
                march(speed, "turn", "right");
                if(callback &&  callback instanceof Function)
                callback("Finished Right Turn");
            },
            clockwise: function(speed, callback){
                march(speed, "move", "clockwise");
                if(callback &&  callback instanceof Function)
                callback("Finished Moving clockwise");
            },
            counterClockwise: function(speed, callback){
                march(speed, "move", "counterClockwise");
                if(callback &&  callback instanceof Function)
                callback("Finished Moving counterClockwise");
            }
        },
        movement: {
            up: function(speed, callback){
                march(speed, "move", "up");
                if(callback &&  callback instanceof Function)
                    callback("Finished Moving Up");
            },
            down : function(speed, callback){
                march(speed, "move", "down");
                if(callback &&  callback instanceof Function)
                callback("Finished Moving Down");

            },
            front : function(speed, callback){
                march(speed, "move", "front");
                if(callback &&  callback instanceof Function)
                callback("Finished Moving Front");
            },
            back: function(speed, callback){
                march(speed, "move", "back");
                if(callback &&  callback instanceof Function)
                callback("Finished Moving Back");
            }
        }
    }


    this.feature = {
        getNavigationData : function(callback){
            client.config('general:navdata_demo', 'FALSE');
            if(callback &&  callback instanceof Function)
                callback("Started configuring navigation data");
        },
        calibrate : function(callback){
            client.calibrate(0);
            if(callback &&  callback instanceof Function)
                callback("Calibrating drone with value 0");
        },
        streamImages : function(useExpress, callback){
            var pngStream = client.getPngStream();

            var lastPng;
            pngStream
                .on('error', console.log)
                .on('data', function(pngBuffer) {
                    lastPng = pngBuffer;
                });
            if(callback &&  callback instanceof Function)
                callback("Started image stream on port 3000");
        },
        streamVideo : function(useExpress, callback){
            var server = undefined;
            if(useExpress){
                server = createExpressServer();
            }
            else{
                server = createBasicServer();
            }

            var drone = require("node-dronestream");
            drone.listen(server);
            server.listen(5555);
            if(callback &&  callback instanceof Function)
                callback("Started video stream on port 3000");
        }
    }

    this.sequential = {
        turnAndMove : function(options){
            var allOrNothing = options.strict;
            var turnDir = options.turnDirection;
            var turnSpeed = options.turnSpeed;
            var moveDir = options.moveDirection;
            var turnSpeed = options.moveSpeed;

        }
    }
    function march(speed, type, direction){
    if(speed < 0 || speed > 1){
        console.log("Drone is landing..");
        self.emit("Drone.Turn.Warning", {Message: "Drone not turned left"});
    }else{
        console.log("Drone turned left..");
        if(direction === "left")
            client.left(speed);
        else if(direction === "right")
            client.right(speed);
        else if(direction === "up")
            client.up(speed);
        else if(direction === "down")
            client.down(speed);
        else if(direction === "front")
            client.front(speed);
        else if(direction === "back")
            client.back(speed);
        else if(direction === "clockwise")
            client.clockwise(speed);
        else if(direction === "counterClockwise")
            client.counterClockwise(speed);
        else {
            return;
        }
        self.emit("Drone.Status", {Message: "Drone " + type, Turn: speed, Direction: direction});
    }
}

    function createExpressServer() {
        var express = require('express')
            , routes = require('./routes')
            , app = express()
            , path = require('path')
            , server = require("http").createServer(app);

        app.use('/public', express.static('public'));

        app.configure(function () {
            app.set('views', __dirname + '/views');
            app.set('view engine', 'jade', { pretty: true });
            app.use(express.favicon());
            app.use(express.logger('dev'));
            app.use(app.router);
            app.use(express.static(path.join(__dirname, 'public')));
        });

        app.configure('development', function () {
            app.use(express.errorHandler());
            app.locals.pretty = true;
        });

        app.get('/', routes.index);
        return server;
    }

    function createBasicServer() {
        var http = require("http"),
            uri = require("uri");

        var server = http.createServer(function (req, res) {
            /*console.log("Received request for::");
            var rez = uri.parse(req.uri);
            console.log(rez);*/

            require("fs").createReadStream(__dirname + "/index.html").pipe(res);
        });
        return server;
    }

});

nodeUtil.inherits(DroneController, events.EventEmitter);
var controllerInstance = new DroneController();
controllerInstance.control.start(function(msg){
    console.log(msg);
});
module.exports = controllerInstance;

/*controllerInstance.on("Drone.Status.Changed", function(status){
    if(status === "flying"){
        controllerInstance.feature.streamVideo();
    }
});*/
/*
controllerInstance.start();
controllerInstance.feature.streamVideo(true);*/
