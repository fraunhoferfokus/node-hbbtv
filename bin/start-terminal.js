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
var PORT = global.PORT;
var INTERDEVSYNC_URL = global.INTERDEVSYNC_URL;
var USERAGENT = global.USERAGENT;
var OPN_PARAMS = global.OPN_PARAMS;
if(!PORT){
    console.log("variable 'global.PORT' is missing or not a valid port");
    process.exit(1);
}
var hbbtv = require("../index.js");
var HbbTVApp2AppServer = hbbtv.HbbTVApp2AppServer;
var HbbTVDialServer = hbbtv.HbbTVDialServer;
var HbbTVCsManager = hbbtv.HbbTVCsManager;
var http = require('http');
var express = require("express");
var app = express();
var DIAL_PREFIX = "/dial";
var CS_MANAGER_PREFIX = "/csmanager";
http.globalAgent.maxSockets = 100;
var counter = 0;
app.set("port",PORT);
app.set("dial-prefix",DIAL_PREFIX);
app.set("cs-manager-prefix", CS_MANAGER_PREFIX);
app.set("inter-dev-sync-url", INTERDEVSYNC_URL);
app.set("user-agent", USERAGENT);
app.set("opn-params", OPN_PARAMS);
// The HTTP Server is used to in the HbbTVApp2AppServer and the HbbTVDialServer
var httpServer = http.createServer(app);

var hbbtvApp2AppServer = new HbbTVApp2AppServer(httpServer).on("ready", function () {
    console.log("HbbTV App2App Server is ready");
    counter++;
}).on("stop", function () {
    console.log("HbbTV App2App Server is stopped");
    if(--counter == 0){
        process.exit();
    }
}).on("error", function (err) {
    console.error("HbbTVApp2AppServer Error", err);
});

var hbbtvDialServer = new HbbTVDialServer(app).on("ready", function () {
    console.log("HbbTV DIAL Server is ready");
    counter++;
}).on("stop", function () {
    console.log("HbbTV DIAL Server is stopped");
    if(--counter == 0){
        process.exit();
    }
}).on("error", function (err) {
    console.error("HbbTVDialServer Error", err);
});

var hbbTVCsManager = new HbbTVCsManager(httpServer).on("ready", function () {
    console.log("HbbTV CS Manager is ready");
    counter++;
}).on("stop", function () {
    console.log("HbbTV CS Manager is stopped");
    if(--counter == 0){
        process.exit();
    }
}).on("error", function (err) {
    console.error("HbbTVCSManager Error", err);
});

httpServer.listen(PORT, function() {
    console.log("HbbTV Terminal is listening on port ", PORT);
    //console.log("***** The JavaScript Lib 'hbbtv-manager-polyfill.js' must be included in the HbbTV App");
    hbbtvApp2AppServer.start();
    hbbtvDialServer.start();
    hbbTVCsManager.start();
});

process.on('SIGINT', function() {
    console.log("Stopping HbbTV Terminal. Please wait ...");
    hbbtvApp2AppServer.stop();
    hbbtvDialServer.stop();
    hbbTVCsManager.stop();
    setTimeout(function () {
        process.exit();
    },3000);
});