const os = require("os");
const ip = require("ip");
const fs = require('fs');

const electron = require('electron');   // include electron
const electronApp = electron.app;                // give access to electron functions
 
const browserWindow = electron.BrowserWindow;   // electron window functions
const ipc = electron.ipcMain;                   // talk between the electron threads
 
const path = require('path'); // used by electron to load html files
const url = require('url');   // used by electron to load html files
 
const express = require('express');         // Includes the Express source code
const bodyParser = require('body-parser');  // Express middle-ware that allows parsing of post bodys

const hbs = require('hbs');                 // hbs is a Handlebars template renderer for Express
//hbs.handlebars === require('handlebars');
 
const Throttle = require('stream-throttle').Throttle;

const dateFormat = require('dateformat');

const UTILS = require('./common/utils.js');
var commonUtils = new UTILS();

const CONFIG = require('./common/configobj.js');
var commonConfig = new CONFIG();


var win = {};
win['log'] 			= null;
win['allvideoobjs'] = null;
win['mainvideoobj'] = null;
win['ad0videoobj'] 	= null;
win['ad1videoobj']	= null;
win['adtrans']		= null;
win['config']		= null;


var expressServer = express(); // Active express object
 
var server = require('http').createServer(expressServer); // use the electron server to create a sockets io server
var io = require('socket.io')(server);          // create the sockets io server
 
var generalInfo = {
	port				: 0,
	serverAddresses 	: [],
	connectedDevices	: 0,
	currentDeviceUA 	: "",
	devName 			: "",
	version				: {}
};

generalInfo.version = require("./version.json");

 
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

function WINDOW(p, uiurl, w, h, r, c, bMax) {
	var self = this;
	
	self.uiurl 	= uiurl;
	self.width 	= w;
	self.height	= h;
	self.winObj = null;
	self.onFocus = r;
	self.onClosed = c;
	
	self.createWindow = function () {

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

function init() {
	var p;
	var v = generalInfo.version;
	
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
	
	win['log'] 			= new WINDOW(null,	'ui/ui.html',		1200,	640,	sendConnectionStatus,	mainUIClosed, true);
	
	p = win['log'].getWin();
	
	win['allvideoobjs'] = new WINDOW(p,	'ui/graph.html',		1400,	700,	null, null, true);
	win['mainvideoobj'] = new WINDOW(p,	'ui/singlegraph.html',	1400, 	800,	null, null, true);
	win['ad0videoobj']	= new WINDOW(p,	'ui/graphAdVid0.html', 	1400, 	800,	null, null, true);
	win['ad1videoobj']	= new WINDOW(p,	'ui/graphAdVid1.html', 	1400, 	800,	null, null, true);
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

	generalInfo.port = server.address().port;
	for( var i = 0; i < generalInfo.serverAddresses.length; i++) {
		console.log(i + ": " + generalInfo.serverAddresses[i] + ":" + generalInfo.port);
	}

	
	console.log("App URL:");
	console.log("  <server_ip>:" + generalInfo.port + "/index.html");
	console.log("  <server_ip>:" + generalInfo.port + "/player.aitx");
	
	commonConfig.setNetworkThrottle(commonConfig.THROTTLE.NONE);
	commonConfig.setNetworkErrors(commonConfig.NETERRS.NONE);
	commonConfig.setDelayLicense(commonConfig.DELAYLICENSE.NONE);
}
 
electronApp.on('ready', init); 
 
electronApp.on('window-all-closed', function() { // if this is running on a mac closing all the windows does not kill the application
    if (process.platform !== 'darwin')
        electronApp.quit();
});
 
expressServer.on('activate', function() {
});
 
io.sockets.on('connection', function(socket) { // listen for a device connection to the server
	generalInfo.connectedDevices++;

    console.log(" ---> Device connected: " + generalInfo.connectedDevices);
	generalInfo.devName = commonUtils.extractDevName(generalInfo.currentDeviceUA);
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
});

expressServer.use(express.static('public')); // put static files in the public folder to make them available on web pages
expressServer.use(bodyParser.urlencoded({ extended: false })); 
expressServer.use(bodyParser.text({type: 'text/plain'})); 
expressServer.use(bodyParser.json());

//expressServer.use(express.static('views'));
expressServer.use('/common', express.static('common'));
expressServer.use('/css', express.static('views/css'));
expressServer.use('/bitmaps', express.static('views/bitmaps'));
expressServer.use('/js', express.static('views/js'));
expressServer.use('/playlists', express.static('playlists'));
  
expressServer.set('view-engine', 'hbs'); 

expressServer.post('/log', function(req, res) {
	win['log'].sendToWindow('ipc-log', req.body); // send the async-body message to the rendering thread
	//console.log(req.body);
    res.send(); // Send an empty response to stop clients from hanging
});

function sendServerLog(msg) {
	var logObj = { 
					'cssClass': 'debug', 
					'logText': 	"--- SERVER: " + msg + " ---"
				 };
				 
	console.log("* " + msg);
	win['log'].sendToWindow('ipc-log', logObj); 
} 

expressServer.post('/status', function(req, res) {
	win['log'].sendToWindow('ipc-status', req.body); // send the async-body message to the rendering thread
	//console.log(req.body);
    res.send(); // Send an empty response to stop clients from hanging
});

expressServer.post('/adtrans', function(req, res) {
	win['adtrans'].sendToWindow('ipc-adtrans', req.body); // send the async-body message to the rendering thread
	//console.log(req.body);
    res.send(); // Send an empty response to stop clients from hanging
});

expressServer.get('/*.html', function(req, res) {
	var UA = req.headers['user-agent'];
	
	if (!generalInfo.currentDeviceUA || generalInfo.currentDeviceUA === UA) {
		generalInfo.currentDeviceUA = UA;
		generalInfo.devName = commonUtils.extractDevName(generalInfo.currentDeviceUA);
		
		//createWindows();
		
		win['log'].reload();
		win['allvideoobjs'].reload();
		win['mainvideoobj'].reload();
		win['ad0videoobj'].reload();
		win['ad1videoobj'].reload();
		win['adtrans'].reload();
		
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

expressServer.get('/player.aitx', function(req, res) {
	var srv = "http://" + req.headers.host + "/";
	
	// console.log("get ait: " + srv);
	res.render('playerait.hbs', {url: srv}, function(err, html) { 
		res.type("application/vnd.dvb.ait+xml");
		res.status(200);
		// console.log(html);
        res.send(html);
    });
});

expressServer.get('/content/*', function(req, res) {
	// TODO: Why seeing 2 gets????
	// TODO: Use "application/dash+xml" for mpds
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
			"Content-Type": cType
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

expressServer.get('/time', function(req, res) {
	var tISO;

	var d = new Date();
	
	tISO = dateFormat(d, "isoUtcDateTime");
	console.log("tISO: " + tISO);
	
	res.status(200);
	res.type("text/plain");

	res.send(tISO);	
});
 
const configStream 	= [];
var archiveMPDs 	= [];
var persistState 	= [];

expressServer.get('/dynamic/*', function(req, res) {
	
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

	sC.segsize 		= parseInt(eval(sC.segsize));
	sC.periodD 		= parseInt(eval(sC.periodD));
	sC.adD 			= parseInt(eval(sC.adD));
	sC.marginF 		= parseInt(eval(sC.marginF));
	sC.marginB 		= parseInt(eval(sC.marginB));
	
	sC.Atimescale	= parseInt(eval(sC.Atimescale));
	sC.Vtimescale	= parseInt(eval(sC.Vtimescale));

	sC.Etimescale	= 1000; // TODO: hardcoded...
	
	var bAdsandMain = (sC.ads.length > 0);

	sC.segAlign = eval(sC.segAlign);
	if (sC.segAlign) {
		console.log("- non aligned periodD: " + sC.periodD);
		
		sC.periodD = (Math.round((sC.periodD - sC.adD) / sC.segsize) * sC.segsize) + sC.adD;
		
		console.log("- aligned periodD: " + sC.periodD);		
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
	
	for (var i = lowerP; i <= upperP; i++) {
		
		if (i > 0) {
			prevMain = "main-" + (i-1);	
		} else {
			prevMain = "";
		}
	
		if (bAdsandMain) {
			adIdx = (i % sC.ads.length);
			formProps['ad-period' + i] 		= makeAdPeriod(sC.ads[adIdx], i, sC.periodD, sC.adD, sC.Etimescale, "" /* prevMain */);
			formProps['main-period' + i] 	= makeMainPeriod(sC.main, i, sC.periodD, sC.adD, sC.segsize, sC.Atimescale, sC.Vtimescale, sC.Etimescale, "" /* "ad-" + i */);
		} else {
			formProps['period' + i] = makeMainPeriod(sC.main, i, sC.periodD, 0, sC.segsize, sC.Atimescale, sC.Vtimescale, sC.Etimescale, prevMain);			
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

makeAdPeriod = function(fn, p, periodD, adD, eTimescale, prev) {
	var fadD = new Date(adD);
	var fsAd = new Date(p * periodD);
	
	var sAdDuration = _formatTime(fadD);
	var sAdStart 	= _formatTime(fsAd);
	
	var evOffset = Math.floor((p * periodD * eTimescale) / 1000);
	
	sendServerLog(" - Generated manifest file: Period: " + p);
	sendServerLog(" -  Ad: Duration: " + sAdDuration + " Start: " + sAdStart);

	return adXML(fn, p, sAdDuration, sAdStart, evOffset, prev);
}

makeMainPeriod = function(fn, p, periodD, offset, sz, Atimescale, Vtimescale, eTimescale, prev) {
	var fd = new Date(periodD-offset);
	var fs = new Date((p * periodD) + offset);
	var seg = (Math.round(((p * periodD) + offset) / sz)) + 1;
	
	var sDuration 	= _formatTime(fd);
	var sStart 		= _formatTime(fs);
	
	var alignedOffset = (seg-1) * sz;
	var AoffsetS  	= Math.round(alignedOffset * Atimescale / 1000);
	var VoffsetS  	= Math.round(alignedOffset * Vtimescale / 1000);
	var evOffset 	= Math.round((alignedOffset * eTimescale) / 1000);
	
	sendServerLog(" -  Main: Duration: " + sDuration + " Start: " + sStart + " (A:" + AoffsetS + "S, V:" + VoffsetS + ")");

	return mainContentXML(fn, p, sDuration, sStart, AoffsetS, VoffsetS, seg, evOffset, prev);
}

_formatTime = function(d) {
	return "PT" + d.getHours() + "H" + d.getMinutes() + "M" + d.getSeconds() + "." + d.getMilliseconds() + "S";
}


const periodContinuity 	= fs.readFileSync('./dynamic/periods/period-continuity.xml', 'utf8');

const mpMainContent	= [];
const mpAds			= [];

mainContentXML = function(fn, p, sDuration, sStart, AoffsetS, VoffsetS, seg, evPresTime, prevPeriodID) {
	var pc;
	var template;
	var context;
		
	if (prevPeriodID != "") {
		template = hbs.handlebars.compile(periodContinuity);
		context = {prevperiod_id: prevPeriodID};
		pc =  template(context);
	} else {
		pc = "";
	}

	if (!mpMainContent[fn]) {
		console.log("Load main content file: " + fn);
		
		if (fs.existsSync(fn)) {
			mpMainContent[fn] = fs.readFileSync(fn, 'utf8');
		} else {
			console.log(" * file does not exist");
			return false;
		}
	}

	template 	= hbs.handlebars.compile(mpMainContent[fn]);
	context 	= {period_id: "main-" + p, period_start: sStart, period_continuity: pc, Aoffset: AoffsetS, Voffset: VoffsetS, evPresentationTime: evPresTime, period_seg: seg};
	var complete = template(context);
	
	// console.log(complete);
	
	return complete;
}

adXML = function(fn, p, sDuration, sStart, evPresTime, prevPeriodID) {
	var pc;
	var template;
	var context;
		
	if (prevPeriodID != "") {
		template = hbs.handlebars.compile(periodContinuity);
		context = {prevperiod_id: prevPeriodID};
		pc =  template(context);
	} else {
		pc = "";
	}

	if (!mpAds[fn]) {
		console.log("Load ad: " + fn);
		
		if (fs.existsSync(fn)) {
			mpAds[fn] = fs.readFileSync(fn, 'utf8');
		} else {
			console.log(" * file does not exist");
			return false;
		}
	}

	template 	= hbs.handlebars.compile(mpAds[fn]);
	context 	= {period_id: "ad-" + p, period_start: sStart, period_continuity: pc, evPresentationTime: evPresTime};
	var complete = template(context);
	
	// console.log(complete);
	
	return complete;
}

expressServer.post('/savelog', function(req, res) {
	console.log("/savelog: " + req.query.filename);
    res.send(); // Send an empty response to stop clients from hanging

	fs.writeFile("./logs/" + req.query.filename, req.body, function(err) {
		if(err) {
			console.log(err);
		}
	});
});
 
const licenceTable = [];

expressServer.post('/getkeys', function(req, res) {
	
	var lDelay = commonConfig.getDelayLicense();
	
	console.log("getkeys: " + JSON.stringify(req.body));
	console.log(" - url: " + req.path);
	
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
			// sendServerLog("licence: " + JSON.stringify(lic));
			
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


server.listen(8080); // Socket.io port (hides express inside)
