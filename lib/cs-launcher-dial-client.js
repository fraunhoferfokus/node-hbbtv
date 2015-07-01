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
    var osId = appInfo && appInfo.additionalData && appInfo.additionalData.X_FAMIUM_CS_OS_ID || null;

    dialDevice && (dialDevice.appLaunchURL = appLaunchURL);
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

var CsLauncherDialClient = function () {
    var dialClient = new dial.Client();
    var self = this;
    var csLaunchers = {};
    dialClient.on("ready",function(){
        self.emit("ready");
    }).on("found",function(deviceDescriptionUrl, headers){
        dialClient.getDialDevice(deviceDescriptionUrl, function (dialDevice, err) {
            if(dialDevice){
                dialDevice.getAppInfo("Famium", function (appInfo, err) {
                    if(appInfo){
                        var csLauncher = new CsLauncher(dialDevice, appInfo);
                        csLaunchers[deviceDescriptionUrl] = csLauncher;
                        self.emit("found", csLauncher);
                    }
                    else if(err){
                        // TODO check if this is an error or not
                        //var error = new Error("Error on get CS Launcher FAMIUM App Info or DIAL device is not a FAMIUM CS Launcher", err.message);
                        //self.emit("error", error);
                    }
                });
            }
            else if(err){
                var error = new Error("Error on get device description from "+deviceDescriptionUrl, err.message);
                self.emit("error", error);
            }
        });
    }).on("disappear", function(deviceDescriptionUrl, headers){
        var csLauncher = csLaunchers[deviceDescriptionUrl];
        delete csLaunchers[deviceDescriptionUrl];
        self.emit("disappear",deviceDescriptionUrl, csLauncher);
    }).on("stop", function(){
        self.emit("stop");
    }).on("error", function (err) {
        self.emit("error",err);
    });

    var start = function () {
        dialClient.start();
        return this;
    };

    var refresh = function () {
        dialClient.refresh();
        return this;
    };

    var stop = function () {
        dialClient.stop();
        return this;
    };

    Object.defineProperty(this,"start", {
        get: function(){
            return start;
        }
    });

    Object.defineProperty(this,"refresh", {
        get: function(){
            return refresh;
        }
    });

    Object.defineProperty(this,"stop", {
        get: function(){
            return stop;
        }
    });
};

util.inherits(CsLauncherDialClient, events.EventEmitter);
module.exports = CsLauncherDialClient;