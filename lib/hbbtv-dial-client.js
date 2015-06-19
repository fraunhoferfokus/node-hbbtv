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
var HbbTVDialClient = function () {
    var dialClient = new dial.Client();
    var self = this;
    var terminals = {};
    dialClient.on("ready",function(){
        self.emit("ready");
    }).on("found",function(deviceDescriptionUrl, headers){
        dialClient.getDialDevice(deviceDescriptionUrl, function (dialDevice, err) {
            if(dialDevice){
                console.log("DIAL device with Application-URL=",dialDevice.applicationUrl," found");
                dialDevice.getAppInfo("HbbTV", function (appInfo, err) {
                    if(appInfo){
                        console.log("DIAL device supports HbbTV");
                        self.emit("found", dialDevice, appInfo);
                    }
                    else if(err){
                        console.error("Error on get HbbTV App Info of DIAL device is not a HbbTV Terminal", err.message);
                    }
                })
            }
            else if(err){
                console.error("Error on get device description from ",deviceDescriptionUrl);
                //console.error(err);
            }
        });
    }).on("disappear", function(deviceDescriptionUrl, headers){
        console.log("disappear", deviceDesc, headers);
    }).on("stop", function(deviceDescriptionUrl){
        console.log("stop");
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