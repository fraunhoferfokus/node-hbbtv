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

    var hash = location.hash.substr(location.hash.lastIndexOf("#")+1);
    var csManagerParameters = parseParameters(hash);
    var port = csManagerParameters.port;
    var hostname = csManagerParameters.hostname;
    var app2AppLocalUrl = "ws://127.0.0.1:"+port+"/local";
    var app2AppRemoteUrl = "ws://"+hostname+":"+port+"/remote";
    var userAgent = navigator.userAgent;
    var appLaunchUrl = "http://"+hostname+":"+port+"/dial/apps/HbbTV";
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
     * Boolean discoverCSLaunchers(function onCSDiscovery)
     * callback onCSDiscovery(Number enum_id, String friendly_name, String CS_OS_id )
     */
    var discoverCSLaunchers = function(onCSDiscovery){

    };

    /**
     * Boolean discoverTerminals(function onTerminalDiscovery)
     * callback onTerminalDiscovery (Number enum_id,String friendly_name,DiscoveredTerminalEndpoints endpoints )
     */
    var discoverTerminals = function(onTerminalDiscovery){

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
    var launchCSApp = function(enum_id,payload,onCSLaunch){

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
})(window.famium = famium || {}, window.oipfObjectFactory = oipfObjectFactory || {});