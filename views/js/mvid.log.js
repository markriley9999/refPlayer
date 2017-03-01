mVid.Log = {};

mVid.Log.init = function (logDiv) {
	this.lastLogTime 	= Date.now();
};

mVid.Log.error = function (message) {
	this._write("ERROR: " + message, "error");
};

mVid.Log.warn = function (message) {
	this._write("WARN: " + message, "warn");
};

mVid.Log.info = function (message) {
	this._write("INFO: " + message, "info");
};

mVid.Log.debug = function (message) {
	this._write("DEBUG: " + message, "debug");
};

mVid.Log._write = function(message, cssClass) {
	var log, nextLog, logText, elapsedTime;
	
	elapsedTime = ("000000" + (Date.now() - this.lastLogTime)).slice(-6);
	this.lastLogTime = Date.now();
	
	logText = elapsedTime + "ms:" + message;

	var out = "cssClass=" + cssClass + "&";
	out += "logText=" + logText;
	
	// send a xhr/ajax POST request with the serialized media events
	var xhttp = new XMLHttpRequest();
	xhttp.open("POST", "/tel", true);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
	xhttp.send(out);
};
