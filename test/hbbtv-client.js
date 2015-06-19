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
var httpServer = http.createServer(app);

var hbbTVDialClient = new HbbTVDialClient().on("ready", function () {
    console.log("HbbTV DIAL Client is ready");
}).on("stop", function () {
    console.log("HbbTV DIAL Client is stopped");
});

var hbbTVCsLauncher = new HbbTVCsLauncher(app).on("ready", function () {
    console.log("HbbTV CS Launcher is ready");
}).on("stop", function () {
    console.log("HbbTV CS Launcher is stopped");
});

httpServer.listen(PORT, function() {
    hbbTVDialClient.start();
    hbbTVCsLauncher.start();
    console.log("HbbTV Client is listening on port ", PORT);
});