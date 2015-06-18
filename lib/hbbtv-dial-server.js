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
var express = require("express");

var HbbTVDialServer = function (/*httpServer, callback*/) {
    var httpServer = arguments[0];
    var address = httpServer.address();
    var port = address && address.port || null;
    var callback  = typeof arguments[1] == "function"? arguments[1]: null;
    if(arguments.length == 3){
        port  = arguments[1];
        callback = typeof arguments[2] == "function"? arguments[2]: null;
    }
    var MANUFACTURER = "Fraunhofer FOKUS";
    var MODEL_NAME = "HbbTV 2.0 Node.js Companion Screen Feature Emulator";
    var apps = {
        "YouTube": {
            name: "YouTube",
            state: "stopped",
            allowStop: true,
            pid: null,
            launch: function (launchData) {
                opn("http://www.youtube.com/tv?"+launchData);
            },
            stop: function(){

            }
        },
        "HbbTV": {
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
            },
            launch: function (launchData) {
                // TODO parse xml launch data according to HbbTV Spec
                opn(launchData);
            },
            stop: function(){

            }
        }
    };


    var dialServer = new dial.Server({
        expressApp: app,
        port: PORT,
        manufacturer: MANUFACTURER,
        modelName: MODEL_NAME,
        delegate: {
            getApp: function(appName){
                var app = apps[appName];
                if(appName == "HbbTV"){
                    var hostname = this.hostname;
                    app.additionalData["hbbtv:X_HbbTV_App2AppURL"] = "ws://"+hostname+":"+port+"/remote";
                }
                return app;
            },
            launchApp: function(appName,lauchData,callback){
                console.log("request to launch app: ",appName);
                var app = apps[appName];
                if (app) {
                    if(app.state == "stopped"){
                        app.pid = "run";
                        app.state = "starting";
                    }
                    setTimeout(function () {
                        app.launch && app.launch(lauchData);
                        app.state = "running";
                    },500);
                }
                callback(app.pid);
            },
            stopApp: function(appName,pid,callback){
                var app = apps[appName];
                if (app && app.pid == pid && app.allowStop == true) {
                    app.pid = null;
                    setTimeout(function () {
                        app.stop && app.stop();
                        app.state = "stopped";
                    },500);
                    callback(true);
                }
                else {
                    callback(false);
                }
            }
        }
    });
};

module.exports = HbbTVDialServer;