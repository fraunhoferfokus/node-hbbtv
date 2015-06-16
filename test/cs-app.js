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
        var app2appRemoteBaseUrl = "ws://10.147.175.140:8080/remote/" ;
        var appEndpoint = "org.mychannel.myapp";
        var ws = new WebSocket(app2appRemoteBaseUrl + appEndpoint);
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
            if (evt.data == "pairingcomplete") {
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
    }
    run();
})();

