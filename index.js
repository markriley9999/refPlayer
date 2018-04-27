const os = require("os");
const ip = require("ip");
const fs = require('fs');
const chalk = require('chalk');

const electron = require('electron');   
const express = require('express');         

const argv = require('minimist')(process.argv.slice(2));

var GUI = null;

if (!argv.headless && !argv.multidevs) {
	GUI = electron.app;
}
	
const browserWindow = electron.BrowserWindow;   
const ipc = electron.ipcMain;                   
 
const path = require('path'); 
const url = require('url');   
 
const bodyParser = require('body-parser');  

const hbs = require('hbs');                 
 
const Throttle = require('stream-throttle').Throttle;

const dateFormat = require('dateformat');

const UTILS = require('./common/utils.js');
var commonUtils = new UTILS();

const CONFIG = require('./common/configobj.js');
var commonConfig = new CONFIG();

const mp4boxModule = require('mp4box');


var win = {};
win['log'] 			= null;
win['allvideoobjs'] = null;
win['mainvideoobj'] = null;
win['ad0videoobj'] 	= null;
win['ad1videoobj']	= null;
win['adtrans']		= null;
win['config']		= null;


var expressSrv = express(); // Active express object

var generalInfo = {
	port				: 0,
	bHTTPSEnabled		: false,
	httpsPort			: 0,
	serverAddresses 	: [],
	connectedDevices	: 0,
	currentDeviceUA 	: "",
	devName 			: "",
	version				: require("./version.json")
};


var http = require('http').createServer(expressSrv);
var https;

try {
	const httpsOpts = {
	  key: fs.readFileSync('ssl/server/private/refPlayer.key.pem'),
	  cert: fs.readFileSync('ssl/server/certs/refPlayer.cert.pem')
	};
	generalInfo.bHTTPSEnabled = true;
	https = require('https').createServer(httpsOpts, expressSrv); 
} catch (error) {
	https = require('https').createServer(expressSrv); 
}


const ioLib = require('socket.io');

var ioHttp 	= ioLib(http);
var ioHttps = ioLib(https);        
 
 
if (ipc) {
	
	ipc.on('ipc-openwindow', function(event, w) { 
		if (win[w]) {
			win[w].createWindow(); 
			win[w].focusWindow();	
		}
	})

	ipc.on('ipc-get-config', function(event, w) { 
		sendConfig();
	})

	ipc.on('ipc-set-config', function(event, w) { 
		commonConfig._setProps(w);
	})

	ipc.on('ipc-get-connectionstatus', function(event, w) { 
		sendConnectionStatus();
	})

}

function WINDOW(p, uiurl, w, h, r, c, bMax) {
	var self = this;
	
	self.uiurl 	= uiurl;
	self.width 	= w;
	self.height	= h;
	self.winObj = null;
	self.onFocus = r;
	self.onClosed = c;
	
	self.createWindow = function () {

		if (!GUI) {
			return;
		}
		
		if (!self.winObj) {
			self.winObj = new browserWindow({
					parent: p,
					width: self.width, 
					height: self.height, 
					icon: 'ui/bitmaps/tv-512.png'
				}); 
		 
			// TODO: doesn't work :( - see https://github.com/electron/electron/issues/7779
			self.winObj.once('ready-to-show', () => {
				if (self.onFocus) {
					self.onFocus(self.winObj);
				}
			});
			
			self.winObj.on('closed', function() { // reset the window object when it is closed
				console.log("-------");
				if (self.onClosed) {
					self.onClosed(self.winObj);
				}
				self.winObj = null;
			});
			
			if (bMax) {
				self.winObj.maximize();
			}
			
			self.winObj.loadURL(url.format({ 
				pathname: path.join(__dirname, self.uiurl),
				protocol: 'file:',
				slashes: true
			}));	
		}
	}
	
	this.getWin = function() {
		return this.winObj;
	}
	
	this.closeWin = function() {
		if (this.winObj) {
			this.winObj.close();
		}
	}
	
	this.focusWindow = function() {
		if (this.winObj) {
			this.winObj.focus();
		}
	}

	this.sendToWindow = function(ipc, data)
	{
		if (this.winObj) {
			this.winObj.webContents.send(ipc, data);
		}
	}
	
	this.reload = function()
	{
		if (this.winObj) {
			this.winObj.reload();
		}
	}
};

function createWindows() {
	win['log'].createWindow();
	win['allvideoobjs'].createWindow();
	win['mainvideoobj'].createWindow();
	win['ad0videoobj'].createWindow();
	win['ad1videoobj'].createWindow();
	win['adtrans'].createWindow();
	win['config'].createWindow();
}

function mainUIClosed() {
	win['allvideoobjs'].closeWin();
	win['mainvideoobj'].closeWin();
	win['ad0videoobj'].closeWin();
	win['ad1videoobj'].closeWin();
	win['adtrans'].closeWin();
	win['config'].closeWin();
}

var runOptions = {};



function init() {
	var p;
	var v = generalInfo.version;
	
	runOptions.bMultiDevs 	= !GUI;	
	runOptions.bSegDump 	= argv.segdump;
	runOptions.bEventAbs	= argv.eventabs;
	
	
	if (argv.help) {
		console.log("--headless   Run with no GUI.");
		console.log("--segdump    Dump segment information.");
		GUI.quit();
		return;
	}
	
	console.log("--------------------------------------------------");
	console.log(v.title + " v" + v.major + "." + v.minor);
	console.log("--------------------------------------------------");
	console.log("");
	console.log(v.comment);
	console.log("");
	for (var i = 0; i < v.notes.length; i++) {
		console.log(" - " + v.notes[i]);
	}
	console.log("");
	console.log("--------------------------------------------------");
	console.log("");
	
	fs.existsSync("logs") || fs.mkdirSync("logs");
	
	if (!GUI) {
		console.log("--- Headless Mode ---");
	}
	
	if (runOptions.bSegDump) {
		console.log("--- Dump Segment Info ---");
	}
	
	if (runOptions.bEventAbs) {
		console.log(chalk.red("--- Use ABSOLUTE Event Offsets - NOT COMPLIANT!  ---"));
	}

	console.log("");
	
	win['log'] 			= new WINDOW(null,	'ui/ui.html',		1216,	700,	sendConnectionStatus,	mainUIClosed, false);
	
	p = win['log'].getWin();
	
	win['allvideoobjs'] = new WINDOW(p,	'ui/graph.html',		1216,	700,	null, null, false);
	win['mainvideoobj'] = new WINDOW(p,	'ui/singlegraph.html',	1216, 	800,	null, null, false);
	win['ad0videoobj']	= new WINDOW(p,	'ui/graphAdVid0.html', 	1216, 	800,	null, null, false);
	win['ad1videoobj']	= new WINDOW(p,	'ui/graphAdVid1.html', 	1216, 	800,	null, null, false);
	win['adtrans']		= new WINDOW(p,	'ui/adtransgraph.html',	800, 	800,	null, null, false);
	win['config']		= new WINDOW(p,	'ui/config.html',		335, 	650,	null, null, false);

	win['log'].createWindow();
	
	var interfaces = os.networkInterfaces();

	for (var k in interfaces) {
		for (var k2 in interfaces[k]) {
			var address = interfaces[k][k2];
			if (address.family === 'IPv4' && !address.internal) {
				generalInfo.serverAddresses.push(address.address);
			}
		}
	}
	
	console.log("Server (IPv4) Addresses");
	console.log("-----------------------");

	generalInfo.port 		= http.address().port;
	generalInfo.httpsPort 	= https.address().port;

	for( var i = 0; i < generalInfo.serverAddresses.length; i++) {
		console.log(i + ": " + generalInfo.serverAddresses[i]);
	}

	console.log("URLs:");
	console.log("  http://[server_ip]:" + generalInfo.port + "/index.html");
	console.log("  http://[server_ip]:" + generalInfo.port + "/player.aitx");
	if (generalInfo.bHTTPSEnabled) {
		console.log("  https://[server_ip]:" + generalInfo.httpsPort + "/index.html");
		console.log("  https://[server_ip]:" + generalInfo.httpsPort + "/player.aitx");
	}
	
	commonConfig.setNetworkThrottle(commonConfig.THROTTLE.NONE);
	commonConfig.setNetworkErrors(commonConfig.NETERRS.NONE);
	commonConfig.setDelayLicense(commonConfig.DELAYLICENSE.NONE);
}
 
if (GUI) { 
	GUI.on('ready', init); 
	 
	GUI.on('window-all-closed', function() { // if this is running on a mac closing all the windows does not kill the application
		if (process.platform !== 'darwin')
			GUI.quit();
	});
}
	

expressSrv.on('activate', function() {
});

ioHttp.sockets.on('connection', function(s) {
	socketConnect(s);
});

ioHttps.sockets.on('connection', function(s) {
	socketConnect(s);
});
	
const whois = require('whois')

function socketConnect(socket) {
	
	generalInfo.connectedDevices++;

 	generalInfo.devName = commonUtils.extractDevName(generalInfo.currentDeviceUA);
	var UA = socket.request.headers['user-agent'];

    console.log(" ---> Device connected (" + generalInfo.connectedDevices + ") IP: " + socket.handshake.address + " UA: " + UA);
	if (runOptions.bMultiDevs) {
		whois.lookup(socket.handshake.address, function(err, data) {
			console.log(chalk.blue(data))
		})
	}
	
	sendConnectionStatus();
	
	socket.on('bufferEvent', function(data) {
		win['log'].sendToWindow('ipc-buffer', data);
		win['allvideoobjs'].sendToWindow('ipc-buffer', data);
		win['mainvideoobj'].sendToWindow('ipc-buffer', data);
		win['ad0videoobj'].sendToWindow('ipc-buffer', data);
		win['ad1videoobj'].sendToWindow('ipc-buffer', data);
		
		//console.log(data);
	});
	
	socket.on('playbackOffset', function(data) {
		win['log'].sendToWindow('ipc-playbackOffset', data);
		//console.log(data);
	});
	
	socket.on('disconnect', function () {
		if (generalInfo.connectedDevices > 0) {
			generalInfo.connectedDevices--;
		}
		
		generalInfo.currentDeviceUA = "";
		generalInfo.devName = "";

		sendConnectionStatus();

	console.log(" ---> Device disconnected: " + generalInfo.connectedDevices);
	});
}

expressSrv.use(express.static('public')); // put static files in the public folder to make them available on web pages
expressSrv.use(bodyParser.urlencoded({ extended: false })); 
expressSrv.use(bodyParser.text({type: 'text/plain'})); 
expressSrv.use(bodyParser.json());

//expressSrv.use(express.static('views'));
expressSrv.use('/common', express.static('common'));
expressSrv.use('/css', express.static('views/css'));
expressSrv.use('/bitmaps', express.static('views/bitmaps'));
expressSrv.use('/js', express.static('views/js'));
expressSrv.use('/playlists', express.static('playlists'));
  
expressSrv.set('view-engine', 'hbs'); 

expressSrv.post('/log', function(req, res) {
	win['log'].sendToWindow('ipc-log', req.body); // send the async-body message to the rendering thread
	//console.log(req.body);
    res.send(); // Send an empty response to stop clients from hanging
});

function sendServerLog(msg) {
	var logObj = { 
					'cssClass': 'debug', 
					'logText': 	" - server: " + msg + " ---"
				 };
				 
	console.log(chalk.yellow(msg));
	win['log'].sendToWindow('ipc-log', logObj); 
} 

expressSrv.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Max-Age', '1');

    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

	next();
});

expressSrv.post('/status', function(req, res) {
	win['log'].sendToWindow('ipc-status', req.body); // send the async-body message to the rendering thread
	//console.log(req.body);
    res.send(); // Send an empty response to stop clients from hanging
});

expressSrv.post('/adtrans', function(req, res) {
	win['adtrans'].sendToWindow('ipc-adtrans', req.body); // send the async-body message to the rendering thread
	//console.log(req.body);
    res.send(); // Send an empty response to stop clients from hanging
});

expressSrv.get('/*.html', function(req, res) {
	var UA = req.headers['user-agent'];
	
	if (runOptions.bMultiDevs || !generalInfo.currentDeviceUA || (generalInfo.currentDeviceUA === UA)) {
		generalInfo.currentDeviceUA = UA;
		generalInfo.devName = commonUtils.extractDevName(generalInfo.currentDeviceUA);
		console.log(" ---> App loaded by: " + generalInfo.devName);
		console.log(chalk.blue("   UA: " + UA));
		
		//createWindows();
		
		win['log'].reload();
		win['allvideoobjs'].reload();
		win['mainvideoobj'].reload();
		win['ad0videoobj'].reload();
		win['ad1videoobj'].reload();
		win['adtrans'].reload();
		
		res.render('index.hbs', 
			{version: "v" + generalInfo.version.major + "." + generalInfo.version.minor}, 
			function(err, html) { 
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

expressSrv.get('/player.aitx', function(req, res) {
	var srv = "http" + (req.socket.encrypted ? "s" : "") + "://" + req.headers.host + "/";
	
	// console.log("get ait: " + srv);
	res.render('playerait.hbs', {url: srv}, function(err, html) { 
		res.type("application/vnd.dvb.ait+xml");
		res.status(200);
		// console.log(html);
        res.send(html);
    });
});

const favIcon 	= fs.readFileSync('./views/favicon.ico');

expressSrv.get('/favicon.ico', function(req, res) {
	res.type("image/x-icon");
	res.status(200);
    res.send(favIcon);
});


var mp4box = new mp4boxModule.MP4Box();

expressSrv.get('/content/*', function(req, res) {
	// TODO: Why seeing 2 gets????
	var suffix = req.path.split('.').pop();
	var cType;
	
	if (suffix === "mpd") {
		cType = "application/dash+xml";
	} else {
		cType = "video/mp4";		
	}
	//console.log(" - suffix: " + suffix + " Content-Type: " + cType);
	
	sendServerLog("GET content: " + req.path);
	//console.log(JSON.stringify(req.headers));
	
	if (runOptions.bMultiDevs) {
			var u = req.headers['user-agent'];			
			var d = commonUtils.extractDevName(u);
			
			if (d === "UnknownModel") {
				console.log(chalk.blue("    UA: " + u));
			} else {
				console.log(chalk.blue("    Device: " + d));
				console.log(chalk.blue("       IP: " + req.ip));
			}
	}
	
	// ***** Simulate error condition (505)? *****
	var nErrs = commonConfig.getNetworkErrors();
	
	if (nErrs.value != 0) {
		var rndErr = Math.floor(Math.random() * (nErrs.value - 1));
		
		if (rndErr === 0) {
			// Simulate error (505)
			sendServerLog("SIMULATE ERROR! (505)");
			return res.sendStatus(505);
		}
	}

	// Get file on server
	var file = path.join(__dirname, req.path);
	//console.log(" - file: " + file);
	
    fs.stat(file, function(err, stats) {
		if (err) {
			if (err.code === 'ENOENT') {
				// 404 Error if file not found
				console.log(" * file does not exist");
				return res.sendStatus(404);
			}
			res.end(err);
		}
		
		if (runOptions.bSegDump) {
			var arrayBuffer = new Uint8Array(fs.readFileSync(file)).buffer;
			arrayBuffer.fileStart = 0;

			mp4box.appendBuffer(arrayBuffer);
			console.log(mp4box.getInfo());		
			mp4box.flush();
		}
		
		var range = req.headers.range;

		var start;
		var end;
		var chunksize;
		var total = stats.size;
		var rtn = 200;
		
		if (range) {
			var positions = range.replace(/bytes=/, "").split("-");
			start = parseInt(positions[0], 10);
			end = positions[1] ? parseInt(positions[1], 10) : total - 1;

			console.log(" - range: " + range);
			console.log(" - positions: " + positions);
		} else {
			start = 0;
			end = total - 1;		
		}

		chunksize = (end - start) + 1;

		//console.log(" - total: " + total);

		//console.log(" - start: " + start);
		//console.log(" - end: " + end);
		//console.log(" - chunksize: " + chunksize);

		if ((chunksize+start) < total) {
			rtn = 206;
		} 
		//console.log(" - rtn: " + rtn);
		
		if (start >= end) {
			console.log(" * Error: start >= end!");
			return res.sendStatus(400);				
		}

		res.writeHead(rtn, {
			"Content-Range": "bytes " + start + "-" + end + "/" + total,
			"Accept-Ranges": "bytes",
			"Content-Length": chunksize,
			"Content-Type": cType,
			"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
			"Access-Control-Allow-Origin": "*"
		});			

		var stream = fs.createReadStream(file, { start: start, end: end })
			.on("open", function() {
				//console.log(" - send chunk");
				var nThrot = commonConfig.getNetworkThrottle();
				
				if (nThrot.value != 0) {
					stream.pipe(new Throttle({rate: nThrot.value * (1024 * 1024) / 8, chunksize: 2048 * 1024})).pipe(res);
					sendServerLog("Throttle server: " + nThrot.name);
				} else {
					stream.pipe(res);				
				}
			}).on("error", function(err) {
				res.sendStatus(400);
				res.end(err);
			});
	});
	
});

expressSrv.get('/time', function(req, res) {
	var tISO;

	var d = new Date();
	
	tISO = dateFormat(d, "isoUtcDateTime");
	console.log("tISO: " + tISO);
	
	res.status(200);
	res.type("text/plain");

	res.send(tISO);	
});
 

const configSegJump 	= [];
var segCount = 0;

expressSrv.get('/segjump/*', function(req, res) {
	
	var useURL = req.path;
	var formProps = {};
	var sC = [];
	
	sendServerLog("GET segjump: " + useURL);

	// Load stream config info (sync - one time load)
	if (!configSegJump[useURL]) {
		var cfn = '.' + commonUtils.noSuffix(useURL) + ".json";
		
		console.log("Load config file: " + cfn);
		
		if (fs.existsSync(cfn)) {
			configSegJump[useURL] = require(cfn);
		} else {
			console.log(" * file does not exist");
			return res.sendStatus(404);
		}
	}
	
	sC = configSegJump[useURL];

	sC.segsize 		= parseInt(eval(sC.segsize));
	
	sC.Atimescale	= parseInt(eval(sC.Atimescale));
	sC.Vtimescale	= parseInt(eval(sC.Vtimescale));

	var ss = ++segCount;
	var alignedOffset = (ss-1) * sC.segsize;
	var ao = Math.round(alignedOffset * sC.Atimescale / 1000);
	var vo = Math.round(alignedOffset * sC.Vtimescale / 1000);
	
	// Get file on server
	var file = path.join(__dirname, useURL + ".hbs");
	console.log(" - file: " + file);

	fs.stat(file, function(err, stats) {
		if (err) {
			if (err.code === 'ENOENT') {
				// 404 Error if file not found
				console.log(" * file does not exist");
				return res.sendStatus(404);
			}
			res.end(err);
		}

		res.render(file, { Aoffset: ao, Voffset: vo, StartSeg: ss }, function(err, mpd) { 
			if (err) {
				res.end(err);
			}
			
			res.type("application/dash+xml");
			res.status(200);
			res.send(mpd);
		});
    });
});


const configStream 	= [];
var archiveMPDs 	= [];
var persistState 	= [];

expressSrv.get('/dynamic/*', function(req, res) {
	
	var progStart;
	var dNow = new Date();
	
	var utcHours = dNow.getUTCHours();	
	var utcMinutes = dNow.getUTCMinutes();
	var utcSeconds = dNow.getUTCSeconds();
	var utcTotalSeconds = (utcMinutes * 60) + utcSeconds;
	
	var useURL = req.path;
	var formProps = {};
	var timeServer = "http://" + req.headers.host + "/time";
	var sC = [];
	var strippedURL = commonUtils.basename(useURL);
	
	var bAllPeriods = false;
	
	sendServerLog("GET dynamic: " + useURL + " (" + strippedURL + ")");

	var sContId = strippedURL + "-" + commonUtils.createContentId(); 
	sendServerLog("ContentId: " + sContId);

	// Content no longer live?
	if (req.query.contid) {
		var cContId = strippedURL + "-" + req.query.contid;
		
		if (sContId != cContId) {
			sendServerLog("Client requested non-current content: " + cContId);
			if (archiveMPDs[cContId]) {				
				sendServerLog("Found archived MPD, using that. ");

				res.type("application/dash+xml");
				res.status(200);
				return res.send(archiveMPDs[cContId]);				
			} else {				
				sendServerLog("No previous content archived!");
				return res.sendStatus(404);				
			}
		}
	}

	if (req.query.allperiods) {
		bAllPeriods = req.query.allperiods === "1";
	}
	
	// Create new manifest?
	formProps.title = sContId;
	
	console.log("- Time offset, past the hour - " + utcMinutes + "M" + utcSeconds + "S");
	// console.log("timeServer: " + timeServer);
	formProps.timeServer = timeServer;
	
	// Load stream config info (sync - one time load)
	if (!configStream[useURL]) {
		var cfn = '.' + commonUtils.noSuffix(useURL) + ".json";
		
		console.log("Load config file: " + cfn);
		
		if (fs.existsSync(cfn)) {
			configStream[useURL] = require(cfn);
		} else {
			console.log(" * file does not exist");
			return res.sendStatus(404);
		}
	}
	
	sC = configStream[useURL];

	function intify(x) {
		return parseInt(eval(x));
	}
	
	sC.segsize 		= intify(sC.segsize);
	sC.periodD 		= intify(sC.periodD);
	sC.adD 			= intify(sC.adD);
	sC.marginF 		= intify(sC.marginF);
	sC.marginB 		= intify(sC.marginB);
	
	sC.Atimescale	= intify(sC.Atimescale);
	sC.Vtimescale	= intify(sC.Vtimescale);

	sC.Etimescale	= sC.Atimescale; // Uses audio timescale - events associated to audio track (less reps)
	
	if (sC.subs) {
		sC.subs.segsize 	= intify(sC.subs.segsize);
		sC.subs.timescale 	= intify(sC.subs.timescale);
	}
	
	var bAdsandMain = (sC.ads.length > 0);

	
	if ((sC.adD > 0) && (sC.adSegAlign != "none")) {
		console.log("- non aligned adD: " + sC.adD);
		
		if (sC.adSegAlign === "round") {
			sC.adD = Math.round(sC.adD / sC.segsize) * sC.segsize;
			console.log("- aligned adD (round): " + sC.adD);		
		} else if (sC.adSegAlign === "floor") {
			sC.adD = Math.floor(sC.adD / sC.segsize) * sC.segsize;
			console.log("- aligned adD (floor): " + sC.adD);		
		}		
	} 

	if (sC.segAlign != "none") {
		console.log("- non aligned periodD: " + sC.periodD);
		
		if (sC.segAlign === "round") {
			sC.periodD = (Math.round((sC.periodD - sC.adD) / sC.segsize) * sC.segsize) + sC.adD;
			console.log("- aligned periodD (round): " + sC.periodD);		
		} else if (sC.segAlign === "floor") {
			sC.periodD = (Math.floor((sC.periodD - sC.adD) / sC.segsize) * sC.segsize) + sC.adD;
			console.log("- aligned periodD (floor): " + sC.periodD);		
		}		
	} 

	
	const progDuration	= (60 * 60 * 1000);
	var maxP = Math.round((progDuration / sC.periodD) - 1);
	console.log("- maxP: " + maxP);
	
	var currentP 	= getPeriod_floor(utcTotalSeconds * 1000, sC.periodD, maxP);
	
	var lowerP;
	var upperP;
	
	if (!bAllPeriods) {
		lowerP	= getPeriod_floor((utcTotalSeconds - sC.marginB) * 1000, sC.periodD, maxP);
		upperP	= getPeriod_floor((utcTotalSeconds + sC.marginF) * 1000, sC.periodD, maxP);
	} else {
		lowerP = 0;
		upperP = maxP;
	}
	
	var numP 		= (upperP - lowerP) + 1;

	// Will the manifest change?
	if (!persistState[useURL]) {
		persistState[useURL] = {};
	}
	
	if (	(!persistState[useURL].publishTime) 	|| 
			(lowerP != persistState[useURL].lowerP) || 
			(upperP != persistState[useURL].upperP)	||
			(sContId != persistState[useURL].sContId)	) {
		var fNow = dateFormat(dNow.toUTCString(), "isoUtcDateTime");
		sendServerLog("Manifest has changed: publishTime - " + fNow);
		
		formProps.publishTime 	= fNow;
		
		persistState[useURL].publishTime 	= fNow;
		persistState[useURL].lowerP 		= lowerP;
		persistState[useURL].upperP 		= upperP;
		persistState[useURL].sContId		= sContId;
	} else {
		if (archiveMPDs[sContId]) {				
			sendServerLog("Using previously created manifest (no change). ");

			res.type("application/dash+xml");
			res.status(200);
			return res.send(archiveMPDs[sContId]);				
		} else {				
			sendServerLog("Error: No previously created manifest!");
			return res.sendStatus(404);				
		}
	}
	
	console.log("CurrentPeriod: " + currentP);

	var prevMain;
	var adIdx;
	var eventId = 1;
	
	for (var i = lowerP; i <= upperP; i++) {
		
		if (i > 0) {
			prevMain = "main-" + (i-1);	
		} else {
			prevMain = "";
		}
	
		if (bAdsandMain) {
			adIdx = (i % sC.ads.length);
			formProps['ad-period' + i] 		= makeAdPeriod(	sC.ads[adIdx], 
															i, sC.periodD, 
															sC.adD, 
															sC.Etimescale, 
															eventId++, 
															"" /* prevMain */, 
															sC.subs);
			formProps['main-period' + i] 	= makeMainPeriod(	sC.main, 
																i, 
																sC.periodD, 
																sC.adD, 
																sC.segsize, 
																sC.Atimescale, 
																sC.Vtimescale, 
																sC.Etimescale,
																eventId++, 
																"" /* "ad-" + i */, 
																sC.subs);
		} else {
			formProps['period' + i] = makeMainPeriod(	sC.main, 
														i, 
														sC.periodD, 
														0, 
														sC.segsize, 
														sC.Atimescale, 
														sC.Vtimescale, 
														sC.Etimescale, 
														eventId++, 
														prevMain, 
														sC.subs);			
		}
	}
	
	// Get file on server
	var file = path.join(__dirname, useURL + ".hbs");
	console.log(" - file: " + file);

	fs.stat(file, function(err, stats) {
		if (err) {
			if (err.code === 'ENOENT') {
				// 404 Error if file not found
				console.log(" * file does not exist");
				return res.sendStatus(404);
			}
			res.end(err);
		}

		var dAv = dNow;
		
		dAv.setUTCMinutes(0);
		dAv.setUTCSeconds(0);
		progStart = dateFormat(dAv.toUTCString(), "isoUtcDateTime");
		//console.log("progStart: " + progStart);
		
		formProps.availabilityStartTime = progStart;
		
		res.render(file, formProps, function(err, mpd) { 
			if (err) {
				res.end(err);
			}
			
			res.type("application/dash+xml");
			res.status(200);
			res.send(mpd);
			
			archiveMPDs[sContId] = mpd; // Archive the mpd for this 'programme'
		});
    });
});

getPeriod_floor = function(m, d, mx) {
	if (m < 0) { 
		m = 0; 
	}
	
	var p = Math.floor(m / d);
	if (p > mx) {
		p = mx;
	}
	
	return p;
}

getPeriod_round = function(m, d, mx) {
	if (m < 0) { 
		m = 0; 
	}
	
	var p = Math.round(m / d);
	if (p > mx) {
		p = mx;
	}
	
	return p;
}

makeAdPeriod = function(fn, p, periodD, adD, eTimescale, eId, prev, subs) {
	var fadD = new Date(adD);
	var fsAd = new Date(p * periodD);
	
	var sAdDuration = _formatTime(fadD);
	var sAdStart 	= _formatTime(fsAd);
	
	if (!runOptions.bEventAbs) {
		var evOffset = 0;
	} else {
		// NOT COMPLIANT!
		var evOffset = Math.floor((p * periodD * eTimescale) / 1000);   // Absolute calc - this is wrong, use relative */
	}
	
	sendServerLog(" - Generated manifest file: Period: " + p);
	sendServerLog(" -  Ad: Duration: " + sAdDuration + " Start: " + sAdStart);

	return adXML(fn, p, sAdDuration, sAdStart, evOffset, eId, prev, subs);
}

makeMainPeriod = function(fn, p, periodD, offset, sz, Atimescale, Vtimescale, eTimescale, eId, prev, subs) {
	var fd = new Date(periodD-offset);
	var fs = new Date((p * periodD) + offset);
	
	var sDuration 	= _formatTime(fd);
	var sStart 		= _formatTime(fs);

	
	function calcOffset (p, periodD, offset, sz, timescale) {
		var seg = (Math.round(((p * periodD) + offset) / sz)) + 1;
		var alignedOffset = (seg-1) * sz;
		var obj = {};
		
		obj.seg = seg;
		obj.offset = Math.round((alignedOffset * timescale) / 1000);
		
		//console.log(" --- calcOffset seg:" + seg + " alignedOffset:" + alignedOffset + " timescale:" + timescale + " obj.offset:" + obj.offset); 
		return obj; 
	}
	
	var offsetObj 	= calcOffset(p, periodD, offset, sz, Atimescale);
	var seg 		= offsetObj.seg;	
	var AoffsetS  	= offsetObj.offset;
	var VoffsetS  	= calcOffset(p, periodD, offset, sz, Vtimescale).offset;
	
	var evOffset;
	if (!runOptions.bEventAbs) {
		evOffset = 0;
	} else {
		// NOT COMPLIANT!
		evOffset = calcOffset(p, periodD, offset, sz, eTimescale).offset;	// Absolute calc - this is wrong, use relative
	}

	if (subs) {
		subs.offsetObj 	= calcOffset(p, periodD, offset, subs.segsize, subs.timescale); 
	}
	
	
	sendServerLog(" -  Main: Duration: " + sDuration + " Start: " + sStart + " (A:" + AoffsetS + "S, V:" + VoffsetS + ")");

	return mainContentXML(
		fn, p, sDuration, sStart, 
		AoffsetS, VoffsetS, seg, 
		evOffset, eId, 
		prev, 
		subs
	);
}

_formatTime = function(d) {
	var ms = "00" + d.getUTCMilliseconds();
	return "PT" + d.getUTCHours() + "H" + d.getUTCMinutes() + "M" + d.getUTCSeconds() + "." + ms.substr(-3) + "S";
}


const periodContinuity 	= fs.readFileSync('./dynamic/periods/period-continuity.xml', 'utf8');

var cachedXML = {};

cachedXML.mainContent	= [];
cachedXML.mainSubs		= [];
cachedXML.ads			= [];
cachedXML.adSubs		= [];


loadAndCache = function(fn, c) {
	if (!c[fn]) {
		console.log("Load file: " + fn);
		
		if (fs.existsSync(fn)) {
			c[fn] = fs.readFileSync(fn, 'utf8');
		} else {
			console.log(" * file does not exist");
			return false;
		}
	}
	return true;
}

mainContentXML = function(fn, p, sDuration, sStart, AoffsetS, VoffsetS, seg, evPresTime, eId, prevPeriodID, subs) {
	var pc;
	var template;
	var context;
	var sbs = "";
	
	if (prevPeriodID != "") {
		template = hbs.handlebars.compile(periodContinuity);
		context = {prevperiod_id: prevPeriodID};
		pc =  template(context);
	} else {
		pc = "";
	}

	if (subs && subs.main && loadAndCache(subs.main, cachedXML.mainSubs)) {
		template = hbs.handlebars.compile(cachedXML.mainSubs[subs.main]);
		context = { 
					subid		: "main",
					offset		: subs.offsetObj.offset,
					period_seg	: subs.offsetObj.seg
				};
		sbs =  template(context);
	}
	
	if (!loadAndCache(fn, cachedXML.mainContent)) {
		return false;
	}

	template 	= hbs.handlebars.compile(cachedXML.mainContent[fn]);
	context 	= {	
					period_id			: "main-" + p, 
					period_start		: sStart, 
					period_continuity	: pc, 
					Aoffset				: AoffsetS, 
					Voffset				: VoffsetS, 
					evPresentationTime	: evPresTime,
					evId				: eId,					
					period_seg			: seg, 
					subs				: sbs
				};
	var complete = template(context);
	
	// console.log(complete);
	
	return complete;
}

adXML = function(fn, p, sDuration, sStart, evPresTime, eId, prevPeriodID, subs) {
	var pc;
	var template;
	var context;
	var sbs = "";
		
	if (prevPeriodID != "") {
		template = hbs.handlebars.compile(periodContinuity);
		context = {prevperiod_id: prevPeriodID};
		pc =  template(context);
	} else {
		pc = "";
	}

	if (subs && subs.ads && loadAndCache(subs.ads, cachedXML.adSubs)) {
		template = hbs.handlebars.compile(cachedXML.adSubs[subs.ads]);
		context = { 
			subid 		: "ads",
			offset		: 0,
			period_seg	: 1	
		};
		sbs =  template(context);
	}
	
	if (!loadAndCache(fn, cachedXML.ads)) {
		return false;
	}

	template 	= hbs.handlebars.compile(cachedXML.ads[fn]);
	context 	= {	period_id: "ad-" + p, 
					period_start: sStart, 
					period_continuity: pc, 
					evPresentationTime: evPresTime, 
					evId: eId,
					subs: sbs};
	var complete = template(context);
	
	// console.log(complete);
	
	return complete;
}

expressSrv.post('/savelog', function(req, res) {
	console.log("/savelog: " + req.query.filename);
    res.send(); // Send an empty response to stop clients from hanging

	fs.writeFile("./logs/" + req.query.filename, "CLIENT IP: " + req.ip + "\n" + req.body, function(err) {
		if(err) {
			console.log(err);
		}
	});
});
 
const licenceTable = [];

expressSrv.post('/getkeys', function(req, res) {
	
	var lDelay = commonConfig.getDelayLicense();
	var licReq = req.body;
	var kid;
	
	console.log("getkeys: " + JSON.stringify(licReq));
	console.log(" - url: " + req.path);
	
	try {
		kid = licReq.kids[0];
	} catch (err) {
		console.log(" * malformed licence request.");
		return res.sendStatus(400);
	}
	
	if (req.query.tag) {
		var tag = req.query.tag;
		
		sendServerLog(" - tag: " + tag);
		
		var file = './clearKey/licence-' + tag + '.json';
		
		fs.stat(file, function(err, stats) {
			if (err) {
				if (err.code === 'ENOENT') {
					// 404 Error if file not found
					console.log(" * file does not exist: " + file);
					return res.sendStatus(404);
				}
				res.end(err);
			}

			if (!licenceTable[tag]) {
				licenceTable[tag] = require(file);
			}
			
			var lic = licenceTable[tag];
			sendServerLog("licence: " + JSON.stringify(lic));
			
			if (lic.keys[0].kid !=  kid) {
				sendServerLog(" * illegal kid.");
				return res.sendStatus(403);
			}
			
			if (lDelay.value != 0) {
				
				sendServerLog("getkeys: delay license by " + lDelay.name);
				setTimeout(function() {
					res.status(200);
					res.send(lic);
				}, lDelay.value);
				
			} else {
				res.status(200);
				res.send(lic);		
			}
		});
	} else {
		console.log(" * no tag");
		return res.sendStatus(404);
	}
});

function sendConnectionStatus() {
	var obj = { 
					'port'			: generalInfo.port,
					'bHTTPSEnabled'	: generalInfo.bHTTPSEnabled,
					'httpsPort'		: generalInfo.httpsPort,
					'addresses'		: generalInfo.serverAddresses, 
					'bConnected'	: (generalInfo.connectedDevices > 0),
					'devName'		: generalInfo.devName,
					'version'		: "v" + generalInfo.version.major + "." + generalInfo.version.minor
				};
				 
	win['log'].sendToWindow('ipc-connected', obj); 
} 

function sendConfig() {
	var props = commonConfig._getProps();
				 
	win['config'].sendToWindow('ipc-send-config', props); 
} 


http.listen(8080, (err) => {
	if (!GUI) {
		init();
	}
});

https.listen(8082);

