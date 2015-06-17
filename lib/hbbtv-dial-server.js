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
var HbbTVDialServer = function (httpServer, callback) {

    var PORT = 3000;
    var MANUFACTURER = "Fraunhofer FOKUS";
    var MODEL_NAME = "FAMIUM Display";

    var apps = {
        "famium": {
            name: "famium",
            state: "stopped",
            allowStop: true,
            pid: null,
            launch: function (launchData) {
                opn(launchData);
            }
        },
        "YouTube": {
            name: "YouTube",
            state: "stopped",
            allowStop: true,
            pid: null,
            launch: function (launchData) {
                opn("http://www.youtube.com/tv?"+launchData);
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
            }
        }
    }
    var dialServer = new dial.Server({
        expressApp: app,
        port: PORT,
        manufacturer: MANUFACTURER,
        modelName: MODEL_NAME,
        extraHeaders: {
            "X-FAMIUM-TOKEN": "123456"
        },
        delegate: {
            getApp: function(appName){
                var app = apps[appName];
                console.log("getApp result for App ",appName,app);
                return app;
            },
            launchApp: function(appName,lauchData,callback){
                console.log("launchApp request", lauchData);
                var app = apps[appName];
                var pid = null;
                if (app && app.state == "stopped") {
                    app.pid = "run";
                    app.state = "starting";
                    setTimeout(function () {
                        app.launch && app.launch(lauchData);
                        app.state = "running";
                    },500);
                }
                console.log("launchApp result",app.pid);
                callback(app.pid);
            },
            stopApp: function(appName,pid,callback){
                var app = apps[appName];
                if (app && app.pid == pid) {
                    app.pid = null;
                    app.timeout && clearTimeout(app.timeout);
                    app.timeout = null;
                    app.state = "stopped";
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