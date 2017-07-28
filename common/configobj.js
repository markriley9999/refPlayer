// Config functions
var CONFIG = function () {
 
	var self = this;
	var props = {};
	
	var THROTTLE = {
	  NONE 	: 	{value: 0, name: "None"}, 
	  1MBPS : 	{value: 1, name: "1mbps"}, 
	  2MBPS : 	{value: 2, name: "2mbps"}, 
	  4MBPS : 	{value: 4, name: "4mbps"}, 
	  8MBPS : 	{value: 8, name: "8mbps"}
	};
	
	props.throttle = THROTTLE.NONE;
	
	self.getNetworkThrottle = function () {
		return props.throttle;
	}

	self.setNetworkThrottle = function (v) {
		props.throttle = v;
	}


	var NETERRS = {
	  NONE 		: 	{value: 0, 		name: "None"}, 
	  1IN10 	: 	{value: 10, 	name: "1in10"}, 
	  1IN100 	: 	{value: 100,  	name: "1in100"}, 
	  1IN1000 	: 	{value: 1000, 	name: "1in1000"}, 
	};
	
	props.networkErrors = NETERRS.NONE;
	
	self.getNetworkErrors = function () {
		return props.networkErrors;
	}

	self.setNetworkErrors = function (v) {
		props.networkErrors = v;
	}

	
	var DELAYLICENSE = {
	  NONE 		: 	{value: 0, 		name: "None"}, 
	  10MS 		: 	{value: 10, 	name: "10ms"}, 
	  100MS		: 	{value: 100, 	name: "100ms"}, 
	  1000MS 	: 	{value: 1000, 	name: "1000ms"}, 
	  5000MS 	: 	{value: 5000, 	name: "5000ms"}, 
	};
	
	props.delayLicense = DELAYLICENSE.NONE;
	

	self.getDelayLicense = function () {
		return props.delayLicense;
	}

	self.setDelayLicense = function (v) {
		props.delayLicense = v;
	}

	
	self._getProps = function () {
		return props;
	}
	
	self._setProps = function (p) {
		props = p;
	}
}


if (typeof module !== 'undefined') {
	module.exports = CONFIG;
	//console.log("- export: CONFIG");
}

