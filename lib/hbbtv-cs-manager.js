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

var CsLauncher = function (dialDevice, appInfo) {
    var appLaunchURL = dialDevice && dialDevice.applicationUrl && (dialDevice.applicationUrl+"/Famium") || null;

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

var HbbTVCSManager = function (expressApp) {
    var prefix = expressApp.get("cs-manager-prefix") || "";
    var csLauncherDialClient = new dial.Client();
    var self = this;
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
                        csLauncher[csLauncher.getAppLaunchURL()] = csLauncher;
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

    expressApp.get(prefix+"/cslaunchers", function (req,rsp) {
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
            rsp.send(tmpCsLaunchers);
        }, timeout);
    });

    expressApp.post(prefix+"/cslaunchers", function (req,rsp) {
        var launchUrl = req.query["launchUrl"];
        var csLauncher = csLaunchers[launchUrl];
        var launchData = req.body;
        if(csLauncher){
            if(launchData){
                csLauncher.launchCsApp(launchData, function (launchRes, err) {
                    if(err){
                        rsp.sendStatus(400);
                    }
                    else {
                        rsp.sendStatus(200);
                    }
                });
            }
            else{
                rsp.sendStatus(400);
            }
        }
        else {
            rsp.sendStatus(404);
        }
    });

    expressApp.get(prefix+"/hbbtvterminals", function (req,rsp) {

    });

    var start = function () {
        csLauncherDialClient.start();
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