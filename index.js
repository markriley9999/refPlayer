const electron = require('electron');   // include electron
const electronApp = electron.app;                // give access to electron functions
 
const browserWindow = electron.BrowserWindow;   // electron window functions
const ipc = electron.ipcMain;                   // talk between the electron threads
 
const path = require('path'); // used by electron to load html files
const url = require('url');   // used by electron to load html files
 
const express = require('express');         // Includes the Express source code
const bodyParser = require('body-parser');  // Express middle-ware that allows parsing of post bodys
 
let mainwindow;      // main window variable
var expressServer = express(); // Active express object
 
var server = require('http').createServer(expressServer); // use the electron server to create a sockets io server
var io = require('socket.io')(server);          // create the sockets io server
 
ipc.on('player-control', function(event, message) { // listens for the player-control message from the update.js file
    if (message === 'play') {
        io.sockets.emit('play');        // send a play message to all clients
    } else if (message === 'pause') {
        io.sockets.emit('pause');       // send a pause message to all clients
    }
})
 
function createWindow() {
    mainwindow = new browserWindow({width: 800, height: 600}); // initalize the main gui window
 
    mainwindow.loadURL(url.format({ // load the html file that acts as the ui
        pathname: path.join(__dirname, 'ui/ui.html'),
        protocol: 'file:',
        slashes: true
    }));
 
    mainwindow.on('closed', function() { // reset the window object when it is closed
        mainwindow = null;
    });
}
 
electronApp.on('ready', createWindow); // when the application is ready create the mainwindow
 
electronApp.on('window-all-closed', function() { // if this is running on a mac closing all the windows does not kill the application
    if (process.platform !== 'darwin')
        electronApp.quit();
});
 
expressServer.on('activate', function() { // the application is focused create the mainwindow
    if (mainwindow === null)
        createWindow();
});
 
io.sockets.on('connection', function(socket) { // listen for a device connection to the server
    console.log(" ---> Device connencted");
});
 
expressServer.use(express.static('public')); // put static files in the public folder to make them available on web pages
expressServer.use(bodyParser.urlencoded({ extended: false })); // Tells express to use body parser

expressServer.use(express.static('views'));
expressServer.use('/css', express.static('views/css'));
expressServer.use('/js', express.static('views/js'));
 
expressServer.get('/test', function(req, res) {
    res.setHeader('Content-Type', 'application/json'); // Tells the browser that the response is JSON
    res.send('[{"Test": "Hello, World!"}]');           // Send a JSON string
});
 
expressServer.post('/tel', function(req, res) {
    mainwindow.webContents.send('async-body', req.body); // send the async-body message to the rendering thread
	console.log(req.body);
    res.send(); // Send an empty response to stop clients from hanging
});
 
server.listen(3000); // Socket.io port (hides express inside)
