(function(ns,oipfObjectFactory){

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
            console.log("Connection to cs manager established");
        };
        ws.onclose = function(evt) {
            console.log("Connection to cs manager closed");
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

    handleRpcResponse = function (rsp) {
        var id = rsp.id;
        var pendingReq = pendingRpcRequests[id];
        if(pendingReq){
            if(pendingReq.callback){
                try{
                    var req = pendingReq.req || null;
                    pendingReq.callback.call(req,rsp);
                }
                catch (err){
                    console.error("the ws response is not a valid rpc message",err);
                }

            }
        }
    };

    var hash = location.hash.substr(location.hash.lastIndexOf("#")+1);
    var csManagerParameters = parseParameters(hash);
    var port = csManagerParameters.port;
    var hostname = csManagerParameters.hostname;
    var app2AppLocalUrl = "ws://127.0.0.1:"+port+"/local/";
    var app2AppRemoteUrl = "ws://"+hostname+":"+port+"/remote/";
    var hbbtvCsManagerUrl = "ws://127.0.0.1:"+port+"/hbbtvcsmanager";
    var userAgent = navigator.userAgent;
    var appLaunchUrl = "http://"+hostname+":"+port+"/dial/apps/HbbTV";
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
     * A DiscoveredTerminalEndpoints object shall have the following properties:
     * 	- readonly String X_HbbTV_App2AppURL: The remote service endpoint on the discovered HbbTV terminal for application to application communication
     * 	- readonly String X_HbbTV_InterDevSyncURL: The remote service endpoint on the discovered HbbTV terminal for inter-device synchronisation
     * 	- readonly String X_HbbTV_UserAgent: The User Agent string of the discovered HbbTV terminal
     */
    var DiscoveredTerminalEndpoints = function(X_HbbTV_App2AppURL,X_HbbTV_InterDevSyncURL,X_HbbTV_UserAgent){
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
     * 	- readonly String enumId: A unique ID for a CS Launcher Application
     * 	- readonly String friendlyName: A CS Launcher Application may provide a friendly name, e.g. “Muttleys Tablet”, for an HbbTV application to make use of
     * 	- readonly String csOsId: The CS OS identifier string, as described in clause 14.4.1 of the HbbTV 2.0 Spec
     */
    var DiscoveredCSLauncher = function(enumId,friendlyName,csOsId){
        Object.defineProperty(this, "enum_id", {
            get: function () {
                return enumId;
            }
        });
        Object.defineProperty(this, "friendly_name", {
            get: function () {
                return friendlyName;
            }
        });
        Object.defineProperty(this, "CS_OS_id", {
            get: function () {
                return csOsId;
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
                var enumId = oldTerminal && oldTerminal.enumId || terminalCounter++;
                var newTerminal = new DiscoveredCSLauncher(enumId, terminal.friendlyName);
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
        if(!csLauncher){
            code = 3;
            onCSLaunch && onCSLaunch.call(null,enumId,code);
            return;
        }
        return sendRpcRequest({
            jsonrpc: "2.0",
            method: "launchCSApp",
            params: [csLauncher.id, payload]
        }, function (rsp) {
            var code = rsp.result;
            // TODO
            onCSLaunch && onCSLaunch.call(null,enumId,code);
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

    oipfObjectFactory.createCSManager = oipfObjectFactory.createCSManager || function(){
        return new HbbTVCSManager();
    };
    var oldIsObjectSupported = oipfObjectFactory.isObjectSupported;
    oipfObjectFactory.isObjectSupported = function(mimeType){
        if(mimeType == "application/hbbtvCSManager"){
            return true;
        }
        else {
            return oldIsObjectSupported && oldIsObjectSupported.app(this,arguments);
        }
    };
    connect();
})(window.famium = window.famium || {}, window.oipfObjectFactory = window.oipfObjectFactory || {});