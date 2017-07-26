// Utility functions
var utils = function () {
 
	var self = this;
	
	self.getUrlVars = function () {
		var vars = {};
		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
			vars[key] = value;
		});
		return vars;
	}

	self.extractDevName = function (sUA) {
		var arr = sUA.match(/\bFVC\/[0-9]+.[0-9]+ \(\s*(\w*);\s*(\w*)/) || ["", "Unknown", "Model"]; 
		return arr[1] + arr[2];
	}

}

if (typeof module !== 'undefined') {
	module.exports = utils;
	//console.log("- export: utils");
}

