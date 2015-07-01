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
program.version("0.0.1")
    .allowUnknownOption(false)
    .option("-m, --mode <mode>", "select mode. It is either 'terminal' to start as HbbTV Terminal or 'cs' to start as Companion Screen", /^(terminal|cs)$/i)
    .option("-p, --port <port>", "specify the port number of the HbbTV Terminal or CS Launcher. e.g. 8080",parseInt)

program.parse(process.argv);
var port = program.port>0 && program.port || null;
var mode = program.mode || null;
if(port){
    global.PORT = port;
    if(mode == "terminal"){
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