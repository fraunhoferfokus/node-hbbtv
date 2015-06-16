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
var dial = require("../index.js");
var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);

var HOST = "127.0.0.1";// Please replace with your host
//var HOST = "10.147.175.205";
var PORT = 8080;
var MANUFACTURER = "Fraunhofer FOKUS";
var MODEL_NAME = "FAMIUM Display";

var apps = {
	"famium": {
		name: "famium",
		state: "stopped",
		allowStop: true,
		pid: null
	}
}
var dialServer = new dial.Server({
	expressApp: app,
	host: HOST,
	port: PORT,
	manufacturer: MANUFACTURER,
	modelName: MODEL_NAME,
	extraHeaders: {
		"X-FAMIUM-TOKEN": "123456"
	},
	delegate: {
		getApp: function(appName){
			var app = apps[appName];
			console.log("getApp result",app);
			return app;
		},
		launchApp: function(appName,lauchData,callback){
			console.log("launchApp request",appName, lauchData);
			var app = apps[appName];
			var pid = null;
			if (app && app.state == "stopped") {
				app.pid = "run";
				app.state = "starting";
				app.timeout = setTimeout(function(){
					app.state = "running";
					app.timeout = null;
				}, 5000);
			}
			console.log("launchApp result",app.pid);
			callback(app.pid);
		},
		stopApp: function(appName,pid,callback){
			var app = apps[appName];
			if (app && app.pid == pid) {
				app.pid = null;
				app.timeout && clearTimeout(app.timeout);
				app.timeout = null;
				app.state = "stopped";
				callback(true);
			} 
			else {
				callback(false);
			}
		}
	}
});

server.listen(PORT,function(){
	dialServer.start();
	setTimeout(function(){
		dialServer.stop();
		console.log("DIAL Server stopped");
	}, 500000);
	console.log("DIAL Server is running on PORT "+PORT);
});