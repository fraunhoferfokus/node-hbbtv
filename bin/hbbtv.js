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
var program = require("commander");
var package = require("../package.json");
program.version(package.version)
    .allowUnknownOption(false)
    .option("-m, --mode <mode>", "select mode. It is either 'terminal' to start as HbbTV Terminal or 'cs' to start as Companion Screen", /^(terminal|cs)$/i)
    .option("-p, --port <port>", "specify the port number of the HbbTV Terminal or CS Launcher. e.g. 8080",parseInt)
    .option("-i, --interdevsync-url <url>", "specify the URL of the inter-device synchronisation CSS-CII server. Applies to 'terminal' mode only. Optional.")
    .option("-u, --useragent <ua-string>", "specify the user agent string to be advertised. Applies to 'terminal' mode only. Optional.")
    .option("-o, --opn-args <args>",  "specify the arguments to opn (used for launching apps), separated by | characters. e.g. firefox|-no-remote. Optional.")

program.parse(process.argv);
var port = program.port>0 && program.port || null;
var mode = program.mode || null;
var interDevSyncUrl = program["interdevsyncUrl"] || null;
var userAgent = program["useragent"] || null;
var opn_params = program["opnArgs"] ? program["opnArgs"].split('|') : undefined;

if(port){
    global.PORT = port;
    global.OPN_PARAMS = opn_params;
    if(mode == "terminal"){
        global.INTERDEVSYNC_URL = interDevSyncUrl;
        global.USERAGENT = userAgent;
        require("./start-terminal.js");
    }
    else if(mode == "cs"){
        require("./start-cs.js");
    }
    else {
        program.help();
    }
}
else{
    program.help();
}