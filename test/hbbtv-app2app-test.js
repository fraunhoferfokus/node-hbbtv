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

var HbbTVApp2AppServer = require("../lib/hbbtv-app2app.js").Server;
var http = require('http');
var httpServer = http.createServer(function(req, rsp) {
	console.log((new Date()) + ' Received request for ' + req.url);
	rsp.writeHead(404);
	rsp.end();
});
var hbbtvWsServer = new HbbTVApp2AppServer(httpServer, function (err) {
	if(err){
		console.error("error on create HbbTV WS Server",err);
	}
	else {
		console.log("HbbTV WS Server created successfully");
	}
});
httpServer.listen(8080, function() {
	console.log((new Date()) + ' Server is listening on port 8080');
});