/*global google */
/*eslint no-console: "off"*/

var playerUI = {};
 
playerUI.statusTables = {};

playerUI.statusTables = [
    {
        videoElId   : "mVid-mainContent",
        tableElId   : "status-table-body0",
        entries     : ["Play", "Buffer", "Pos", "Play trans"]
    },
    {
        videoElId   : "mVid-video0",
        tableElId   : "status-table-body1",
        entries     : ["Play", "Buffer", "Play trans"]
    },
    {
        videoElId   : "mVid-video1",
        tableElId   : "status-table-body2",
        entries     : ["Play", "Buffer", "Play trans"]
    }
];

function e(id) {
    return document.getElementById(id);
}

window.onload = function () {
    try {
        playerUI.start();
    } catch (error) {
        console.log("FATAL ERROR: " + error.message);
    }
};

playerUI.start = function () {
    var that        = this;
    var li;
    
    this.Log.init(e("log"));

    this.statusTables.forEach(function(statTable) {
        that.setupStatusTable(statTable);
    });
    
    li = document.getElementsByClassName("titleitem");

    function onClickMenu(id) {
        return function () {
            ipc.send("ipc-openwindow", id);
        };
    }

    for (var i = 0;  i < li.length; i++) {
        li[i].onclick = onClickMenu(li[i].id);
    }
    
    ipc.send("ipc-get-connectionstatus");
};

playerUI.setupStatusTable = function (tableInfo) {
    var tableBody = e(tableInfo.tableElId);
    
    for (var i in tableInfo.entries) {
        var row = document.createElement("tr");
        var eventNameTd = document.createElement("td");
        eventNameTd.innerHTML = tableInfo.entries[i] + ": ";
        row.appendChild(eventNameTd);

        var countTd = document.createElement("td");
        countTd.setAttribute("id", "e_" + tableInfo.videoElId + "_" + tableInfo.entries[i]);
        countTd.innerHTML = "---";
        row.appendChild(countTd);

        tableBody.appendChild(row);
    }
};

playerUI.setPlayingState = function (state) {
    for (var s in this.playIconTable) {
        var playEl = e(this.playIconTable[s].icon);
        if (playEl) {
            if (this.playIconTable[s].state === state) {
                playEl.style.display = "block";
            } else {
                playEl.style.display = "none";              
            }
        }
    }
};

playerUI.Log = {};

playerUI.Log.init = function (logDiv) {
    this._logCount = 0;
    this._div = logDiv;
};

playerUI.Log._write = function(message, cssClass) {
    var log, logText;
    
    logText = this._logCount + ":" + message;

    log = document.createElement("p");
    log.setAttribute("id", "log_" + this._logCount);
    log.setAttribute("class", cssClass);

    log.innerHTML = logText;
    this._div.appendChild(log);

    this._logCount++;
};

// listen for the ipc events
const ipc = require("electron").ipcRenderer; // Picks up messages sent through electrons internal IPC functions
 
ipc.on("ipc-log", function(event, message) {
    playerUI.Log._write(message.logText, message.cssClass);
    //console.log(message.logText);
});

ipc.on("ipc-status", function(event, message) {
    var t = e(message.id);
    if (t) t.innerHTML = message.text;
    //console.log(message.id + " " + message.text);
});

ipc.on("ipc-buffer", function(event, message) {
    try {
        var msgObj = JSON.parse(message.toString("utf8")); 
        var pbObj = msgObj.playerBufferObj;
        var hbObj = msgObj.headroomBufferObj;
        var playerId = pbObj.id;
    } catch(err) {
        console.log("ipc-buffer: message parse error. " + err.message);
        return;
    }
    
    //console.log(message);
    
    
    var playerBuffer    = e(playerId + "-bufferBar");
    var headroomBuffer  = e(playerId + "-headroomBar");

    playerBuffer.setAttribute("class", pbObj.class);
    headroomBuffer.setAttribute("class", hbObj.class);      

    playerBuffer.value      = pbObj.value;  
    playerBuffer.max        = pbObj.max;    
    headroomBuffer.value    = hbObj.value;  
    headroomBuffer.max      = hbObj.max;    
});

ipc.on("ipc-playbackOffset", function(event, message) {
    var playerBar = e("playbackBar");

    try {
        var msgObj = JSON.parse(message.toString("utf8")); 

        playerBar.max = msgObj.max;
        playerBar.value = msgObj.value;
    } catch(err) {
        console.log("ipc-playbackOffset: message parse error. " + err.message); 
    }
});

ipc.on("ipc-connected", function(event, message) {
    try {
        //var msgObj = JSON.parse(message.toString('utf8')); 

        console.log("connected: " + message);
        e("connected").setAttribute("class", message.bConnected ? "connected" : "");
        e("connected").innerHTML = message.bConnected ? "Connected" : "Not Connected";
        //e("serverip").innerHTML = "Server Address: " + message.serverIP;
        e("devname").innerHTML = "Device Name: " + message.devName;

        playerUI.Log._write("  Server (IPv4) Addresses", "info");
        
        for( var i = 0; i < message.addresses.length; i++) {
            playerUI.Log._write("  NET " + i + ": " + message.addresses[i], "info");
        }

        playerUI.Log._write("  URLs:", "info");
        playerUI.Log._write("  http://[server_ip]:" + message.port + "/index.html", "info");
        playerUI.Log._write("  http://[server_ip]:" + message.port + "/player.aitx", "info");
        
        if (message.bHTTPSEnabled) {
            playerUI.Log._write("  https://[server_ip]:" + message.httpsPort + "/index.html", "info");
            playerUI.Log._write("  https://[server_ip]:" + message.httpsPort + "/player.aitx", "info");
        }
    
        e("version").innerHTML = message.version;
        
    } catch(err) {
        console.log("ipc-playbackOffset: message parse error. " + err.message); 
    }
});

