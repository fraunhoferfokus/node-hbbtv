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
var PORT = global.PORT;
if(!PORT){
    console.log("variable 'global.PORT' is missing or not a valid port");
    process.exit(1);
}
var hbbtv = require("../index.js");
var HbbTVTerminalManager = hbbtv.HbbTVTerminalManager;
var CsLauncherDialServer = hbbtv.CsLauncherDialServer;
var http = require('http');
var express = require("express");
var app = express();
var DIAL_PREFIX = "/dial";
app.set("port",PORT);
app.set("dial-prefix",DIAL_PREFIX);
http.globalAgent.maxSockets = 100;
var httpServer = http.createServer(app);

var csLauncherDialServer = new CsLauncherDialServer(app).on("ready", function () {
    console.log("HbbTV CS Launcher is ready");
}).on("stop", function () {
    console.log("HbbTV CS Launcher is stopped");
}).on("error", function (err) {
    console.error(err);
});

var hbbTVTerminalManager = new HbbTVTerminalManager(httpServer).on("ready", function () {
    console.log("HbbTV Terminal Manager is ready");
}).on("stop", function () {
    console.log("HbbTV Terminal Manager is stopped");
}).on("error", function (err) {
    console.error(err);
});

httpServer.listen(PORT, function() {
    console.log("HbbTV Companion Screen is listening on port ", PORT);
    //console.log("***** Please append the hash query '#port="+PORT+"'"," to the URL of your CS Web App.\n***** The JavaScript Lib 'hbbtv-manager-polyfill.js' must be included in the CS Web App");
    hbbTVTerminalManager.start();
    csLauncherDialServer.start();

});