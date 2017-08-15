// Utility functions
var UTILS = function () {
 
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

	self.createContentIdQueryString = function () {
		return "contid=" + self.createContentId();
	}

	self.createContentId = function () {
		var d = new Date();
		
		return "ProgrammeT" + d.getUTCHours() + "H";			
	}
	
	self.basename = function (n) { 
		return n.replace(/^(.*[/\\])?/, '').replace(/(\.[^.]*)$/, ''); 
	}
	
	self.noSuffix = function (n) { 
		return n.replace(/(\.[^.]*)$/, ''); 
	}
}

if (typeof module !== 'undefined') {
	module.exports = UTILS;
	//console.log("- export: UTILS");
}

