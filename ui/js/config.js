const remote = require('electron').remote;

e = function(id) {
	return document.getElementById(id);
} 

window.onload = function () {
	var li;
	
	li = document.getElementsByClassName("titleitem");
	for (var i = 0;  i < li.length; i++) {
		li[i].onclick = onClickMenu(li[i].id);
	}
}

onClickMenu = function (id) {
	return function () {
		var window = remote.getCurrentWindow();
		window.close();
 	}
}

// listen for the ipc events
const ipc = require('electron').ipcRenderer; // Picks up messages sent through electrons internal IPC functions
 
ipc.on('ipc-xyz', function(event, message) {
	try {
	} catch(err) {
		console.log("ipc-xyz: message parse error. " + err.message);
		return;
	}
	
});
