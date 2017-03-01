mVid.Log = {};

mVid.Log.init = function (logDiv) {
	var level = this.getCookie("loglevel");
	
	this.lastLogTime 	= Date.now();
	this._logCount 		= 0;
	this.maxLogEntries 	= 26;

	level = (level != "") ? level : this.level.INFO;
	
	this._div = logDiv;
	this.setLevel(level);
};

mVid.Log.getCookie = function (cname) {
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

mVid.Log.setCookie = function (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

mVid.Log.error = function (message) {
  if (this.currentLevel < this.level.ERROR) return;
  this._write("ERROR: " + message, "error");
};

mVid.Log.warn = function (message) {
  if (this.currentLevel < this.level.WARN) return;
  this._write("WARN: " + message, "warn");
};

mVid.Log.info = function (message) {
  if (this.currentLevel < this.level.INFO) return;
  this._write("INFO: " + message, "info");
};

mVid.Log.debug = function (message) {
  if (this.currentLevel < this.level.DEBUG) return;
  this._write("DEBUG: " + message, "debug");
};

mVid.Log.setLevel = function (level) {
  this.currentLevel = level;

  this.setCookie("loglevel", level, 28);
  
  this.info("log level set to " + level);
};

mVid.Log._write = function(message, cssClass) {
	var log, nextLog, logText, elapsedTime;
	
	elapsedTime = ("000000" + (Date.now() - this.lastLogTime)).slice(-6);
	this.lastLogTime = Date.now();
	
	logText = this._logCount + ":" + elapsedTime + "ms:" + message;

	logText = logText.substring(0, 110);

	
	var out = JSON.stringify("cssClass=" + cssClass) + "&";
	out += JSON.stringify("logText=" + logText);
	
	// send a xhr/ajax POST request with the serialized media events
	var xhttp = new XMLHttpRequest();
	xhttp.open("POST", "/tel", true);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
	xhttp.send(out);

	
	
	
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

mVid.Log.level = {
  ERROR: 	1,
  WARN: 	2,
  INFO: 	3,
  DEBUG: 	4
};