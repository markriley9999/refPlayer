const electron = require('electron');   // include electron
const electronApp = electron.app;                // give access to electron functions
 
const browserWindow = electron.BrowserWindow;   // electron window functions
const ipc = electron.ipcMain;                   // talk between the electron threads
 
const path = require('path'); // used by electron to load html files
const url = require('url');   // used by electron to load html files
 
const express = require('express');         // Includes the Express source code
const bodyParser = require('body-parser');  // Express middle-ware that allows parsing of post bodys

const fs = require('fs');
 
let winMain 	= null;      // main window variable
let winGraphs	= null;     // graph window variable
let winSGraph	= null;
let winAdTrans	= null;

var expressServer = express(); // Active express object
 
var server = require('http').createServer(expressServer); // use the electron server to create a sockets io server
var io = require('socket.io')(server);          // create the sockets io server
 
var connectedDevices = 0;

ipc.on('player-control', function(event, message) { // listens for the player-control message from the update.js file
    if (message === 'play') {
        io.sockets.emit('play');        // send a play message to all clients
    } else if (message === 'pause') {
        io.sockets.emit('pause');       // send a pause message to all clients
    }
})

function createWindow(winObj, uiurl, w, h) {
	if (!winObj) {
		obj = new browserWindow({width: w, height: h}); 
	 
		obj.loadURL(url.format({ 
			pathname: path.join(__dirname, uiurl),
			protocol: 'file:',
			slashes: true
		}));
	 
		obj.on('closed', function() { // reset the window object when it is closed
			obj = null;
		});
		
		return obj;
	} else {
		return winObj;
	}
}
 
function createWindows() {
	winMain 	= createWindow(winMain,		'ui/ui.html',			1200,	640);
	winGraphs 	= createWindow(winGraphs,	'ui/graph.html',		1200,	700);
	winSGraph 	= createWindow(winSGraph, 	'ui/singlegraph.html', 	800, 	800);
	winAdTrans	= createWindow(winAdTrans, 	'ui/adtransgraph.html', 800, 	800);
}
 
electronApp.on('ready', createWindows); // when the application is ready create the winMain
 
electronApp.on('window-all-closed', function() { // if this is running on a mac closing all the windows does not kill the application
    if (process.platform !== 'darwin')
        electronApp.quit();
});
 
expressServer.on('activate', function() { // the application is focused create the winMain
    //if (winMain === null && winGraphs === null && winSGraph === null)
        // createWindows();
});
 
io.sockets.on('connection', function(socket) { // listen for a device connection to the server
	connectedDevices++;

    console.log(" ---> Device connected: " + connectedDevices);
	
	socket.on('bufferEvent', function(data) {
		if (winMain) {
			winMain.webContents.send('ipc-buffer', data);
		}
		if (winGraphs) {
			winGraphs.webContents.send('ipc-buffer', data);
		}
		if (winSGraph) {
			winSGraph.webContents.send('ipc-buffer', data);
		}
		//console.log(data);
	});
	
	socket.on('playbackOffset', function(data) {
		if (winMain) {
			winMain.webContents.send('ipc-playbackOffset', data);
		}
		//console.log(data);
	});
	
	socket.on('disconnect', function () {
		if (connectedDevices > 0) {
			connectedDevices--;
		}
		
		console.log(" ---> Device disconnected: " + connectedDevices);
	});
});

expressServer.use(express.static('public')); // put static files in the public folder to make them available on web pages
expressServer.use(bodyParser.urlencoded({ extended: false })); // Tells express to use body parser
expressServer.use(bodyParser.text({type: 'text/plain'})); // Tells express to use body parser

//expressServer.use(express.static('views'));
expressServer.use('/css', express.static('views/css'));
expressServer.use('/bitmaps', express.static('views/bitmaps'));
expressServer.use('/js', express.static('views/js'));
 
expressServer.set('view-engine', 'hbs'); 

expressServer.post('/log', function(req, res) {
	if (winMain) {
		winMain.webContents.send('ipc-log', req.body); // send the async-body message to the rendering thread
	}
	//console.log(req.body);
    res.send(); // Send an empty response to stop clients from hanging
});
 
expressServer.post('/status', function(req, res) {
	if (winMain) {
		winMain.webContents.send('ipc-status', req.body); // send the async-body message to the rendering thread
	}
	//console.log(req.body);
    res.send(); // Send an empty response to stop clients from hanging
});

expressServer.post('/adtrans', function(req, res) {
	if (winAdTrans) {
		winAdTrans.webContents.send('ipc-adtrans', req.body); // send the async-body message to the rendering thread
	}
	console.log(req.body);
    res.send(); // Send an empty response to stop clients from hanging
});

expressServer.get('/', function(req, res) {
	if (connectedDevices === 0) {
		createWindows();
		
		if (winMain) 	winMain.reload();
		if (winGraphs) 	winGraphs.reload();
		if (winSGraph) 	winSGraph.reload();
		if (winAdTrans) winAdTrans.reload();
		
		res.render('index.hbs', function(err, html) { // render the dash playback file using the title and src variables to setup page
			res.status(200);
			res.send(html);
			//console.log("UserAgent: " + req.headers['user-agent']);
			//console.log(JSON.stringify(req.headers));
		});
	} else {
			res.status(503);
			res.send("Sorry, another device is already attached.  Please disconnect it and try again.");	
	}
});
 
expressServer.post('/savelog', function(req, res) {
	console.log("/savelog: " + req.query.filename);
    res.send(); // Send an empty response to stop clients from hanging

	fs.writeFile("/logs/" + req.query.filename, req.body, function(err) {
		if(err) {
			console.log(err);
		}
	});
});
 
server.listen(3000); // Socket.io port (hides express inside)

