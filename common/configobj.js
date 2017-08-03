// Config functions
var CONFIG = function () {
 
	var self = this;
	var props = {};
	
	self.THROTTLE = {
	  NONE 	: 	{value: 0, name: "None"}, 
	  T1MBPS : 	{value: 1, name: "1mbps"}, 
	  T2MBPS : 	{value: 2, name: "2mbps"}, 
	  T4MBPS : 	{value: 4, name: "4mbps"}, 
	  T8MBPS : 	{value: 8, name: "8mbps"}
	};
	
	props.throttle = self.THROTTLE.NONE;
	
	self.getNetworkThrottle = function () {
		return props.throttle;
	}

	self.setNetworkThrottle = function (v) {
		props.throttle = v;
	}

	self.setNetworkThrottleByName = function (n) {
		
		for (var k in self.THROTTLE) {
			if ((self.THROTTLE.hasOwnProperty(k)) && (self.THROTTLE[k].name === n)) {
				props.throttle = self.THROTTLE[k];
				break;
			}
		}
	}


	self.NETERRS = {
	  NONE 		: 	{value: 0, 		name: "None"}, 
	  E1IN10 	: 	{value: 10, 	name: "1in10"}, 
	  E1IN100 	: 	{value: 100,  	name: "1in100"}, 
	  E1IN1000 	: 	{value: 1000, 	name: "1in1000"}, 
	};
	
	props.networkErrors = self.NETERRS.NONE;
	
	self.getNetworkErrors = function () {
		return props.networkErrors;
	}

	self.setNetworkErrors = function (v) {
		props.networkErrors = v;
	}

	self.setNetworkErrorsByName = function (n) {
		
		for (var k in self.NETERRS) {
			if ((self.NETERRS.hasOwnProperty(k)) && (self.NETERRS[k].name === n)) {
				props.networkErrors = self.NETERRS[k];
				break;
			}
		}
	}
	
	self.DELAYLICENSE = {
	  NONE 		: 	{value: 0, 		name: "None"}, 
	  D10MS 	: 	{value: 10, 	name: "10ms"}, 
	  D100MS	: 	{value: 100, 	name: "100ms"}, 
	  D1000MS 	: 	{value: 1000, 	name: "1000ms"}, 
	  D5000MS 	: 	{value: 5000, 	name: "5000ms"}, 
	};
	
	props.delayLicense = self.DELAYLICENSE.NONE;
	

	self.getDelayLicense = function () {
		return props.delayLicense;
	}

	self.setDelayLicense = function (v) {
		props.delayLicense = v;
	}

	self.setDelayLicenseByName = function (n) {
		
		for (var k in self.DELAYLICENSE) {
			if ((self.DELAYLICENSE.hasOwnProperty(k)) && (self.DELAYLICENSE[k].name === n)) {
				props.delayLicense = self.DELAYLICENSE[k];
				break;
			}
		}
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

