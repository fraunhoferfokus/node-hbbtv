/*******************************************************************************
 * 
 * Copyright (c) 2013 Louay Bassbouss, Fraunhofer FOKUS, All rights reserved.
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
var opn = require("opn");

var HbbTVDialServer = function (expressApp, isCsLauncher) {
    var self = this;
    var MANUFACTURER = "Fraunhofer FOKUS";
    var MODEL_NAME = "HbbTV 2.0 Node.js Companion Screen Feature Emulator";
    var port = expressApp.get("port") || 80;
    var prefix = expressApp.get("dial-prefix") || "";
    isCsLauncher = (isCsLauncher == true);
    var apps = {
        "YouTube": {
            disabled: isCsLauncher,
            name: "YouTube",
            state: "stopped",
            allowStop: true,
            pid: null
        },
        "HbbTV": {
            disabled: isCsLauncher,
            name: "HbbTV",
            state: "running",
            allowStop: false,
            additionalData: {
                "hbbtv:X_HbbTV_App2AppURL":"",
                "hbbtv:X_HbbTV_InterDevSyncURL": "",
                "hbbtv:X_HbbTV_UserAgent": ""
            },
            namespaces: {
                "hbbtv": "urn:hbbtv:HbbTVCompanionScreen:2014"
            }
        },
        "Famium": {
            disabled: !isCsLauncher,
            name: "Famium",
            state: "running",
            allowStop: false
        }
    };

    var openUrl = function (url) {
        try{
            opn(url);
        }
        catch(err){
            console.error("Error on open URL", err.message);
        }
    };

    var launchApp = function (app, launchData) {
        if(app.name == "YouTube"){
            app.pid = "run";
            app.state = "starting";
            openUrl("http://www.youtube.com/tv?"+launchData);
            app.state = "running";
        }
        else if(app.name == "HbbTV"){
            // TODO parse xml launch data according to HbbTV Spec

            openUrl(launchData);
            app.state = "running";
        }
        else if(app.name == "Famium"){
            openUrl(launchData);
            app.state = "running";
        }
    };

    var stopApp = function (app, pid) {
        if(app && app.pid == pid && app.allowStop == true && !app.disabled){
            // TODO stop App
            app.state = "stopped";
            return true;
        }
        return false;
    };

    var dialServer = new dial.Server({
        expressApp: expressApp,
        prefix: prefix,
        port: port,
        manufacturer: MANUFACTURER,
        modelName: MODEL_NAME,
        delegate: {
            getApp: function(appName){
                var app = apps[appName];
                console.log("get App",appName,app);
                if(app && !app.disabled){
                    if(appName == "HbbTV"){
                        var hostname = this.hostname;
                        app.additionalData["hbbtv:X_HbbTV_App2AppURL"] = "ws://"+hostname+":"+port+"/remote";
                    }
                    return app;
                }
                return null;
            },
            launchApp: function(appName,lauchData,callback){
                console.log("request to launch app: ",appName);
                var app = apps[appName];
                var pid = null;
                if (app && !app.disabled) {
                    launchApp(app,lauchData);
                    pid = app.pid;
                }
                callback(pid);
            },
            stopApp: function(appName,pid,callback){
                console.log("request to stop app: ",appName);
                var app = apps[appName];
                var stopped = stopApp(app, pid);
                callback(stopped);
            }
        }
    }).on("ready", function () {
            self.emit("ready");
    }).on("stop", function () {
            self.emit("stop");
    });

    var start = function () {
        dialServer.start();
        return this;
    };

    var stop = function () {
        dialServer.stop();
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

util.inherits(HbbTVDialServer, events.EventEmitter);

module.exports = HbbTVDialServer;