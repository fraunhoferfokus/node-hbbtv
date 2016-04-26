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
var opn = require("opn");
var xml2js = require("xml2js");
var HbbTVDialServer = function (expressApp, isCsLauncher) {
    var self = this;
    var MANUFACTURER = "Fraunhofer FOKUS";
    var MODEL_NAME = "HbbTV 2.0 Node.js Companion Screen Feature Emulator";
    var port = expressApp.get("port") || 80;
    var prefix = expressApp.get("dial-prefix") || "";
    var csManagerPrefix = expressApp.get("cs.manager-prefix") || "";
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
            allowStop: false,
            additionalData: {
                "famium:X_FAMIUM_CS_OS_ID":"de.fhg.fokus.famium.applauncher/0.0.1"
            },
            namespaces: {
                "famium": "http://famium.fokus.fraunhofer.de"
            }
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

    var launchApp = function (app, launchData, callback) {
        var self = this;
        if(app.name == "YouTube"){
            app.pid = "run";
            app.state = "starting";
            openUrl("http://www.youtube.com/tv?"+launchData);
            app.state = "running";
            callback && callback(app.pid);
        }
        else if(app.name == "HbbTV"){
            xml2js.parseString(launchData, {
                trim: true,
                explicitArray: false,
                mergeAttrs: true,
                explicitRoot: false,
                tagNameProcessors: [function(tagName){
                    tagName = tagName.substr(tagName.indexOf(":")+1);
                    return tagName;
                }],
                attrNameProcessors: [function(attrName){
                    attrName = attrName.substr(attrName.indexOf(":")+1);
                    return attrName;
                }]
            },function (err, launchData) {
                if(err){
                    callback && callback(null,err);
                }
                else {
                    try {
                        var appUrlBase = launchData.ApplicationDiscovery.ApplicationList.Application.applicationTransport.URLBase || "";
                        var appLocation = launchData.ApplicationDiscovery.ApplicationList.Application.applicationLocation || "";
                        var url = appUrlBase && (appUrlBase+appLocation) || null;
                        if(url){
                            var csManagerParameters = "port="+port+"&hostname="+self.hostname;
                            openUrl(url+"#"+csManagerParameters);
                            app.state = "running";
                            callback && callback(app.pid);
                        }
                        else {
                            callback && callback(null, new Error("URLBase element in the XML MHP of the DIAL Launch Request is missing or empty"));
                        }
                    }
                    catch (err){
                        callback && callback(null, err);
                    }
                }
            });
        }
        else if(app.name == "Famium"){
            try{
                launchData = JSON.parse(launchData);
                var url = null;
                //for(var i in launchData.launch){
                for(var i=0; i<launchData.launch.length; i++){
                    var launch = launchData.launch[i];
                    if(launch.appType == "html"){
                        url = launch.launchUrl;
                        break;
                    }
                }
                if(url){
                    url += "#port="+port;
                    openUrl(url);
                    callback && callback(app.pid);
                }
                else {
                    callback && callback(null, new Error("CSLauncher Error: The launch request must contain at least one item from type 'html' and with a valid URL"));
                }
            }
            catch(err){
                callback && callback(null, err);
            }
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
        corsAllowOrigins: true,
        delegate: {
            getApp: function(appName){
                var app = apps[appName];
                if(app && !app.disabled){
                    if(appName == "HbbTV"){
                        var hostname = this.hostname;
                        app.additionalData["hbbtv:X_HbbTV_App2AppURL"] = "ws://"+hostname+":"+port+"/remote/";
                        var interDevSyncUrl = expressApp.get("inter-dev-sync-url");
                        if (interDevSyncUrl != null) {
                            app.additionalData["hbbtv:X_HbbTV_InterDevSyncURL"] = String(interDevSyncUrl);
                        }
                        var userAgent = expressApp.get("user-agent");
                        if (userAgent != null) {
                            app.additionalData["hbbtv:X_HbbTV_UserAgent"] = String(userAgent);
                        }
                    }
                    return app;
                }
                return null;
            },
            launchApp: function(appName,launchData,callback){
                var app = apps[appName];
                if (app && !app.disabled) {
                    launchApp.call(this,app,launchData, callback);
                }
                else {
                    callback && callback(null, new Error("App ",appName," not found"));
                }
            },
            stopApp: function(appName,pid,callback){
                var app = apps[appName];
                var stopped = stopApp.call(this,app, pid);
                callback && callback(stopped);
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