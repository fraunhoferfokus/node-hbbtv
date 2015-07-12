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
(function(){

    var parseParameters = function(query){
        var dict = {};
        query = query.substr(query.lastIndexOf("#")+1);
        if(query){
            var params = query.split("&");
            for (var i = 0; i < params.length; i++) {
                var index = params[i].indexOf("=");
                var key = index>-1?params[i].substr(0,index):params[i];
                var value = index>-1?params[i].substr(index+1):"";
                if(typeof dict[key] == "undefined"){
                    dict[key] = value;
                }
                else if(typeof dict[key] == "string"){
                    dict[key] = [dict[key],value];
                }
                else if(typeof dict[key] == "object"){
                    dict[key].push(value);
                }
            };
        }
        return dict;
    };

    var connect = function () {
        ws && ws.close();
        ws = new WebSocket(hbbtvCsManagerUrl);
        ws.onopen = function(evt) {
            //console.log("Connection to cs manager established");
        };
        ws.onclose = function(evt) {
            //console.log("Connection to cs manager closed");
            //window.close();
            if(ws = this){
                ws = null;
            }
        };
        ws.onerror = function (evt) {
            console.error("Error on connect to cs manager");
        };
        ws.onmessage = function(evt) {
            try{
                var rsp = JSON.parse(evt.data);
                handleRpcResponse(rsp);
            }
            catch(err){
                console.error("Error on parsing or handling rpc response",err);
            }
        };
    };

    var sendRpcRequest = function (req, callback) {
        if(!req.id){
            req.id = rpcCounter++;
        }
        if(callback && ws){
            pendingRpcRequests[req.id] = {
                req: req,
                callback: callback
            };
            ws.send(JSON.stringify(req));
            return true;
        }
        return false;
    };

    var handleRpcResponse = function (rsp) {
        var id = rsp.id;
        var pendingReq = pendingRpcRequests[id];
        if(pendingReq){
            if(pendingReq.callback){
                try{
                    var req = pendingReq.req || null;
                    pendingReq.callback.call(req,rsp);
                }
                catch (err){
                    //console.error("the ws response is not a valid rpc message",err);
                }

            }
        }
    };

    var hash = location.hash.substr(location.hash.lastIndexOf("#")+1);
    var hashParameters = parseParameters(hash);
    var port = hashParameters.port;
    var hostname = hashParameters.hostname;
    var app2AppLocalUrl = port && "ws://127.0.0.1:"+port+"/local/" || null;
    var app2AppRemoteUrl = port && hostname && "ws://"+hostname+":"+port+"/remote/" || null;
    var hbbtvCsManagerUrl = "ws://127.0.0.1:"+port+"/hbbtvmanager";
    var userAgent = navigator.userAgent;
    var appLaunchUrl = port && hostname && "http://"+hostname+":"+port+"/dial/apps/HbbTV" || null;
    var ws = null;
    var rpcCounter = 1;
    var pendingRpcRequests = {};
    var csLauncherCounter = 1;
    var discoveredLaunchers = {};
    var terminalCounter = 1;
    var discoveredTerminals = {};
    /**
     * Config is set after hbbtv is set
     */
    var config = null;
    /**
     * A DiscoveredTerminal object shall have the following properties:
     *  - readonly Number enum_id: A unique ID for a discovered HbbTV terminal
     *  - readonly String friendly_name: A discovered terminal may provide a friendly name, e.g. “Muttleys TV”, for an HbbTV application to make use of.
     * 	- readonly String X_HbbTV_App2AppURL: The remote service endpoint on the discovered HbbTV terminal for application to application communication
     * 	- readonly String X_HbbTV_InterDevSyncURL: The remote service endpoint on the discovered HbbTV terminal for inter-device synchronisation
     * 	- readonly String X_HbbTV_UserAgent: The User Agent string of the discovered HbbTV terminal
     */
    var DiscoveredTerminal = function(enum_id, friendly_name, X_HbbTV_App2AppURL, X_HbbTV_InterDevSyncURL, X_HbbTV_UserAgent){
        Object.defineProperty(this, "enum_id", {
            get: function () {
                return enum_id;
            }
        });
        Object.defineProperty(this, "friendly_name", {
            get: function () {
                return friendly_name;
            }
        });
        Object.defineProperty(this, "X_HbbTV_App2AppURL", {
            get: function () {
                return X_HbbTV_App2AppURL;
            }
        });
        Object.defineProperty(this, "X_HbbTV_InterDevSyncURL", {
            get: function () {
                return X_HbbTV_InterDevSyncURL;
            }
        });
        Object.defineProperty(this, "X_HbbTV_UserAgent", {
            get: function () {
                return X_HbbTV_UserAgent;
            }
        });
    };
    /**
     * A DiscoveredCSLauncher object shall have the following properties:
     * 	- readonly Number enum_id: A unique ID for a CS Launcher Application
     * 	- readonly String friendly_name: A CS Launcher Application may provide a friendly name, e.g. “Muttleys Tablet”, for an HbbTV application to make use of
     * 	- readonly String CS_OS_id: The CS OS identifier string, as described in clause 14.4.1 of the HbbTV 2.0 Spec
     */
    var DiscoveredCSLauncher = function(enum_id, friendly_name, CS_OS_id){
        Object.defineProperty(this, "enum_id", {
            get: function () {
                return enum_id;
            }
        });
        Object.defineProperty(this, "friendly_name", {
            get: function () {
                return friendly_name;
            }
        });
        Object.defineProperty(this, "CS_OS_id", {
            get: function () {
                return CS_OS_id;
            }
        });
    };


    /**
     * Boolean discoverCSLaunchers(function onCSDiscovery)
     * callback onCSDiscovery(Number enum_id, String friendly_name, String CS_OS_id )
     */
    var discoverCSLaunchers = function(onCSDiscovery){
        return sendRpcRequest({
            jsonrpc: "2.0",
            method: "discoverCSLaunchers",
            params: []
        }, function (rsp) {
            var csLaunchers = rsp.result;
            var res = [];
            for(var appUrl in csLaunchers){
                var oldLauncher = discoveredLaunchers[appUrl];
                var launcher = csLaunchers[appUrl];
                launcher.id = appUrl;
                var enumId = oldLauncher && oldLauncher.enum_id || csLauncherCounter++;
                var newCsLauncher = new DiscoveredCSLauncher(enumId, launcher.friendlyName, launcher.csOsId);
                discoveredLaunchers[appUrl] = newCsLauncher;
                discoveredLaunchers[enumId] = launcher;
                res.push(newCsLauncher);
            }
            onCSDiscovery && onCSDiscovery.call(null,res);
        });
    };

    /**
     * Boolean discoverTerminals(function onTerminalDiscovery)
     * callback onTerminalDiscovery (Number enum_id,String friendly_name,DiscoveredTerminalEndpoints endpoints )
     */
    var discoverTerminals = function(onTerminalDiscovery){
        return sendRpcRequest({
            jsonrpc: "2.0",
            method: "discoverTerminals",
            params: []
        }, function (rsp) {
            var terminals = rsp.result;
            var res = [];
            for(var appUrl in terminals){
                var oldTerminal = discoveredTerminals[appUrl];
                var terminal = terminals[appUrl];
                terminal.id = appUrl;
                var enumId = oldTerminal && oldTerminal.enumId || terminalCounter++;
                var newTerminal = new DiscoveredTerminal(enumId, terminal.friendlyName, terminal.app2AppURL, terminal.interDevSyncURL, terminal.userAgent);
                discoveredTerminals[appUrl] = newTerminal;
                discoveredTerminals[enumId] = terminal;
                res.push(newTerminal);
            }
            onTerminalDiscovery && onTerminalDiscovery.call(null,res);
        });
    };

    /**
     * Boolean launchCSApp(Integer enum_id, String payload, function onCSLaunch)
     * callback onCSLaunch(int enum_id, int error_code)
     * Error Codes Values:
     *	0: op_rejected
     *  2: op_not_guaranteed
     *  3: invalid_id
     *  4: general_error
     */
    var launchCSApp = function(enumId,payload,onCSLaunch){
        var csLauncher = discoveredLaunchers[enumId];
        var code = null;
        if(!csLauncher || typeof payload != "string"){
            code = 3;
            onCSLaunch && onCSLaunch.call(null,enumId,code);
            return false;
        }
        return sendRpcRequest({
            jsonrpc: "2.0",
            method: "launchCSApp",
            params: [csLauncher.id, payload]
        }, function (rsp) {
            var code = rsp.result;
            // TODO check code
            onCSLaunch && onCSLaunch.call(null,enumId,code);
        });
    };

    /**
     * Boolean launchHbbTVApp(Integer enum_id, Object options, function onCSLaunch)
     * callback onCSLaunch(int enum_id, int error_code)
     * Error Codes Values:
     *	0: op_rejected
     *  2: op_not_guaranteed
     *  3: invalid_id
     *  4: general_error
     */
    var launchHbbTVApp = function(enumId,options,onHbbTVLaunch){
        var terminal = discoveredTerminals[enumId];
        var code = null;
        if(!terminal){
            code = 3;
            onHbbTVLaunch && onHbbTVLaunch.call(null,enumId,code);
            return false;
        }
        return sendRpcRequest({
            jsonrpc: "2.0",
            method: "launchHbbTVApp",
            params: [terminal.id, options]
        }, function (rsp) {
            var code = rsp.result;
            // TODO
            onHbbTVLaunch && onHbbTVLaunch.call(null,enumId,code);
        });
    };

    /**
     * String getInterDevSyncURL()
     * Returns the URL of the CSS-CII service endpoint for the terminal that the calling HbbTV application is running on.
     */
    var getInterDevSyncURL =function(){
        console.warn("HbbTVCSManager.getInterDevSyncURL is not supported yet");
        return "";
    };

    /**
     * String getAppLaunchURL()
     * Returns the URL of the application launch service endpoint for the terminal that the calling HbbTV application is running on.
     */
    var getAppLaunchURL = function(){
        return appLaunchUrl;
    };

    /**
     * String getApp2AppLocalBaseURL()
     * Returns the base URL of the application to application communication service local endpoint.
     * The URL retrieved by this method shall end with a slash (‘/’) character.
     */
    var getApp2AppLocalBaseURL =function(){
        return app2AppLocalUrl;
    };

    /**
     * String getApp2AppRemoteBaseURL()
     * Returns the base URL of the application to application communication service remote endpoint.
     * The URL retrieved by this method shall end with a slash (‘/’) character
     */
    var getApp2AppRemoteBaseURL =function(){
        return app2AppRemoteUrl;
    };

    var HbbTVCSManager = function(){
        Object.defineProperty(this, "discoverCSLaunchers", {
            get: function () {
                return discoverCSLaunchers;
            }
        });

        Object.defineProperty(this, "discoverTerminals", {
            get: function () {
                return discoverTerminals;
            }
        });

        Object.defineProperty(this, "launchCSApp", {
            get: function () {
                return launchCSApp;
            }
        });

        Object.defineProperty(this, "launchHbbTVApp", {
            get: function () {
                return launchHbbTVApp;
            }
        });

        Object.defineProperty(this, "getInterDevSyncURL", {
            get: function () {
                return getInterDevSyncURL;
            }
        });

        Object.defineProperty(this, "getAppLaunchURL", {
            get: function () {
                return getAppLaunchURL;
            }
        });

        Object.defineProperty(this, "getApp2AppLocalBaseURL", {
            get: function () {
                return getApp2AppLocalBaseURL;
            }
        });

        Object.defineProperty(this, "getApp2AppRemoteBaseURL", {
            get: function () {
                return getApp2AppRemoteBaseURL;
            }
        });
    };

    var HbbTVTerminalManager = function(){
        Object.defineProperty(this, "discoverTerminals", {
            get: function () {
                return discoverTerminals;
            }
        });

        Object.defineProperty(this, "launchHbbTVApp", {
            get: function () {
                return launchHbbTVApp;
            }
        });
    };

    if(port && hostname){
        window.oipfObjectFactory = window.oipfObjectFactory || {};
        window.oipfObjectFactory.createCSManager = oipfObjectFactory.createCSManager || function(){
            return new HbbTVCSManager();
        };
        var oldIsObjectSupported = oipfObjectFactory.isObjectSupported;
        window.oipfObjectFactory.isObjectSupported = function(mimeType){
            if(mimeType == "application/hbbtvCSManager"){
                return true;
            }
            else {
                return oldIsObjectSupported && oldIsObjectSupported.app(this,arguments);
            }
        };
        connect();
    }
    else if(port){
        window.hbbtv = window.hbbtv || {};
        window.hbbtv.createTerminalManager = function(){
            return new HbbTVTerminalManager();
        };
        connect();
    }
    else {
        console.warn("hash parameters 'port' and/or 'hostname' are not detected. " +
                     "hbbtv-manager-polyfill.js can be used in HbbTV Apps when the hash " +
                     "parameters 'port' and 'hostname' are specified and in CS Web Apps " +
                     "when only the 'port' hash parameter is specified. These parameters " +
                     "will be automatically set when the HbbTV App is launched through the " +
                     "HbbTVDialServer or the CS Web App is launched through the CsLauncherDialServer. " +
                     "The hash parameters needs to be set manually if the application is launched by the user.");
    }
})();