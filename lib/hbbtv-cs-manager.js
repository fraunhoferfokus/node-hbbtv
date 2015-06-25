/*******************************************************************************
 * 
 * Copyright (c) 2015 Louay Bassbouss, Fraunhofer FOKUS, All rights reserved.
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3.0 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library. If not, see <http://www.gnu.org/licenses/>. 
 * 
 * AUTHORS: Louay Bassbouss (louay.bassbouss@fokus.fraunhofer.de)
 *
 ******************************************************************************/
var dial = require("peer-dial");
var util = require("util");
var events = require("events");
var ws = require("ws");
var WebSocketServer = ws.Server;
var enableCORS = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Application-URL");
    next();
};

var CsLauncher = function (dialDevice, appInfo) {
    var appLaunchURL = dialDevice && dialDevice.applicationUrl && (dialDevice.applicationUrl+"/Famium") || null;
    var osId = appInfo && appInfo.additionalData && appInfo.additionalData.X_FAMIUM_CS_OS_ID || null;
    dialDevice && (dialDevice.osId = osId);
    var getAppLaunchURL = function () {
        return appLaunchURL;
    };

    var getInfo = function () {
        return dialDevice || null;
    };

    var launchCsApp = function (launchData,callback) {
        var launchReq = launchData;
        dialDevice.launchApp("Famium",launchReq, "text/plain", function (launchRes, err) {
            if(typeof launchRes != "undefined"){
                callback && callback(launchRes,err);
            }
            else if(err){
                callback && callback(null,err);
            }
        });
    };

    Object.defineProperty(this,"launchCsApp", {
        get: function(){
            return launchCsApp;
        }
    });

    Object.defineProperty(this,"getInfo", {
        get: function(){
            return getInfo;
        }
    });

    Object.defineProperty(this,"getAppLaunchURL", {
        get: function(){
            return getAppLaunchURL;
        }
    });
};

var HbbTVCSManager = function (/*expressApp*/httpServer) {
    //var prefix = expressApp.get("cs-manager-prefix") || "";
    var csLauncherDialClient = new dial.Client();
    var self = this;
    var wsServer = null;
    var csLaunchers = {};
    var tmpCsLaunchers = {};
    var lastRefresh = 0;
    var discoveryTime = 5000;
    csLauncherDialClient.on("ready",function(){
        self.emit("ready");
    }).on("found",function(deviceDescriptionUrl, headers){
        csLauncherDialClient.getDialDevice(deviceDescriptionUrl, function (dialDevice, err) {
            if(dialDevice){
                dialDevice.getAppInfo("Famium", function (appInfo, err) {
                    if(appInfo){
                        var csLauncher = new CsLauncher(dialDevice, appInfo);
                        csLaunchers[csLauncher.getAppLaunchURL()] = csLauncher;
                        tmpCsLaunchers[csLauncher.getAppLaunchURL()] = dialDevice;
                        //self.emit("found", csLauncher);
                    }
                    else if(err){
                        var error = new Error("Cannot get CS Launcher FAMIUM App Info of DIAL device "+deviceDescriptionUrl+" is not a CS Launcher "+ err.message);
                        self.emit("error", error);
                    }
                });
            }
            else if(err){
                var error = new Error("Error on get device description from "+deviceDescriptionUrl+" "+ err.message);
                self.emit("error", error);
            }
        });
    }).on("disappear", function(deviceDescriptionUrl, headers){
        delete csLaunchers[deviceDescriptionUrl];
        delete tmpCsLaunchers[csLauncher.getAppLaunchURL()];
        //self.emit("disappear",deviceDescriptionUrl, headers);
    }).on("stop", function(){
        self.emit("stop");
    }).on("error", function (err) {
        self.emit("error",err);
    });

    var handleConnectionReceived = function(connection) {
        console.log("receive cs manager ws connection");
        connection.on("message", function(msg, flags) {
            // expect msg as jsonrpc request
            console.log("receive cs manager ws message",JSON.stringify(msg));
            if(typeof msg == "string"){
                try{
                    var req = JSON.parse(msg);
                    var method = req.method;
                    if(method == "discoverCSLaunchers"){
                        discoverCSLaunchers(connection,req);
                        console.log("discover cslaunchers");
                    }
                    else if(method == "discoverTerminals"){
                        console.log("discover terminals");
                    }
                    else if(method == "launchCSApp"){
                        launchCSApp(connection,req);
                    }
                }
                catch(err){
                    self.emit("error",err);
                }
            }
        }).on("close", function(code, reason) {

        });
    };

    var verifyClient = function (info,callback) {
        var req = info.req;
        var url = req.url || "";
        if(url == "/hbbtvcsmanager"){
            callback && callback(true);
        }
        /*else {
            callback && callback(false,400);
        }*/
    };

    var discoverCSLaunchers = function (connection, req) {
        var currentTime = new Date().getTime();
        var timeElapsed = currentTime - lastRefresh;
        var timeout = 0;
        if(timeElapsed > discoveryTime){
            lastRefresh = currentTime;
            tmpCsLaunchers = {};
            csLauncherDialClient.refresh();
            timeout = discoveryTime;
        }
        else {
            timeout = discoveryTime-timeElapsed;
        }
        setTimeout(function(){
            var rsp = {
                "jsonrpc": "2.0",
                "result": tmpCsLaunchers,
                "id": req.id
            };
            connection.send(JSON.stringify(rsp));
        }, timeout);
    };

    var launchCSApp = function (connection, req) {
        console.log("cs launcher found", req);
        var launcherId = req.params[0];
        var payload = req.params[1];
        var csLauncher = csLaunchers[launcherId];
        console.log("cs launchers", csLaunchers);
        var code = null;
        // TODO check payload if it is conform with the HbbTV 2.0 Spec as described in 14.4.2
        if(csLauncher){
            payload = JSON.stringify(payload);
            csLauncher.launchCsApp(payload, function (launchRes, err) {
                console.log("cs app launched");
                if(err){
                    code = 400;
                }
                else {
                    code = 200;
                }
            });
        }
        else {
            code = 404;
        }
        var rsp = {
            "jsonrpc": "2.0",
            "result": code,
            "id": req.id
        };
        connection.send(JSON.stringify(rsp));
    };

    var start = function () {
        csLauncherDialClient.start();
        wsServer = new WebSocketServer({
            server: httpServer,
            verifyClient : verifyClient
        }).on("connection", handleConnectionReceived);
        return this;
    };

    var stop = function () {
        csLauncherDialClient.stop();
        return this;
    };

    Object.defineProperty(this,"start", {
        get: function(){
            return start;
        }
    });

    Object.defineProperty(this,"stop", {
        get: function(){
            return stop;
        }
    });
};

util.inherits(HbbTVCSManager, events.EventEmitter);

module.exports = HbbTVCSManager;