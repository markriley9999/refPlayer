const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer; 
 

var commonConfig = new CONFIG();

e = function(id) {
	return document.getElementById(id);
} 

window.onload = function () {
	var li;
	
	li = document.getElementsByClassName("titleitem");
	for (var i = 0;  i < li.length; i++) {
		li[i].onclick = onClickMenu(li[i].id);
	}
	
	ipc.send("ipc-get-config");
}

onClickMenu = function (id) {
	return function () {
		var window = remote.getCurrentWindow();
		window.close();
 	}
}

updateUI = function () {

	setCheck = function (f,n) {
		var c;
		
		for (var i = 0; i < f.children.length; i++) {
			c = f.children[i];
			if ((c.nodeName === "INPUT") && (c.value === n)) {
				c.checked = true;
				break;
			}
		}		
	}
	
	var throttle = commonConfig.getNetworkThrottle();
	var networkErrors = commonConfig.getNetworkErrors();
	var delayLicense = commonConfig.getDelayLicense();
	
	setCheck(e("THROTTLE"), throttle.name);
	setCheck(e("NETERRS"), networkErrors.name);
	setCheck(e("DELAYLICENSE"), delayLicense.name);
}

selectOption = function (obj, f) {
		//console.log(obj.value);
		if (f) { 
			f(obj.value);
			ipc.send("ipc-set-config", commonConfig._getProps());
		}
}
// listen for the ipc events
ipc.on('ipc-send-config', function(event, message) {
	try {
		commonConfig._setProps(message);
		updateUI();
	} catch(err) {
		console.log("ipc-send-config: message parse error. " + err.message);
		return;
	}
	
});
