// Utility functions
var utils = {};

utils.getUrlVars = function () {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}

utils.extractDevName = function (sUA) {
	var arr = sUA.match(/\bFVC\/[0-9]+.[0-9]+ \((\w*);(\w*)/) || ["", "Unknown", "Model"]; 
	return arr[1] + arr[2];
}
