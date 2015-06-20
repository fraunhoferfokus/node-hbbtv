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
var hbbtv = require("../index.js");
var HbbTVDialClient = hbbtv.DialClient;
var HbbTVCsLauncher = hbbtv.CsLauncher;
var http = require('http');
var express = require("express");
var app = express();
var PORT = 8090;
var DIAL_PREFIX = "/dial";
app.set("port",PORT);
app.set("dial-prefix",DIAL_PREFIX);
http.globalAgent.maxSockets = 100;
var httpServer = http.createServer(app);
var opn = require('opn');

var hbbTVDialClient = new HbbTVDialClient().on("ready", function () {
    console.log("HbbTV DIAL Client is ready");
}).on("stop", function () {
    console.log("HbbTV DIAL Client is stopped");
}).on("found", function (terminal) {
    var info = terminal.getInfo();
    console.log("DIAL Terminal ", info.friendlyName," (", terminal.getAppLaunchURL(), ") found");
    var channel = (""+Math.random()).substr(2,16);
    terminal.launchHbbTVApp({
        "appUrlBase": "http://famium.fokus.fraunhofer.de/apps/hbbtv/hbbtv-app.html",
        "appLocation": "?channel="+channel
    }, function (launchRes,err) {
        if(err){
            console.error("Error on launch HbbTV App", err);
        }
        else {
            console.log("HbbTV App launched successfully: ",launchRes || "");
        }
    });
}).on("error", function (err) {
    console.error(err);
});

var hbbTVCsLauncher = new HbbTVCsLauncher(app).on("ready", function () {
    console.log("HbbTV CS Launcher is ready");
}).on("stop", function () {
    console.log("HbbTV CS Launcher is stopped");
}).on("error", function (err) {
    console.error(err);
});

httpServer.listen(PORT, function() {
    hbbTVDialClient.start();
    hbbTVCsLauncher.start();
    console.log("HbbTV Client is listening on port ", PORT);
});