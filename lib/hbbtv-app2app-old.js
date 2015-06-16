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
var websocket = require('websocket');
var WebSocketServer = websocket.server;
var HbbTVApp2AppServer = function (server, callback) {
	var httpServer = server;
	var wsServer = new WebSocketServer({
		httpServer: server,
		autoAcceptConnections: false
	});
	var pendingLocalConnections = [];
	var pendingRemoteConnections = [];
	var handlePendingConnectionsChanged = function (channel) {
		var channelPendingLocalConnections = pendingLocalConnections[channel] || [];
		var channelPendingRemoteConnections = pendingRemoteConnections[channel] || [];
		while(channelPendingLocalConnections.length>0 && channelPendingRemoteConnections.length>0){
			var localConnection = channelPendingLocalConnections.pop();
			var remoteConnection = channelPendingRemoteConnections.pop();
			localConnection.pair = remoteConnection;
			remoteConnection.pair = localConnection;
			localConnection.send("pairingcomplete");
			remoteConnection.send("pairingcomplete");
		}
		if(channelPendingLocalConnections.length == 0){
			delete  pendingLocalConnections[channel];
		}
		if(channelPendingRemoteConnections.length == 0){
			delete  pendingRemoteConnections[channel];
		}
	};
	var handleConnectionClosed = function (connection) {
		if(connection.local) {
			var channelPendingLocalConnections = pendingLocalConnections[connection.channel] || [];
			var index = channelPendingLocalConnections.indexOf(connection);
			index >= 0 && channelPendingLocalConnections.splice(index, 1);
			if(channelPendingLocalConnections.length == 0){
				delete  pendingLocalConnections[connection.channel];
			}
			console.log("pending local connection at index ",index,"removed");
		}
		else if(connection.remote){
			var channelPendingRemoteConnections = pendingRemoteConnections[connection.channel] || [];
			var index = channelPendingRemoteConnections.indexOf(connection);
			index >= 0 && pendingRemoteConnections.splice(index, 1);
			console.log("pending remote connection at index ",index,"removed");
			if(channelPendingRemoteConnections.length == 0){
				delete  pendingRemoteConnections[connection.channel];
			}
		}
	};
	wsServer.on('request', function(req) {
		console.log("web socket request",req.origin, req.resource);
		var connection = null;
		var channel = null;
		if(req.resource.indexOf("/local/") == 0){
			channel = req.resource.replace("/local/","");
			connection = req.accept(/*'echo-protocol'*/null, req.origin);
			connection.local = true;
			connection.channel = channel;
			var channelPendingLocalConnections = pendingLocalConnections[channel] || (pendingLocalConnections[channel] = []);
			channelPendingLocalConnections.push(connection);
		}
		else if(req.resource.indexOf("/remote/") == 0){
			channel = req.resource.replace("/remote/","");
			connection = req.accept(/*'echo-protocol'*/null, req.origin);
			connection.remote = true;
			connection.channel = channel;
			var channelPendingRemoteConnections = pendingRemoteConnections[channel] || (pendingRemoteConnections[channel] = []);
			channelPendingRemoteConnections.push(connection);
		}
		else {
			req.reject();
		}
		if(connection){
			handlePendingConnectionsChanged(channel);
			connection.on('message', function(msg) {
				if (msg.type === 'utf8') {
					console.log('Received Message: ' + msg.utf8Data);
					connection.pair && connection.pair.sendUTF(msg.utf8Data);
				}
				else if (msg.type === 'binary') {
					console.log('Received Binary Message of ' + msg.binaryData.length + ' bytes');
					connection.pair && connection.pair.sendBytes(msg.binaryData);
				}
			});
			connection.on('close', function(reasonCode, description) {
				console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
				if(connection.pair){
					connection.pair.close();
					connection.pair = null;
				}
				else {
					handleConnectionClosed(connection);
				}
				connection = null;
			});
		}
	});
};

module.exports.Server = HbbTVApp2AppServer;