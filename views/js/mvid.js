var mVid = {};
 
mVid.videoEvents = Object.freeze({
  LOAD_START		: "loadstart",
  PROGRESS			: "progress",
  SUSPEND			: "suspend",
  ABORT				: "abort",
  ERROR				: "error",
  EMPTIED			: "emptied",
  STALLED			: "stalled",
  LOADED_METADATA	: "loadedmetadata",
  LOADED_DATA		: "loadeddata",
  CAN_PLAY			: "canplay",
  CAN_PLAY_THROUGH	: "canplaythrough",
  PLAYING			: "playing",
  WAITING			: "waiting",
  SEEKING			: "seeking",
  SEEKED			: "seeked",
  ENDED				: "ended",
  DURATION_CHANGE	: "durationchange",
  TIME_UPDATE		: "timeupdate",
  PLAY				: "play",
  PAUSE				: "pause",
  RATE_CHANGE		: "ratechange",
  RESIZE			: "resize",
  VOLUME_CHANGE		: "volumechange",
  ENCRYPTED			: "encrypted"
});

mVid.playCount 				= 0;

var content = {};
content.currentBufferingIdx = 0;
content.currentPlayingIdx 	= 0;

content.list = [
	{	
		playerId : "mVid-video0",
		//src : "http://mp.adverts.itv.com/priority/KARRBDQ014020_BandQ_PaintPlants_ThursFri_20_6c6f_1200.mp4", 
		src : "content/adverts/KARRBDQ014020_BandQ_PaintPlants_ThursFri_20_6c6f_1200.mp4", 
		type : "video/mp4",
		transitionTime : -1
	},
	{
		playerId : "mVid-video1", 
		//src : "http://mp.adverts.itv.com/priority/wcrbmwa311030_bmw_f45_f45activetourer_30_f076_1200.mp4", 
		src : "content/adverts/wcrbmwa311030_bmw_f45_f45activetourer_30_f076_1200.mp4", 
		type : "video/mp4",
		transitionTime : -1
	},
	{
		playerId : "mVid-video0", 
		//src : "http://mp.adverts.itv.com/priority/GRYGKSP008010_ADROBOT_OldSpeckedHen_GreyLondon_10_a02_1200.mp4", 
		src : "content/adverts/GRYGKSP008010_ADROBOT_OldSpeckedHen_GreyLondon_10_a02_1200.mp4", 
		type : "video/mp4",
		transitionTime : -1
	},
	{
		playerId : "mVid-mainContent", 
		// *** wrong licence *** src : "http://itvpnp-usp.test.ott.irdeto.com/MONITOR/SAMPLES/1-8647-0243-001-DVBDASH-CLEARKEY.ism/.mpd",
		//src : "http://itvpnp-usp.test.ott.irdeto.com/MONITOR/SAMPLES/1-9360-1784-001-DVBDASH-CLEARKEY.ism/.mpd",
		//src : "http://rdmedia.bbc.co.uk/dash/ondemand/bbb/2/client_manifest-common_init.mpd",
		src : "content/bbc/client_manifest-common_init.mpd",
		type : "application/dash+xml",
		transitionTime : 30
	},
];

// Key mapping table
var keyTable = {};

const __VK_LEFT		= 37;
const __VK_RIGHT	= 39;
const __VK_0 		= 48;
const __VK_1 		= 49;
const __VK_2 		= 50;
const __VK_3 		= 51;
const __VK_4 		= 52;
const __VK_5 		= 53;
const __VK_6 		= 54;
const __VK_7 		= 55;
const __VK_8 		= 56;
const __VK_9 		= 57;
const __VK_FAST_FWD = 417;
const __VK_REWIND 	= 412;
const __VK_PLAY 	= 415;
const __VK_PAUSE 	= 19;
const __VK_INFO 	= 457;
const __VK_RED 		= 403;
const __VK_GREEN	= 404;
const __VK_YELLOW	= 405;
const __VK_BLUE		= 406;


// Play states
const PLAYSTATE_STOP	= 0;
const PLAYSTATE_PLAY	= 1;
const PLAYSTATE_PAUSE	= 2;
const PLAYSTATE_REW		= 3;
const PLAYSTATE_FWD		= 4;

const STALL_TIMEOUT_MS = 5000;

const PRELOAD_NEXT_AD_S = 5;

// Icon table
mVid.playIconTable = [
	{	state: PLAYSTATE_STOP, 	icon: "player-stop"	},
	{	state: PLAYSTATE_PLAY, 	icon: "player-play"	},
	{ 	state: PLAYSTATE_PAUSE, icon: "player-pause"},
	{	state: PLAYSTATE_REW, 	icon: "player-rew"	},
	{	state: PLAYSTATE_FWD, 	icon: "player-fwd"	}
];

// Error codes name table
mVid.eventErrorCodesMappingTable = [
	"0 = UNUSED_ERROR_CODE",
	"1 = MEDIA_ERROR_ABORTED",	// the user has aborted fetching the video
	"2 = MEDIA_ERROR_NETWORK",	// network error
	"3 = MEDIA_ERR_DECODE",		// error at decodation time
	"4 = MEDIA_ERR_SRC_NOT_SUPPORTED"	// media format not supported
];

// Network state table
mVid.networkStateMappingTable = [
	"0 = NETWORK_EMPTY", 	// not yet initialized
	"1 = NETWORK_IDLE", 	// source chosen; not in fetching state
	"2 = NETWORK_LOADING", 	// actively fetches the source
	"3 = NETWORK_NO_SOURCE" //no source in a supported format can be spotted
];

// Media ready state - used for sanity checking state - TODO: use array, eg 0, HAVE_NOTHING, "HAVE_NOTHING"
const HAVE_NOTHING 		= 0;	// no data
const HAVE_METADATA 	= 1;	// duration, width, height and other metadata of the video have been fetched.
const HAVE_CURRENT_DATA = 2;	// There has not been sufficiently data loaded in order to start or continue playback.
const HAVE_FUTURE_DATA	= 3; 	// enough data to start playback
const HAVE_ENOUGH_DATA	= 4; 	// it should be possible to play the media stream without interruption till the end.

mVid.startTime = Date.now();


mVid.Log = {};

mVid.Log.init = function (logDiv) {
	this.lastLogTime 	= Date.now();
	this.logStr 		= "";
};

mVid.Log.error = function (message) {
	this._write("ERROR: " + message, "error");
};

mVid.Log.warn = function (message) {
	this._write("WARN: " + message, "warn");
};

mVid.Log.info = function (message) {
	this._write("INFO: " + message, "info");
};

mVid.Log.debug = function (message) {
	this._write("DEBUG: " + message, "debug");
};

mVid.Log._write = function(message, cssClass) {
	var log, nextLog, logText, elapsedTime;
	
	elapsedTime = ("000000" + (Date.now() - this.lastLogTime)).slice(-6);
	this.lastLogTime = Date.now();
	
	logText = elapsedTime + "ms:" + message;
	this.logStr += logText + "\r\n";
	
	var out = "cssClass=" + cssClass + "&";
	out += "logText=" + logText;
	
	// send a xhr/ajax POST request with the serialized media events
	var xhttp = new XMLHttpRequest();
	xhttp.open("POST", "/log", true);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
	xhttp.send(out);
};


e = function (id) {
  return document.getElementById(id);
}

window.onload = function () {
	try {
		mVid.start();
	} catch (error) {
		mVid.Log.error("FATAL ERROR: " + error.message);
	}
}

window.onbeforeunload = function () {
	mVid.Log.warn("Refresh page");
	mVid.cmndLog();
	mVid.socket.disconnect();
}

mVid.start = function () {
	var mainVideo;
    var appMan 		= null;
	var that 		= this;
	var confManager = null;
	
	this.app = null;
	
	this.Log.init(e("log"));
	this.Log.info("app loaded");

	this.displayBrowserInfo();
	
    try {
		if (oipfObjectFactory.isObjectSupported('application/oipfApplicationManager')) {
			appMan = oipfObjectFactory.createApplicationManagerObject();
		}
    } catch (err) {
        this.Log.warn("Exception when creating creating ApplicationManager Object. Error: " + err.message);
    }
	
    try {
        this.app = appMan.getOwnerApplication(document);
    } catch (err) {
        this.Log.warn("Exception when getting the owner Application object. Error: " + err.message);
    }

    try {
        this.app.show();
    } catch (err) {
        this.Log.warn("Exception when calling show() on the owner Application object. Error: " + err.message);
    }

	this.socket = io();
	
	mainVideo = e("mVid-mainContent");
	
	for(var i in this.videoEvents) {
		mainVideo.addEventListener(this.videoEvents[i], this.onVideoEvent);
	}

	mainVideo.restartPoint 			= 0;
	mainVideo.bPlayPauseTransition 	= false;
	mainVideo.bBuffEnoughToPlay 	= false;
	this.transitionThresholdMS 		= 1000;
	this.bShowBufferingIcon			= false;
	
	// Clear key
    const KEYSYSTEM_TYPE = "org.w3.clearkey";

	var options = [];
	const audioContentType = 'audio/mp4; codecs="mp4a.40.2"'; 
	const videoContentType = 'video/mp4; codecs="avc3.64001F"'; 

	options = [
		{
		  initDataTypes: ["cenc"],
		  videoCapabilities: [{contentType: videoContentType}],
		  audioCapabilities: [{contentType: audioContentType}],
		}
	];

	SetupEME(mainVideo, KEYSYSTEM_TYPE, "video", options);
	
	
	
	window.setInterval( function() {
		var elTimer = e("videoTimer");

		// elTimer.innerHTML = ("00000000" + (Date.now() - that.startTime)).slice(-8);
		if (elTimer) {
			elTimer.innerHTML = that.msToTime(Date.now() - that.startTime);
		}
		
		that.updateBufferBars();	
	}, 1000);
	
	
    try {
		var myKeyset = this.app.privateData.keyset;
		myKeyset.setValue(	myKeyset.RED 		| 
							myKeyset.GREEN 		| 
							myKeyset.BLUE 		| 
							myKeyset.YELLOW		| 
							myKeyset.VCR		|
							myKeyset.NUMERIC 	|
							myKeyset.NAVIGATION);
    } catch (err) {
        this.Log.warn("Exception accessing app.privateData.keyset. Error: " + err.message);
    }
	
	document.addEventListener("keydown", this.OnKeyDown.bind(this));
	
	this.showBufferingIcon(false);
	this.setPlayingState(PLAYSTATE_STOP);
	
	this.setContentSourceAndLoad();
	this.resetStallTimer();
};

mVid.displayBrowserInfo = function () {
	this.Log.info("--------------------------------------------------------------------");
	this.Log.info("*** Browser CodeName: 	" + navigator.appCodeName);
	this.Log.info("*** Browser Name: 		" + navigator.appName);
	this.Log.info("*** Browser Version: 	" + navigator.appVersion);
	this.Log.info("*** Cookies Enabled: 	" + navigator.cookieEnabled);
	this.Log.info("*** Platform: 			" + navigator.platform);
	this.Log.info("*** User-agent header: 	" + navigator.userAgent);
	this.Log.info("--------------------------------------------------------------------");	
}

mVid.createPlayer = function (playerId) {
	this.Log.info("createPlayer: " + playerId);

	var player = document.createElement("video");	
	
    player.setAttribute("id", playerId);
	player.style.display = "none";
	
	var source = document.createElement("source");
	
    source.setAttribute("id", playerId + "-source");
    source.setAttribute("preload", "auto");
	
	player.appendChild(source);

	e("player-container").appendChild(player);
	
	for(var i in this.videoEvents) {
		player.addEventListener(this.videoEvents[i], this.onVideoEvent);
	}

	this.statusTableText(playerId, "Play", "---");
	this.statusTableText(playerId, "Buffer", "---");
	this.statusTableText(playerId, "Type", "---");
	this.statusTableText(playerId, "Pos", "---");

	player.bPlayPauseTransition = false;
	player.restartPoint = 0;
	
	this.timeStampStartOfPlay(player);
	
	return player;
}

mVid.purgePlayer = function (playerId) {
	this.Log.info("purgePlayer: " + playerId);

	var player = e(playerId);
	
	if (player) {
		player.pause();
		player.src="";
		
		player.removeAttribute("src");
		player.removeAttribute("source");
		player.innerHTML = ""; // Why is the <source> placed in here!?
		player.load();
		player.parentNode.removeChild(player);
		player=null;	// don't really need this...
	}
}

mVid.getKeyByValue = function (obj, value) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
             if(obj[prop] === value)
                 return prop;
        }
    }
} 
 
mVid.msToTime  = function (timeMS) {
	var milliseconds = parseInt((timeMS%1000))
		, seconds = parseInt((timeMS/1000)%60)
		, minutes = parseInt((timeMS/(1000*60))%60)
		, hours = parseInt((timeMS/(1000*60*60))%24);

	hours = (hours < 10) ? "0" + hours : hours;
	minutes = (minutes < 10) ? "0" + minutes : minutes;
	seconds = (seconds < 10) ? "0" + seconds : seconds;
	milliseconds = ("000" + milliseconds).slice(-3);

	return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

mVid.updateBufferBars = function() {
	this.updateBufferBar("mVid-mainContent", '');
	this.updateBufferBar("mVid-video0", '');
	this.updateBufferBar("mVid-video1", '');
} 

mVid.updateBufferBar = function(playerId, annot) {
	var playerBuffer 	= e(playerId + "-bufferBar");
	var headroomBuffer 	= e(playerId + "-headroomBar");
	var player 			= e(playerId);
	
	if (player)
	{
		var buffer 			= player.buffered;
		var duration 		= player.duration;
		var offset;
		
		if (player.paused) {
			playerBuffer.setAttribute("class", "bufferBar");
			headroomBuffer.setAttribute("class", "bufferBar");		
		} else {
			playerBuffer.setAttribute("class", "bufferBarActive");	
			headroomBuffer.setAttribute("class", "bufferBarActive");	
		}
		
		offset = (player.paused) ? 0 : player.currentTime;
		
		if (duration && (duration > 0)) {
			playerBuffer.max = duration;
			headroomBuffer.max = 60; // (duration < 60) ? duration : 60;

			if ((buffer.length > 0) && (player.currentTime < player.duration) /* !player.ended */) {
				playerBuffer.value = buffer.end(buffer.length-1);
				headroomBuffer.value = buffer.end(buffer.length-1) - offset;
			} else {
				playerBuffer.value = 0;			
				headroomBuffer.value = 0;			
			}
		} else
		{
			playerBuffer.value = 0;	
			playerBuffer.max = 60;	
			headroomBuffer.value = 0;	
			headroomBuffer.max = 60;	
		}
	}
	
	// Send state over io sockets
	var pbObj = "\"playerBufferObj\": {";
	pbObj += "\"id\":" + JSON.stringify(playerId) + ",";
	if (player)	{
		pbObj += "\"class\":" + JSON.stringify(playerBuffer.getAttribute("class")) + ",";
		pbObj += "\"value\":" + JSON.stringify('' + playerBuffer.value) + ","; 
		pbObj += "\"max\":" + JSON.stringify('' + playerBuffer.max) + ",";
		pbObj += "\"currentTime\":" + JSON.stringify('' + player.currentTime) + ",";
		pbObj += "\"restartPoint\":" + JSON.stringify('' + player.restartPoint) + ",";
		pbObj += "\"duration\":" + JSON.stringify('' + player.duration) + ",";
	} else {
		pbObj += "\"class\":\"bufferBar\",";
		pbObj += "\"value\":\"0\","; 
		pbObj += "\"max\":\"0\",";
		pbObj += "\"currentTime\":\"0\",";
		pbObj += "\"restartPoint\":\"0\",";
		pbObj += "\"duration\":\"0\",";	
	}
	pbObj += "\"time\":" + JSON.stringify('' + Date.now() - this.startTime) + ",";
	pbObj += "\"annotation\":" + JSON.stringify(annot);
	pbObj += "}";
	
	var hbObj = "\"headroomBufferObj\": {";
	hbObj += "\"id\":" + JSON.stringify(playerId) + ",";
	if (player)	{
		hbObj += "\"class\":" + JSON.stringify(headroomBuffer.getAttribute("class")) + ",";
		hbObj += "\"value\":" + JSON.stringify('' + headroomBuffer.value) + ",";
		hbObj += "\"max\":" + JSON.stringify('' + headroomBuffer.max);
	} else {
		hbObj += "\"class\":\"bufferBar\",";
		hbObj += "\"value\":\"0\","; 
		hbObj += "\"max\":\"0\"";
	}
	hbObj += "}";
	
	var out = "{" + pbObj + "," + hbObj + "}";

	this.socket.emit('bufferEvent', out);
}

mVid.updatePlaybackBar = function(playerId) {
	var playerBar 		= e("playbackBar");
	var player 			= e(playerId);
	
	if (player) {
		var duration 		= player.duration;
		
		if (duration && (duration > 0)) {
			playerBar.max = duration;
			playerBar.value = player.currentTime;
		} else
		{
			playerBar.value = 0;	
			playerBar.max = 100;	
		}

		var out = "{";
		out += "\"value\":" + JSON.stringify('' + playerBar.value) + ",";
		out += "\"max\":" + JSON.stringify('' + playerBar.max);
		out += "}";
		
		this.socket.emit('playbackOffset', out);
	}
}

mVid.showBufferingIcon = function (bBuffering) {
	if (this.bShowBufferingIcon != bBuffering) {
		var bufferingIcon = e("player-buffering");
		
		this.bShowBufferingIcon = bBuffering;
			
		if (bBuffering) {
				bufferingIcon.setAttribute("class", "playerBufferingIcon rotate");
		} else {
				bufferingIcon.setAttribute("class", "playerBufferingIcon");			
		}			
	}
}

mVid.setPlayingState = function (state) {
	for (var s in this.playIconTable) {
		var playEl = e(this.playIconTable[s].icon);
		if (playEl) {
			if (this.playIconTable[s].state === state) {
				playEl.setAttribute("class", "playerIcon hilite");
			} else {
				playEl.setAttribute("class", "playerIcon");
			}
		}
	}
}

mVid.postStatusUpdate = function (id, text) {
	var out = "id=" + id + "&" + "text=" + text;
	this._post("/status", out);
}

mVid.postAdTrans = function (id, time) {
	var out = "id=" + id + "&" + "time=" + time;
	this._post("/adtrans", out);
}

mVid._post = function (url, out) {
	// send a xhr/ajax POST request with the serialized media events
	var xhttp = new XMLHttpRequest();
	xhttp.open("POST", url, true);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
	xhttp.send(out);
}

mVid.statusTableText = function (playerId, textEntry, text) {
	this.postStatusUpdate("e_" + playerId + "_" + textEntry, text);
}

mVid.getCurrentBufferingPlayer = function () {
	//this.Log.info("getCurrentBufferingPlayer: " + content.list[content.currentBufferingIdx].playerId);
	var idx = content.currentBufferingIdx;
	var playerId = content.list[idx].playerId;
	var player = e(playerId);
	
	if (!player) {
		this.createPlayer(playerId);
		player = e(playerId);
	}
	
	return player;
}

mVid.getCurrentPlayingPlayer = function () {
	//this.Log.info("getCurrentPlayingPlayer: " + content.list[content.currentPlayingIdx].playerId);
	var idx = content.currentPlayingIdx;
	
	return e(content.list[idx].playerId);
}

mVid.getBufferingContentIdx = function () {
	//this.Log.info("getBufferingContentIdx: " + content.currentBufferingIdx);
	return content.currentBufferingIdx;
}

mVid.getPlayingContentIdx = function () {
	//this.Log.info("getPlayingContentIdx: " + content.currentPlayingIdx);
	return content.currentPlayingIdx;
}

mVid.getTransitionTime = function () {
	return content.list[content.currentPlayingIdx].transitionTime;
}

mVid.setContentSourceAndLoad = function () {
	var player;

	player = this.getCurrentBufferingPlayer();
	this.Log.info(player.id + " setContentSourceAndLoad - currentBufferingIdx: " + content.currentBufferingIdx);
	
	e("encrypted").setAttribute("class", "playerIcon");
	
	this.setSourceAndLoad(player, content.list[content.currentBufferingIdx].src, content.list[content.currentBufferingIdx].type);
}

mVid.skipBufferingToNextPlayer = function () {
	if (++content.currentBufferingIdx >= content.list.length) {
		content.currentBufferingIdx = 0;
	}
	this.Log.info("skipBufferingToNextPlayer: " + content.currentBufferingIdx);
	this.postStatusUpdate("BufferIdx", content.currentBufferingIdx);
}

mVid.skipPlayingToNextPlayer = function () {
	if (++content.currentPlayingIdx >= content.list.length) {
		content.currentPlayingIdx = 0;
	}
	this.Log.info("skipPlayingToNextPlayer: " + content.currentPlayingIdx);
	this.postStatusUpdate("PlayingIdx", content.currentPlayingIdx);
}

mVid.isMainFeaturePlayer = function (player) {
	return (player.id == "mVid-mainContent");
}

mVid.setPreload = function (player, mode) {
	var source = e(player.id + "-source");
	source.setAttribute("preload", mode);
}

mVid.setSourceAndLoad = function (player, src, type) {
	this.Log.info(player.id + " setSourceAndLoad - src: " + src + " type: " + type);
	
	this.statusTableText(player.id, "Type", type);
	
	var source = e(player.id + "-source");

	if (source.getAttribute("type") == "" || !this.isMainFeaturePlayer(player))
	{
		source.setAttribute("src", src);
		source.setAttribute("type", type);	
		player.bBuffEnoughToPlay = false;
		// Running on a non hbbtv device?
		if (!this.app) {
			dashjs.MediaPlayerFactory.create(player, source);
		}
		player.load();
	}
	
	if (this.isMainFeaturePlayer(player)) {
		this.setPreload(player, "auto");
		/*
		// wrap around main content - if at the end
		if (player.currentTime >= player.duration) {
			this.Log.info(player.id + " start content again at beginning");
			player.currentTime = 0;
			player.restartPoint = 0;
		}
		*/
	}
}

mVid.switchPlayerToPlaying = function(freshPlayer, previousPlayer) {
	// freshPlayer / previousPlayer can be null
	
	if (freshPlayer == previousPlayer) {
		this.Log.error("Current and next player are the same (" + freshPlayer.id + ")");
		previousPlayer = null;
	}
	
	this.Log.info("---------------------------------------------------------------------------------------------------");
	this.Log.info("Start playing called: ");
	if (freshPlayer) { 
		this.Log.info(" - freshPlayer: " + freshPlayer.id);
	} else {
		this.Log.warn(" - Not ready to play yet");		
	}
	if (previousPlayer) this.Log.info(" - previousPlayer: " + previousPlayer.id)
	
	// Set the display CSS property of the pre-fetched video to block.
	if (freshPlayer) {
		freshPlayer.style.display = "block";
	}
	
	// Pause the currently playing media element, using the pause() function.
	if (previousPlayer) {
		previousPlayer.pause();
	}

	// Start playback of the pre-fetched media, using the play() function.
	if (freshPlayer) {
		freshPlayer.playbackRate = 1;
		freshPlayer.play();
	}
	
	// Set the display CSS property of the previous media element to none.
	if (previousPlayer) {
		previousPlayer.style.display = "none";
	}
	
	if (freshPlayer) {
		this.postStatusUpdate("PlayCount", ++this.playCount);
	}
	
	// Purge previous player
	if (previousPlayer && !this.isMainFeaturePlayer(previousPlayer)) {
		this.purgePlayer(previousPlayer.id);
	}
}

mVid.timeStampStartOfPlay = function (player) {
	if (player) {
		player.timestampStartPlay 	= Date.now();
		player.bTimePlayTransition 	= true;
		this.statusTableText(player.id, "Play trans", "");
	}
}
	

mVid.getBufferedAmount = function (player) {
	var buffer 	= player.buffered;
	var bufferEnd = 0;
	
	if (buffer.length > 1) {
		this.Log.error(player.id + ": Fragmented buffer, ie multiple buffer fragments. (" + buffer.length + ")");		
	}
		
	if (buffer.length > 0) {
		bufferEnd = buffer.end(buffer.length-1);
	} 
	
	return bufferEnd;
}

mVid.onVideoEvent = function (event) {
	var bufferingPlayer = mVid.getCurrentBufferingPlayer();
	var playingPlayer = mVid.getCurrentPlayingPlayer();

	var bufferingContentIdx = mVid.getBufferingContentIdx();
	var playingContentIdx = mVid.getPlayingContentIdx();
	
	var bBufferingWhilstAttemptingToPlay = (bufferingContentIdx === playingContentIdx);
	
	switch(event.type) {
		case mVid.videoEvents.LOAD_START:
			mVid.Log.info(this.id + ": video has started loading");
			mVid.updateBufferBar(this.id, "Event: " + event.type);
			// Sanity check
			/* TODO: why is this being generated for non buffering content???
			if (this != bufferingPlayer) {
				mVid.Log.warn(this.id + ": " + event.type + ": event for non buffering video object!");
			}
			*/
			if (this.readyState != HAVE_NOTHING) {
				mVid.Log.warn(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_NOTHING");
			}
			this.bufferSeqCheck = event.type;
			break;
			
		case mVid.videoEvents.LOADED_METADATA:
			mVid.Log.info(this.id + ": metadata has loaded");
			mVid.statusTableText(this.id, "Buffer", "Started buffering");
			mVid.updateBufferBar(this.id, "Event: " + event.type);
			// Sanity check
			if (this != bufferingPlayer) {
				mVid.Log.warn(this.id + ": " + event.type + ": event for non buffering video object!");
			}
			if (this.readyState != HAVE_METADATA) {
				mVid.Log.info(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_METADATA"); // TODO: Need to check this....
			}
			if (this.bufferSeqCheck != mVid.videoEvents.LOAD_START) {
				mVid.Log.warn(this.id + ": " + event.type + ": event sequence error!");
			}
			this.bufferSeqCheck = event.type;
			
			if (this === playingPlayer) {
				mVid.resetStallTimer();
			}
			break;
			
		case mVid.videoEvents.CAN_PLAY:
			mVid.Log.info(this.id + ": video can play");
			mVid.statusTableText(this.id, "Buffer", "Enough to start play");
			mVid.updateBufferBar(this.id, "Event: " + event.type);
				
			// Sanity check
			if (this != bufferingPlayer) {
				mVid.Log.error(this.id + ": " + event.type + ": event for non buffering video object!");
			}
			if (this.readyState != HAVE_FUTURE_DATA) {
				mVid.Log.info(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_FUTURE_DATA"); // TODO: Need to check this....
			}
			if (this.bufferSeqCheck != mVid.videoEvents.LOADED_METADATA) {
				mVid.Log.warn(this.id + ": " + event.type + ": event sequence error!");
			}
			this.bufferSeqCheck = event.type;
			
			
			if (mVid.getBufferedAmount(this) == 0) {
				mVid.Log.warn(this.id + ": Buffer should not still be empty!");				
			}

			this.bBuffEnoughToPlay = true;

			if (bBufferingWhilstAttemptingToPlay) {
				// Happens for first piece of content (or we're behind on buffering) - we can start playing now...
				mVid.switchPlayerToPlaying(this, null);
			} 

			if (this === playingPlayer) {
				mVid.resetStallTimer();
			}

			break;
			
		case mVid.videoEvents.CAN_PLAY_THROUGH:
			mVid.Log.info(this.id + ": buffered sufficiently to play-through.");
			mVid.statusTableText(this.id, "Buffer", "Can play through");
			mVid.updateBufferBar(this.id, "Event: " + event.type);

			// Sanity check
			if (this != bufferingPlayer) {
				mVid.Log.warn(this.id + ": " + event.type + ": event for non buffering video object!");
			}
			if (this.readyState != HAVE_ENOUGH_DATA) {
				mVid.Log.warn(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_ENOUGH_DATA");
			}
			if (this.bufferSeqCheck != mVid.videoEvents.CAN_PLAY) {
				mVid.Log.warn(this.id + ": " + event.type + ": event sequence error!");
			}
			this.bufferSeqCheck = event.type;

			if (mVid.getBufferedAmount(this) == 0) {
				mVid.Log.warn(this.id + ": Buffer should not still be empty!");				
			}
			
			this.bBuffEnoughToPlay = true;

			if (this === playingPlayer) {
				mVid.resetStallTimer();
			}

			if (bBufferingWhilstAttemptingToPlay && this.paused) {
				// Happens for first piece of content (or we're behind on buffering) - we can start playing now...
				mVid.switchPlayerToPlaying(this, null);
			} 

			break;
			
		case mVid.videoEvents.PLAY:
			mVid.Log.info(this.id + ": video is playing");
			mVid.statusTableText(this.id, "Play", "Playing");
			// mVid.statusTableText(this.id, "Buffer", "Being consumed");
			mVid.updateBufferBar(this.id, "");

			mVid.setPlayingState(PLAYSTATE_PLAY);
			
			// Sanity check
			if (this != playingPlayer) {
				mVid.Log.error(this.id + ": " + event.type + ": event for non playing video object!");
			}

			if (mVid.getBufferedAmount(this) == 0) {
				mVid.Log.warn(this.id + ": Buffer should not still be empty!");				
			}

			if ((this == playingPlayer) && !this.bPlayPauseTransition)
			{
				this.startPlaybackPointMS = this.currentTime * 1000;
					
				if (!bBufferingWhilstAttemptingToPlay) {
					// Right let's start buffering the next piece of content
					if (this == playingPlayer) {
						mVid.setContentSourceAndLoad();
					} else {
						mVid.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
					}
				}
			} else {
				this.bPlayPauseTransition = false;
			}
			break;
			
		case mVid.videoEvents.PAUSE:
			mVid.Log.info(this.id + ": video is paused");
			mVid.statusTableText(this.id, "Play", "Paused");
			mVid.updateBufferBar(this.id, "Event: " + event.type);

			// Sanity check
			if (this != playingPlayer) {
				mVid.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
			}

			if (this.bPlayPauseTransition) {
				mVid.setPlayingState(PLAYSTATE_PAUSE);
			} else
			{
				if (mVid.isMainFeaturePlayer(this)) {
					mVid.skipPlayingToNextPlayer();
					var newPlayingPlayer = mVid.getCurrentPlayingPlayer();

					mVid.timeStampStartOfPlay(newPlayingPlayer);
					if (newPlayingPlayer.bBuffEnoughToPlay) {
						mVid.switchPlayerToPlaying(newPlayingPlayer, this);
					} else {
						// oh dear - still buffering, not ready to play yet 
						mVid.switchPlayerToPlaying(null, this);				
					}
				}
			}
			break;
			
		case mVid.videoEvents.SEEKED:
			mVid.Log.info(this.id + ": video has seeked");
			mVid.updateBufferBar(this.id, "Event: " + event.type);
			// Sanity check
			if (this != playingPlayer) {
				mVid.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
			}
			break;
			
		case mVid.videoEvents.STALLED:
			mVid.Log.warn(this.id + ": has stalled");
			mVid.showBufferingIcon(true);
			mVid.updateBufferBar(this.id, "Event: " + event.type);
			break;
			
		case mVid.videoEvents.WAITING:
			mVid.Log.warn(this.id + ": is waiting");
			mVid.showBufferingIcon(true);
			mVid.updateBufferBar(this.id, "Event: " + event.type);
			break;
			
		case mVid.videoEvents.RESIZE:
			mVid.Log.info(this.id + ": resize called");
			mVid.updateBufferBar(this.id, "Event: " + event.type);
			break;
			
		case mVid.videoEvents.ENDED:
			mVid.statusTableText(this.id, "Buffer", "---");
			mVid.Log.info(this.id + ": video has ended");
			mVid.updateBufferBar(this.id, "Event: " + event.type);
			
			mVid.showBufferingIcon(true);
			mVid.setPlayingState(PLAYSTATE_STOP);

			if (this == playingPlayer) {
				mVid.Log.warn(this.id + ": end playback event for inactive (not playing) video object!");			
			}

			// Start playing buffered content
			if (mVid.isMainFeaturePlayer(this)) {
				// location.reload(); 
			} else {
				mVid.skipPlayingToNextPlayer();
				var newPlayingPlayer = mVid.getCurrentPlayingPlayer();
				
				mVid.timeStampStartOfPlay(newPlayingPlayer);
				if (newPlayingPlayer.bBuffEnoughToPlay) {
					mVid.switchPlayerToPlaying(newPlayingPlayer, this);
				} else {
					// oh dear - still buffering, not ready to play yet 
					mVid.switchPlayerToPlaying(null, this);				
				}
			}
			break;

		case mVid.videoEvents.TIME_UPDATE:
			mVid.statusTableText(this.id, "Pos", Math.floor(this.currentTime));
			mVid.updatePlaybackBar(this.id);
	
			// Start buffering next programme?
			if (bBufferingWhilstAttemptingToPlay) {
				var duration 	= this.duration;
				var bufferEnd 	= mVid.getBufferedAmount(this);
				var bPreloadNextAd = false;
				
				if ((mVid.isMainFeaturePlayer(this)) && (this === playingPlayer)) {
					if ((this.currentTime + PRELOAD_NEXT_AD_S) >= (this.restartPoint + mVid.getTransitionTime(this))) {
					bPreloadNextAd = true;
					mVid.setPreload(playingPlayer, "none");
					}
				} else {
					if ((this.currentTime + PRELOAD_NEXT_AD_S) >= duration) {
						bPreloadNextAd = true;
					}					
				}
				
				if (bPreloadNextAd) {
					mVid.Log.info(this.id + ": Commence buffering for next item");			
					mVid.skipBufferingToNextPlayer(); // Get ready to buffer next player
					mVid.setContentSourceAndLoad();

					if (this.bufferSeqCheck != mVid.videoEvents.CAN_PLAY_THROUGH) {
						mVid.Log.warn(this.id + ": " + event.type + ": event sequence error!");
					}
					mVid.updateBufferBar(this.id, "Preload next ad");
				}
			}
			
			// Now check playback
			var transTimeMS = Math.floor((this.currentTime * 1000) - this.startPlaybackPointMS);
			if ((this == playingPlayer) && this.bTimePlayTransition && (transTimeMS >= mVid.transitionThresholdMS)) {
				this.bTimePlayTransition = false;
				var playTransMS = Date.now() - this.timestampStartPlay - mVid.transitionThresholdMS;
				playTransMS = (playTransMS > 0) ? playTransMS : 0;
				mVid.statusTableText(this.id, "Play trans", playTransMS + "ms");
				mVid.postAdTrans(this.id, playTransMS);
			}
			
			// Time for adverts?
			if ((this == playingPlayer) && mVid.isMainFeaturePlayer(playingPlayer)) {
				if ((this.currentTime - this.restartPoint) >= mVid.getTransitionTime(this)) {
					mVid.Log.warn(this.id + ": transition main content");
					this.restartPoint = this.currentTime;
					this.bPlayPauseTransition = false;
					this.pause();
					mVid.updateBufferBar(this.id, "Play advert");
				}
			}

			if (this === playingPlayer) {
				mVid.resetStallTimer();
			}
			
			// Sanity check
			if (this != playingPlayer) {
				mVid.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
			}
			break;
			
		case mVid.videoEvents.ERROR:
			mVid.Log.error(this.id + ": video error: " + event.srcElement.error.code + " - " + mVid.eventErrorCodesMappingTable[event.srcElement.error.code]);
			mVid.updateBufferBar(this.id, "Event: " + event.type);
			break;
			
		case mVid.videoEvents.ENCRYPTED:
			e("encrypted").setAttribute("class", "playerIcon encrypted");
			mVid.Log.warn(this.id + ": ENCRYPTED");
			mVid.updateBufferBar(this.id, "Event: " + event.type);
			break;

		case mVid.videoEvents.SUSPEND:
		case mVid.videoEvents.ABORT:
		case mVid.videoEvents.EMPTIED:
		case mVid.videoEvents.LOADED_DATA:
		case mVid.videoEvents.PLAYING:
		case mVid.videoEvents.SEEKING:
		case mVid.videoEvents.DURATION_CHANGE:
		case mVid.videoEvents.RATE_CHANGE:
		case mVid.videoEvents.VOLUME_CHANGE:
			mVid.updateBufferBar(this.id, "Event: " + event.type);
			break;

		default:
			//do nothing
  }
};

mVid.resetStallTimer = function () {
	this.showBufferingIcon(false);
	if (this.stallTimerId) clearTimeout(this.stallTimerId);
	this.stallCount = 0;
	this.stallTimerId = setTimeout(this.OnCatchStall.bind(this), STALL_TIMEOUT_MS);
}

mVid.OnCatchStall = function () {
	var playingPlayer = this.getCurrentPlayingPlayer();
	
	if (!playingPlayer.bPlayPauseTransition) {
		this.Log.warn("Check Stall timer triggered!");
		this.Log.warn(" --- Network state: " + this.networkStateMappingTable[playingPlayer.networkState]);
		
		switch (this.stallCount) {
			case 0:
				this.showBufferingIcon(true);
				break;
				
			case 1:
				this.Log.warn("Stalled: re-call LOAD, in an attempt to recover");
				playingPlayer.load();
				break;

			case 2:
				this.Log.warn("Stalled: re-call PLAY, in an attempt to recover");
				playingPlayer.play();
				break;
		}
		if (this.stallCount++ > 2) this.stallCount = 1; // Note we go back to 1, not 0
		this.stallTimerId = setTimeout(this.OnCatchStall.bind(this), STALL_TIMEOUT_MS);
	}
}

mVid.OnKeyDown = function (e) {
	var keyCode = e.which || e.charCode || e.keyCode;
	var keyChar = String.fromCharCode(keyCode);
	var keyTableEntry = null;
	
	this.Log.info("KeyChar: " + keyChar);

	keyTableEntry = keyTable.entries.filter(function ( obj ) {
			return obj.key === keyChar;
		})[0];	
		
	if (!keyTableEntry) { 
		keyTableEntry = keyTable.entries.filter(function ( obj ) {
				return obj.hbbKey === keyCode;
			})[0];	
	}
	
	if (keyTableEntry && keyTableEntry.func) { 
		keyTableEntry.func.bind(this)(); 
	}	
}

mVid.cmndFastForward = function () {
	var playingPlayer = this.getCurrentPlayingPlayer();
	this.Log.info("called : cmndFastForward"); 

	if (playingPlayer) playingPlayer.playbackRate = 4;	
	this.setPlayingState(PLAYSTATE_FWD);
}	
	
mVid.cmndRewind = function () {
	var playingPlayer = this.getCurrentPlayingPlayer();
	this.Log.info("called : cmndRewind"); 
	
	if (playingPlayer) playingPlayer.playbackRate = -4;	
	this.setPlayingState(PLAYSTATE_REW);
}	
	
mVid.cmndPlay = function () {
	var playingPlayer = this.getCurrentPlayingPlayer();
	this.Log.info("called : cmndPlay"); 
	
	if (playingPlayer) {
		playingPlayer.playbackRate = 1;
		this.setPlayingState(PLAYSTATE_PLAY);
		if (playingPlayer.paused) {
			playingPlayer.bPlayPauseTransition = true;
			playingPlayer.play();
		}
	}
}	
	
mVid.cmndPause = function () {
	var playingPlayer = this.getCurrentPlayingPlayer();
	this.Log.info("called : cmndPause"); 
	
	if (playingPlayer && !playingPlayer.paused) {
		playingPlayer.bPlayPauseTransition = true;
		this.setPlayingState(PLAYSTATE_PAUSE);
		playingPlayer.pause();
	}
}	
	
mVid.cmndReload = function () {
	this.Log.info("called : cmndReload"); 
	// this.cmndLog();
	this.socket.disconnect();
	location.reload();
}	

mVid.cmndSeekFWD = function () {
	var playingPlayer = this.getCurrentPlayingPlayer();
	this.Log.info("called : cmndSeekFWD"); 

	playingPlayer.currentTime += 5;
}

mVid.cmndSeekBACK = function () {
	var playingPlayer = this.getCurrentPlayingPlayer();
	this.Log.info("called : cmndSeekBACK"); 
	
	playingPlayer.currentTime -= 5;
}

mVid.cmndLog = function () {
	var xhttp = new XMLHttpRequest();
	var fileName = extractDevName(navigator.userAgent) + "_debug_" + Date.now() + ".log";

	this.Log.info("Save file : " + fileName); 
	
	// send a xhr/ajax POST request with the serialized media events
	xhttp.open("POST", "/savelog?filename=" + fileName, true);
	xhttp.setRequestHeader("Content-type", "text/plain"); 
	xhttp.send(this.Log.logStr);
}

// TODO: need to forward ref funcs
keyTable.entries = [
	{ func : mVid.cmndFastForward, 	key : 'F', hbbKey : __VK_FAST_FWD 	}, 
	{ func : mVid.cmndRewind, 		key : 'R', hbbKey : __VK_REWIND 	}, 
	{ func : mVid.cmndPlay,			key : 'P', hbbKey : __VK_PLAY 		}, 
	{ func : mVid.cmndPause, 		key : 'S', hbbKey : __VK_PAUSE 		}, 
	{ func : mVid.cmndReload, 		key : 'L', hbbKey : __VK_RED 		}, 
	{ func : mVid.cmndSeekFWD,		key : 'J', hbbKey : __VK_RIGHT		}, 
	{ func : mVid.cmndSeekBACK,		key : 'B', hbbKey : __VK_LEFT		}, 
	{ func : mVid.cmndLog, 			key : 'D', hbbKey : __VK_BLUE		}, 
];
		
// Utility functions
function extractDevName(sUA) {
	var arr = sUA.match(/\bFVC\/2.0 \((\w*);(\w*)/) || ["", "Unknown", "Model"]; 
	return arr[1] + arr[2];
}