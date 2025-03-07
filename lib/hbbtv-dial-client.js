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
var URL = require("url");
var builder  = require('xmlbuilder');

var HbbTVTerminal = function (dialDevice, appInfo) {

    var appLaunchURL = dialDevice && dialDevice.applicationUrl && (dialDevice.applicationUrl+"/HbbTV") || null;
    var app2AppURL = appInfo && appInfo.additionalData && appInfo.additionalData.X_HbbTV_App2AppURL || null;
    var interDevSyncURL = appInfo && appInfo.additionalData && appInfo.additionalData.X_HbbTV_InterDevSyncURL || null;
    var userAgent = appInfo && appInfo.additionalData && appInfo.additionalData.X_HbbTV_UserAgent || null;
    var friendlyName = dialDevice && dialDevice.friendlyName || null;
    dialDevice && (dialDevice.appLaunchURL = appLaunchURL);
    dialDevice && (dialDevice.app2AppURL = app2AppURL);
    dialDevice && (dialDevice.userAgent = userAgent);
    dialDevice && (dialDevice.interDevSyncURL = interDevSyncURL);

    var getInfo = function () {
        return dialDevice || null;
    };
    var getApp2AppURL = function () {
        return app2AppURL;
    };
    var getInterDevSyncURL = function () {
        return interDevSyncURL;
    };
    var getUserAgent = function () {
        return userAgent;
    };
    var getAppLaunchURL = function () {
        return appLaunchURL;
    };
    var getFriendlyName = function () {
        return friendlyName;
    };

    var launchHbbTVApp = function (launchData,callback) {
        var orgId = launchData.orgId || "";
        var appId = launchData.appId || "";
        var appName = launchData.appName || "";
        var appNameLanguage = launchData.appNameLanguage || "";
        var appUrlBase = launchData.appUrlBase || "";
        var appLocation = launchData.appLocation || "";
        if(appUrlBase.protocol && appUrlBase.hostname){
            var mhp = {
                "mhp:ServiceDiscovery": {
                    "@xmlns:mhp": "urn:dvb:mhp:2009",
                    "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                    "mhp:ApplicationDiscovery": {
                        "@DomainName": appUrlBase.hostname,
                        "mhp:ApplicationList": {
                            "mhp:Application": {
                                "mhp:appName": {
                                    "@Language": appNameLanguage,
                                    "#text": appName
                                },
                                "mhp:applicationIdentifier": {
                                    "mhp:orgId": orgId,
                                    "mhp:appId": appId
                                },
                                "mhp:applicationDescriptor": {
                                    "mhp:type": {
                                        "mhp:OtherApp": "application/vnd.hbbtv.xhtml+xml"
                                    },
                                    "mhp:controlCode": "AUTOSTART",
                                    "mhp:visibility": "VISIBLE_ALL",
                                    "mhp:serviceBound": "false",
                                    "mhp:priority": "1",
                                    "mhp:version": "01",
                                    "mhp:mhpVersion": {
                                        "mhp:profile": "0",
                                        "mhp:versionMajor": "1",
                                        "mhp:versionMinor": "3",
                                        "mhp:versionMicro": "1"
                                    }
                                },
                                "mhp:applicationTransport": {
                                    "@xsi:type": "mhp:HTTPTransportType",
                                    "mhp:URLBase": appUrlBase
                                },
                                "mhp:applicationLocation": appLocation
                            }
                        }
                    }
                }
            };
            var launchReq = builder.create(mhp).end({ pretty: true});
            dialDevice.launchApp("HbbTV",launchReq, "text/plain", function (launchRes, err) {
                if(typeof launchRes != "undefined"){
                    callback && callback(launchRes,err);
                }
                else if(err){
                    callback && callback(null,err);
                }
            });
        }
        else {
            var err = new Error("mhp:applicationTransport->URLBase is mandatory and must be an valid URL");
            callback && callback(null,err);
        }
    };

    Object.defineProperty(this,"launchHbbTVApp", {
        get: function(){
            return launchHbbTVApp;
        }
    });

    Object.defineProperty(this,"getAppLaunchURL", {
        get: function(){
            return getAppLaunchURL;
        }
    });

    Object.defineProperty(this,"getApp2AppURL", {
        get: function(){
            return getApp2AppURL;
        }
    });

    Object.defineProperty(this,"getInterDevSyncURL", {
        get: function(){
            return getInterDevSyncURL;
        }
    });

    Object.defineProperty(this,"getUserAgent", {
        get: function(){
            return getUserAgent;
        }
    });

    Object.defineProperty(this,"getFriendlyName", {
        get: function(){
            return getFriendlyName;
        }
    });

    Object.defineProperty(this,"getInfo", {
        get: function(){
            return getInfo;
        }
    });
};

var HbbTVDialClient = function () {
    var dialClient = new dial.Client();
    var self = this;
    var terminals = {};
    dialClient.on("ready",function(){
        self.emit("ready");
    }).on("found",function(deviceDescriptionUrl, headers){
        dialClient.getDialDevice(deviceDescriptionUrl, function (dialDevice, err) {
            if(dialDevice){
                dialDevice.getAppInfo("HbbTV", function (appInfo, err) {
                    if(appInfo){
                        var terminal = new HbbTVTerminal(dialDevice, appInfo);
                        terminals[deviceDescriptionUrl] = terminal;
                        self.emit("found", terminal);
                    }
                    else if(err){
                        // TODO check if this is an error or not
                        //var error = new Error("Error on get HbbTV App Info or DIAL device is not a HbbTV Terminal", err.message);
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
        var terminal = terminals[deviceDescriptionUrl];
        delete terminals[deviceDescriptionUrl];
        self.emit("disappear",deviceDescriptionUrl, terminal);
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

util.inherits(HbbTVDialClient, events.EventEmitter);
module.exports = HbbTVDialClient;