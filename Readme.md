Node.js `hbbtv` module
====================

The Node.js `hbbtv` module is a feature complete implementation of the HbbTV 2.0 Companion Screen components:

* **HbbTV App Launch**: Launching a Companion Screen application from an HbbTV application
* **CS App Launch**: Launching a broadcast independent HbbTV application on an HbbTV terminal from a Companion Screen application.
* **App2App Communication**: Exchange text and binary messages between HbbTV and Companion Screen applications

Please refer to the [HbbTV 2.0 spec document][hbbtv20spec] for more details especially to the Companion Screen related
sections 8.2.6 and 14.

The module is developed by the [Fraunhofer FOKUS´s](https://www.fokus.fraunhofer.de/) Competence Center [Future Applications and Media - FAME](https://www.fokus.fraunhofer.de/fame).
Please contact us <famecontact@fokus.fraunhofer.de> for more details or if you need help to integrate this module in your product.

If you find Bugs please submit a new GitHub issue.

Requirements
===========

  * [Node.js](https://nodejs.org/). Tested with:
      * Node.js v0.12.5 on Windows, Mac and Linux.
      * Node.js v0.10.25 on Windows.
  * npm (will be installed with Node.js)

Setup
=====

  * **Install globally**: use `npm install hbbtv -g` to install the module. The `-g` option installs the module globally which is preferred if
  the module is used just as CLI. After the module is installed the `hbbtv` command will be available ([Usage section](#usage)
   explains how to use the `hbbtv` command). On Mac and Linux you may need to install the module using `sudo npm install hbbtv -g`.
  Some optional components require Python 2.7, please ignore related error logs if Python 2.7 is not installed on your machine
  or use `npm install hbbtv -g --no-optional` to not install optional components.
      * **Update globally installed module**: just run `npm update -g hbbtv`
  * **Install locally**: This is not preferred if you want to use the module as CLI. Use `npm install hbbtv` without `-g`
   option will create a `node_modules` folder with the `hbbtv` module in it. Please note that the `hbbtv` command will be not
   available if you install the module locally. Another way to install locally is to clone this git repository and run `npm install` (or `npm install --no-optional`)
   in the home folder to install dependencies. [Usage section](#usage) explains how to use this module if it is installed locally.
      * **Update locally installed module**: just run `npm update hbbtv` in the same folder where you installed the module (where you ran `npm install hbbtv`). If the module is cloned from git, run `git pull` and then `npm install`.
  * **Integrate in other Node.js applications**: To integrate this module in your Node.js application just add `"hbbtv": "<version>"` (replace `<version>` with the actual version) to
  the `dependencies` element of the `package.json` in your application. In your application use `var hbbtv = require("hbbtv")` to
  bind the module. For more details about the APIs supported in this module please refer to the [API Documentation](#api-documentation) section.
      * **Update module integrated in 3rd party applications**: replace `<version>` with a newer version in `package.json` of your Node.js application

Usage
=====

The `hbbtv` module can be started as HbbTV Terminal (`terminal` mode) or as Companion Screen (`cs` mode):

* If it is started in `terminal` mode, your machine will be seen as a HbbTV 2.0 CS compliant Terminal.
You can use any HbbTV DIAL client to launch HbbTV applications and use any WebSocket client for App2App communication.
The following command can be used to start in `terminal` mode on port `8080`:
   * `hbbtv` installed globally

        ```
        hbbtv -m terminal -p 8080
        ```

   * `hbbtv` installed locally

        ```
        cd /path/to/folder/hbbtv/bin
        node hbbtv.js -m terminal -p 8080
        ```

* If it is started in `cs` mode, it will turn you machine in a companion screen that runs a CSLauncher and HbbTV DIAL Client.
The HbbTV Terminal started in previous step will be able to discover companion screens running a CSLauncher and to launch CS applications.
Since the discovery and communication between HbbTV terminals and CSLaunchers is not part of the HbbTV 2.0 Spec, we used here also the DIAL
protocol to discover CSLaunchers and launch CS Applications. The CSLauncher acts as DIAL Server that offers a non-stoppable
DIAL application called `Famium` which is already registered in the [DIAL registry][dial-reg]. The application accepts DIAL launch requests
in the body of the related HTTP POST requests in the same format as specified in section
14.4.2 "Payload format for Install and Launch operations" of the [HbbTV 2.0 spec document][hbbtv20spec].
The following command can be used to start the `hbbtv` module in `cs` mode on port `8090`:

   * `hbbtv` installed globally

        ```
        hbbtv -m cs -p 8090
        ```

   * `hbbtv` installed locally

        ```
        cd /path/to/folder/hbbtv/bin
        node hbbtv.js -m cs -p 8090
        ```

* To display `hbbtv` usage options use the following command:

   * `hbbtv` installed globally

        ```
        hbbtv -h
        ```

   * `hbbtv` installed locally

        ```
        cd /path/to/folder/hbbtv/bin
        node hbbtv.js -h
        ```

Examples
========

Run Example HbbTV App and CS Web App hosted on GitHub
-----------------------------------------------------

The fastest way to test this module is by using the example HbbTV and CS applications hosted on github.io:
* HbbTV App: `http://fraunhoferfokus.github.io/node-hbbtv/www/hbbtv-app.html`
* CS Web App: `http://fraunhoferfokus.github.io/node-hbbtv/www/cs-app.html`

### Run example:

1. start `hbbtv` module in `terminal` mode: `hbbtv -m terminal -p 8080`
2. start `hbbtv` module in `cs` mode: `hbbtv -m cs -p 8090`    
   > It is possible to start `hbbtv` in `terminal` and `cs` mode on different ports on the same device.
   > For better understanding, it is recommended to use two different devices one for `terminal` and one for `cs`. both devices must be
   > in the same network in order to discover and communicate with each others using DIAL and WebSocket.

3. open CS Web App `http://fraunhoferfokus.github.io/node-hbbtv/www/cs-app.html#port=8090` in a browser on the same device from previous step where `hbbtv` is started in `cs` mode (the port must be the same as in previous step).
4. follow the instructions in the CS App opened in the browser in previous step: You will be able to discover the HbbTV Terminal started in first step, launch an HbbTV App on it and open a WebSocket communication channel to the remote App2App Endpoint of the discovered terminal.
5. After the HbbTV App is launched on the terminal, it will be able to discover CSLaunchers, launch CS Web Apps and create WebSocket communication channels to the local App2App Endpoint.

Develop HbbTV App
-----------------

* The following example shows an HbbTV Application that discovers CSLaunchers, launches a CS Web App on a discovered CSLauncher and creates
a WebSocket connection to the local App2App Endpoint. The following steps are needed to run this example:
   * Start `hbbtv` in `terminal` mode: `hbbtv -m terminal -p 8080`
   * Please don't open this application manually in the Browser. Use the example CS Web App described in next subsection to launch this application.
* The HbbTV Web App needs to include the JavaScript Lib `hbbtv-manager-polyfill.js`
* Please refer to section 8.2.6 of the HbbTV 2.0 Spec document for more details about the JavaScript API of the HbbTVCSManager.

```html
<!DOCTYPE html>
<!-- http://www.example.com/hbbtv-app.html -->
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>HbbTV App</title>
    <script type="text/javascript" src="js/hbbtv-manager-polyfill.js"></script>
</head>
<body>
<script type="text/javascript">
    var csManager = oipfObjectFactory.createCSManager();
    var app2appLocalBaseUrl = csManager.getApp2AppLocalBaseURL();
    var appEndpoint = "org.mychannel.myapp";
    var discoverCSLaunchers = function(){
        csManager.discoverCSLaunchers(function (csLaunchers) {
            if(csLaunchers.length==0){
                console.log("No CS launcher found.");
            }
            else{
                console.log(csLaunchers.length, " CSLaunchers found");
                var csLauncher = csLaunchers[0];
                console.log("Launch CS Web App on companion device: ",csLauncher.friendly_name);
                launchCsApp(csLauncher, "http://www.example.org/cs-app.html");
            }
            console.log("cs launchers found",csLaunchers);
        });
    };
    var launchCsApp = function (csLauncher, csAppUrl) {
        var payload = {
            "launch": [
                {"launchUrl": csAppUrl+"?app2appURL="+csManager.getApp2AppRemoteBaseURL(), "appType": "html"}
            ]
        };
        csManager.launchCSApp(csLauncher.enum_id, payload, function (res) {
            console.log("launch cs app result code", res);
        });
    };
    var createConnection = function (index) {
        var ws = new WebSocket(app2appLocalBaseUrl + appEndpoint);
        ws.binaryType = "arraybuffer";
        ws.onopen = function(evt) {
            console.log("Connection ",index," waiting ...");
        };
        ws.onclose = function(evt) {
            console.log("Connection ",index," closed.");
        };
        ws.onerror = function (evt) {
            console.log("Connection error.");
        };
        ws.onmessage = function(evt) {
            if (evt.data == "pairingcompleted") {
                console.log("connection ",index," paired");
                ws.onmessage = function(evt) {
                    if(typeof evt.data == "string"){
                        console.log( "Received Message: " + evt.data);
                    }
                    else {
                        var data = typeof Buffer != "undefined"?new Buffer(evt.data): new Int8Array(evt.data);
                        console.log("Received Binary Message of " + data.length + " bytes", data);
                    }
                };
                ws.send("Hello from HbbTV App: "+index);
                // create a new connection to accept additional clients
                createConnection(index+1);
            } else {
                console.log("Unexpected message received from terminal.");
                ws.close();
            }
        };
    };
    // create first connection to local App2App endpoint
    createConnection(0);
</script>
</body>
</html>
```

Develop Companion Screen Web App
--------------------------------

* The following example show a CS Web Application that discovers HbbTV Terminals, launches an HbbTV App on a discovered terminal and creates
a WebSocket connection to the App2App Endpoint of the discovered Terminal. The following steps are needed to run this example:
   * Start `hbbtv` in `cs` mode: `hbbtv -m cs -p 8090`
   * Open the CS Web App in a Browser on the same device and append `#port=8090` to the URL: `http://www.example.com/cs-app.html#port=8090`
* The CS Web App needs to include the JavaScript Lib `hbbtv-manager-polyfill.js`
* The following example uses all JavaScript functions required to discover terminals, launch HbbTV Apps and create WebSocket connection.
API documentation coming soon.

```html
<!DOCTYPE html>
<!-- http://www.example.com/cs-app.html -->
<html>
<head lang="en">
   <meta charset="UTF-8">
   <title>Companion Screen App</title>
   <script type="text/javascript" src="js/hbbtv-manager-polyfill.js"></script>
</head>
<body>
<script type="text/javascript">
   var channel = "org.mychannel.myapp";
   // create a TerminalManager instance to discover HbbTV Terminals and launch HbbTV Apps
   // You need to append #port=<port> to the url in the browser.
   var terminalManager = hbbtv && hbbtv.createTerminalManager();
   // use the discoverTerminals supported by the TerminalManager to discover HbbTV Terminals
   var discoverTerminals = function(){
       terminalManager.discoverTerminals(function (terminals) {
           if(terminals.length==0){
                console.log("No HbbTV Terminals found");
           }
           else {
                console.log(terminals.length, " Terminals found");
                var terminal = terminals[0];
                console.log("Launch HbbTV App on Terminal: ",terminal.friendly_name);
                launchHbbTVApp(terminal,"http://www.example.org/hbbtv-app.html");
           }
       });
   };
   // Launch an HbbTV App on discovered terminal
   var launchHbbTVApp = function (terminal, appUrl) {
       var options = {
           "orgId": 0,
           "appId": 0,
           "appUrlBase": appUrl,
           "appLocation": "?channel="+channel
       };
       terminalManager.launchHbbTVApp(terminal.enum_id, options, function (res) {
           console.log("Launch HbbTV App result code", res);
           console.log("Connect to HbbTV Terminal: ",terminal.friendly_name);
           connect(terminal);
       });
   };
   // Create a WebSocket connection to the App2App endpoint of the Terminal
   var connect = function (terminal) {
       var app2appRemoteBaseUrl = terminal && terminal.X_HbbTV_App2AppURL ;
       var ws = new WebSocket(app2appRemoteBaseUrl + channel);
       ws.binaryType = "arraybuffer";
       ws.onopen = function(evt) {
           console.log("Connection waiting ...");
       };
       ws.onclose = function(evt) {
           console.log("Connection closed.");
       };
       ws.onerror = function (evt) {
           console.log("Connection error.");
       };
       ws.onmessage = function(evt) {
           if (evt.data == "pairingcompleted") {
               console.log("connection paired");
               ws.onmessage = function(evt) {
                   console.log( "Received Message: " + evt.data);
               };
               var data = "Hello from Companion Screen";
               ws.send(data);
               var array = [0,1,2,3,4,5,6,7,8,9];
               data = typeof Buffer != "undefined"?new Buffer(array): new Int8Array(array).buffer;
               ws.send(data);
           } else {
               console.log("Unexpected message received from terminal.");
               ws.close();
           }
       };
   };
</script>
</body>
</html>
```

Develop Node.js HbbTV CS Client
-------------------------------

the `hbbtv` module can also used to implement HbbTV CS Node.js clients without the need to develop CS Web App that runs
in the Browser. This is for example useful to run HbbTV CS test cases or to use in Node.js applications to discover HbbTV
terminals, launch HbbTV applications and create WebSocket connections to the remote App2App Endpoint of discovered terminals.
The following example illustrates the usage of supported features

 ```javascript
 var hbbtv = require("hbbtv");
 var HbbTVDialClient = hbbtv.HbbTVDialClient;
 var WebSocket = hbbtv.WebSocket;
 // create a hbbTVDialClient instance and add listeners for ready, stop, found and error events
 var hbbTVDialClient = new HbbTVDialClient().on("ready", function () {
     console.log("HbbTV DIAL Client is ready");
 }).on("stop", function () {
     console.log("HbbTV DIAL Client is stopped");
 }).on("found", function (terminal) {
     // found events are triggered each time a new HbbTV terminal is found
     console.log("HbbTV Terminal ", terminal.getFriendlyName()," (", terminal.getAppLaunchURL(), ") found");
     var channel = (""+Math.random()).substr(2,16);
     // launch HbbTV App on each discovered terminal
     terminal.launchHbbTVApp({
         "appUrlBase": "http://fraunhoferfokus.github.io/node-hbbtv/www/hbbtv-app.html",
         "appLocation": "?channel="+channel
     }, function (launchRes,err) {
         if(err){
             console.error("Error on launch HbbTV App", err);
         }
         else {
             console.log("HbbTV App launched successfully: ",launchRes || "");
             // create App2App connection after application is launched
             createConnection(terminal, channel);
         }
     });
 }).on("error", function (err) {
     console.error(err);
 });
 var createConnection = function (terminal, channel) {
     var app2appRemoteBaseUrl = terminal.getApp2AppURL();
     var ws = new WebSocket(app2appRemoteBaseUrl + channel);
     ws.binaryType = "arraybuffer";
     ws.onopen = function(evt) {
         console.log("Connection waiting ...");
     };
     ws.onclose = function(evt) {
         console.log("Connection closed.");
     };
     ws.onerror = function (evt) {
         console.log("Connection error.");
     };
     ws.onmessage = function(evt) {
         if (evt.data == "pairingcompleted") {
             console.log("pairing complete");
             ws.onmessage = function(evt) {
                 console.log( "Received Message: " + evt.data);
             };
             var data = "Hello from Companion Screen";
             ws.send(data);
             var array = [0,1,2,3,4,5,6,7,8,9];
             data = typeof Buffer != "undefined"?new Buffer(array): new Int8Array(array).buffer;
             ws.send(data);
         } else {
             console.log("Unexpected message received from terminal.");
             ws.close();
         }
     };
 };
 hbbTVDialClient.start();
 // hbbTVDialClient.stop();
 ```

Android HbbTV CS Client
-----------------
Please contact us <famecontact@fokus.fraunhofer.de> for more details

iOS HbbTV CS Client
-------------
Please contact us <famecontact@fokus.fraunhofer.de> for more details

Cordova HbbTV CS Client
-----------------
Please contact us <famecontact@fokus.fraunhofer.de> for more details

API Documentation
=================

The Node.js `hbbtv` module is designed to be integrated in existing products like set-top-boxes or TV sets with Node.js
environment. The current implementation launches HbbTV and Companion Screen applications in the default browser. This is
practicable to test HbbTV 2.0 CS features on the same environment developers use to develop their applications. To
use this module in real products, the HbbTV UA needs to be launched instead of the default browser. This can be easily done
by making the HbbTV UA as default Browser or just by starting it directly from this module just by replacing the lines of
code where the default Browser is launched with your launch command.

API documentation for the `hbbtv-manager-polyfill.js` and the `hbbtv` module and its sub-components coming soon.

Contribution
============

We are grateful for any valuable contribution, like [issue reports](https://github.com/fraunhoferfokus/node-hbbtv/issues),
[tests](https://github.com/fraunhoferfokus/node-hbbtv/tree/master/test) or [pull requests](https://github.com/fraunhoferfokus/node-hbbtv/pulls).

Moreover, we would love to hear which exciting apps you have created using the `hbbtv` Node.js module.

License
=======

Free for non commercial use released under the GNU Lesser General Public License v3.0, See LICENSE file.

Contact us for commercial use <famecontact@fokus.fraunhofer.de>

Copyright (c) 2015 [Fraunhofer FOKUS](https://www.fokus.fraunhofer.de/)

Contact
=======

* [Fraunhofer FOKUS - Competence Center FAME // Future Applications and Media](http://www.fokus.fraunhofer.de/fame)
* <famecontact@fokus.fraunhofer.de>

[hbbtv20spec]: http://www.hbbtv.org/wp-content/uploads/2015/07/HbbTV-SPEC20-00023-001-HbbTV_2.0.1_specification_for_publication_clean.pdf
[dial-reg]: http://www.dial-multiscreen.org/dial-registry/namespace-database#TOC-Registered-Names
