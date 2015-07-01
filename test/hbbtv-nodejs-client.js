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
var hbbtv = require("../index.js");
var HbbTVDialClient = hbbtv.HbbTVDialClient;
var WebSocket = hbbtv.WebSocket;

var hbbTVDialClient = new HbbTVDialClient().on("ready", function () {
    console.log("HbbTV DIAL Client is ready");
}).on("stop", function () {
    console.log("HbbTV DIAL Client is stopped");
}).on("found", function (terminal) {
    console.log("HbbTV Terminal ", terminal.getFriendlyName()," (", terminal.getAppLaunchURL(), ") found");
    var channel = (""+Math.random()).substr(2,16);
    terminal.launchHbbTVApp({
        "appUrlBase": "http://localhost:63342/node-hbbtv/www/hbbtv-app.html",//"http://fraunhoferfokus.github.io/node-hbbtv/www/hbbtv-app.html",
        "appLocation": "?channel="+channel
    }, function (launchRes,err) {
        if(err){
            console.error("Error on launch HbbTV App", err);
        }
        else {
            console.log("HbbTV App launched successfully: ",launchRes || "");
            createConnection(terminal, channel);
        }
    });
}).on("error", function (err) {
    console.error(err);
});

var createConnection = function (terminal, channel) {
    var app2appRemoteBaseUrl = terminal.getApp2AppURL();
    var ws = new WebSocket(app2appRemoteBaseUrl + channel);
    ws.binaryType = "arraybuffer";
    ws.onopen = function(evt) {
        console.log("Connection waiting ...");
    };
    ws.onclose = function(evt) {
        console.log("Connection closed.");
    };
    ws.onerror = function (evt) {
        console.log("Connection error.");
    };
    ws.onmessage = function(evt) {
        if (evt.data == "pairingcomplete") {
            console.log("pairing complete");
            ws.onmessage = function(evt) {
                console.log( "Received Message: " + evt.data);
            };
            var data = "Hello from Companion Screen";
            ws.send(data);
            var array = [0,1,2,3,4,5,6,7,8,9];
            data = typeof Buffer != "undefined"?new Buffer(array): new Int8Array(array).buffer;
            ws.send(data);
        } else {
            console.log("Unexpected message received from terminal.");
            ws.close();
        }
    };
};

hbbTVDialClient.start();