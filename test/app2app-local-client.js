/**
 * Created by lba on 16/06/15.
 */

(function(){
    // this example code works in Node.js and Browser.
    if(typeof window == "undefined"){
        // we are in Node.js. import required modules
        var hbbtv = require("../index.js");
        WebSocket = hbbtv.WebSocket;
    }
    var run = function(){
        var app2appLocalBaseUrl = "ws://localhost:8080/local/" ;
        var appEndpoint = "org.mychannel.myapp";
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
                if (evt.data == "pairingcomplete") {
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
                    createConnection(index+1);
                } else {
                    console.log("Unexpected message received from terminal.");
                    ws.close();
                }
            };
        };
        createConnection(0);
    };
    run();
})();