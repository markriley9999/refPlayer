var playerUI = {};
 
playerUI.statusTables = {};

playerUI.statusTables = [
	{
		videoElId 	: "playerUI-mainContent",
		tableElId 	: "status-table-body0",
		entries 	: ["Play", "Buffer", "Pos", "Play trans"]
	},
	{
		videoElId 	: "playerUI-video0",
		tableElId 	: "status-table-body1",
		entries 	: ["Play", "Buffer", "Play trans"]
	},
	{
		videoElId 	: "playerUI-video1",
		tableElId 	: "status-table-body2",
		entries 	: ["Play", "Buffer", "Play trans"]
	}
];

window.onload = function () {
	try {
		playerUI.start();
	} catch (error) {
		this.Log.error("FATAL ERROR: " + error.message);
	}
}

playerUI.start = function () {
	var mainVideo;
	var that 		= this;
	var confManager = null;
	
	this.Log.init(document.getElementById("log"));
	this.Log.info("app loaded");

	this.statusTables.forEach(function(statTable) {
		that.setupStatusTable(statTable);
	});
};

playerUI.setupStatusTable = function (tableInfo) {
	var tableBody = document.getElementById(tableInfo.tableElId);
	
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

playerUI.updateBufferBars = function() {
	this.updateBufferBar("playerUI-mainContent");
	this.updateBufferBar("playerUI-video0");
	this.updateBufferBar("playerUI-video1");
} 

playerUI.updateBufferBar = function(playerId) {
	var playerBuffer 	= document.getElementById(playerId + "-bufferBar");
	var headroomBuffer 	= document.getElementById(playerId + "-headroomBar");
	var player 			= document.getElementById(playerId);
	var buffer 			= player.buffered;
	var duration 		= player.duration;
	var offset;
	
	if (player.paused) {
		playerBuffer.setAttribute("class", "bufferBar");
		headroomBuffer.setAttribute("class", "bufferBar");		
	} else {
		playerBuffer.setAttribute("class", "bufferBarActive");	
		headroomBuffer.setAttribute("class", "bufferBarActive");	
	}
	
	offset = (player.paused) ? 0 : player.currentTime;
	
	if (duration && (duration > 0)) {
		playerBuffer.max = duration;
		headroomBuffer.max = 60; // (duration < 60) ? duration : 60;

		if ((buffer.length > 0) && (player.currentTime < player.duration) /* !player.ended */) {
			playerBuffer.value = buffer.end(buffer.length-1);
			headroomBuffer.value = buffer.end(buffer.length-1) - offset;
		} else {
			playerBuffer.value = 0;			
			headroomBuffer.value = 0;			
		}
	} else
	{
		playerBuffer.value = 0;	
		playerBuffer.max = 60;	
		headroomBuffer.value = 0;	
		headroomBuffer.max = 60;	
	}
}

playerUI.updatePlaybackBar = function(playerId) {
	var playerBar 		= document.getElementById("playbackBar");
	var player 			= document.getElementById(playerId);
	var duration 		= player.duration;
	
	if (duration && (duration > 0)) {
		playerBar.max = duration;
		playerBar.value = player.currentTime;
	} else
	{
		playerBar.value = 0;	
		playerBar.max = 100;	
	}
}

playerUI.showBufferingIcon = function (bBuffering) {
	if (this.bShowBufferingIcon != bBuffering) {
		var bufferingIcon = document.getElementById("player-buffering");
		
		this.bShowBufferingIcon = bBuffering;
			
		if (bBuffering) {
				bufferingIcon.setAttribute("class", "playerBufferingIcon rotate");
		} else {
				bufferingIcon.setAttribute("class", "playerBufferingIcon");			
		}			
	}
}

playerUI.setPlayingState = function (state) {
	for (var s in this.playIconTable) {
		var playEl = document.getElementById(this.playIconTable[s].icon);
		if (playEl) {
			if (this.playIconTable[s].state === state) {
				playEl.style.display = "block";
			} else {
				playEl.style.display = "none";				
			}
		}
	}
}

playerUI.statusTableText = function (playerId, textEntry, text) {
	var tableEntry = document.getElementById("e_" + playerId + "_" + textEntry);
	if (tableEntry) tableEntry.innerHTML = text;
}

playerUI.Log = {};

playerUI.Log.init = function (logDiv) {
	var level = this.getCookie("loglevel");
	
	this.logStr = "\nLog\n";
	this.logStr += "---------------------\n\n";
		
	this.lastLogTime 	= Date.now();
	this.logStr 		= "";
	this._logCount 		= 0;
	this.maxLogEntries 	= 26;

	level = (level != "") ? level : this.level.INFO;
	
	this._div = logDiv;
	this.setLevel(level);
};

playerUI.Log.getCookie = function (cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

playerUI.Log.setCookie = function (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

playerUI.Log.error = function (message) {
  if (this.currentLevel < this.level.ERROR) return;
  this._write("ERROR: " + message, "error");
};

playerUI.Log.warn = function (message) {
  if (this.currentLevel < this.level.WARN) return;
  this._write("WARN: " + message, "warn");
};

playerUI.Log.info = function (message) {
  if (this.currentLevel < this.level.INFO) return;
  this._write("INFO: " + message, "info");
};

playerUI.Log.debug = function (message) {
  if (this.currentLevel < this.level.DEBUG) return;
  this._write("DEBUG: " + message, "debug");
};

playerUI.Log.setLevel = function (level) {
  this.currentLevel = level;

  this.setCookie("loglevel", level, 28);
  
  this.info("log level set to " + level);
};

playerUI.Log._write = function(message, cssClass) {
	var log, nextLog, logText;
	
	logText = this._logCount + ":" + message;

	logText = logText.substring(0, 110);
	
	if (this._logCount < this.maxLogEntries) {
		log = document.createElement("p");
		log.setAttribute("id", "log_" + this._logCount);
		log.setAttribute("class", cssClass);

		log.innerHTML = logText;
		this._div.appendChild(log);
	} else {
		for (var i = 0; i < (this.maxLogEntries-1); i++) {
			log 	= document.getElementById("log_" + i);
			nextLog = document.getElementById("log_" + (i + 1));
			log.innerHTML = nextLog.innerHTML;
			log.setAttribute("class", nextLog.getAttribute("class"));
		}
		log = document.getElementById("log_" + (this.maxLogEntries - 1));
		log.innerHTML = logText;
		log.setAttribute("class", cssClass);
	}
	this._logCount++;
};

playerUI.Log.getStr = function() {
	return this.logStr + "\n\n";
}

playerUI.Log.level = {
  ERROR: 	1,
  WARN: 	2,
  INFO: 	3,
  DEBUG: 	4
};

const ipc = require('electron').ipcRenderer; // Picks up messages sent through electrons internal IPC functions
 
// listen for the async-body event
ipc.on('ipc-log', function(event, message) {
	playerUI.Log._write(message.logText, message.cssClass);
	console.log(message.logText);
});
