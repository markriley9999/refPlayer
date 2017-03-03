// TODO: improve exception handling
// TODO: use === instead of == where applic
// TODO: check can play content type
// TODO: put content in JSON file

// TODO: No trickmode on Panasonic - key filtering???
// TODO: sw version
// TODO: report multiple buffer fragments
// TODO: use better method for readystate mapping

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
		bBuffering : false, 
		src : "http://cdn.http.anno.test.channel4.com/m/1/174055/7/2047111/MUM-HATD170-020_1462888808_93626_17.mp4", 
		type : "video/mp4",
		transitionTime : -1
	},
	{
		playerId : "mVid-video1", 
		bBuffering : false, 
		src : "http://cdn.http.anno.test.channel4.com/m/1/174055/78/1340110/CH4_31_02_50_GRY_BHFN133_040_001_93614_17.mp4", 
		type : "video/mp4",
		transitionTime : -1
	},
	{
		playerId : "mVid-video0", 
		bBuffering : false, 
		src : "http://cdn.http.anno.test.channel4.com/m/1/174055/77/1340109/CH4_31_02_50_AMV_SYPR030_030_001_93613_17.mp4", 
		type : "video/mp4",
		transitionTime : -1
	},
	{
		playerId : "mVid-video1",  
		bBuffering : false, 
		src : "http://cdn.http.anno.test.channel4.com/m/1/174055/110/1858926/CH4_31_02_50_CH4154DGGEN00021I01_002_1462888026_93623_17.mp4", 
		type : "video/mp4",
		transitionTime : -1
	},
	{
		playerId : "mVid-mainContent", 
		bBuffering : false, 
//		src : "http://itvpnp-usp.test.ott.irdeto.com/MONITOR/SAMPLES/1-8647-0243-001-DVBDASH-CLEARKEY.ism/.mpd",
		src : "http://rdmedia.bbc.co.uk/dash/ondemand/bbb/2/client_manifest-common_init.mpd",
		type : "application/dash+xml",
		transitionTime : 60	
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

e = function (id) {
  return document.getElementById(id);
}

window.onload = function () {
	try {
		mVid.start();
	} catch (error) {
		this.Log.error("FATAL ERROR: " + error.message);
	}
}

mVid.start = function () {
	var mainVideo;
    var appMan 		= null, app;
	var that 		= this;
	var confManager = null;
	
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
        app = appMan.getOwnerApplication(document);
    } catch (err) {
        this.Log.warn("Exception when getting the owner Application object. Error: " + err.message);
    }

    try {
        app.show();
    } catch (err) {
        this.Log.warn("Exception when calling show() on the owner Application object. Error: " + err.message);
    }

	this.checkForDeviceWorkArounds();
	
	mainVideo = e("mVid-mainContent");
	
	this.createPlayer("mVid-video0");
	this.createPlayer("mVid-video1");

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
		elTimer.innerHTML = that.msToTime(Date.now() - that.startTime);
	
		that.updateBufferBars();	
	}, 250);
	
	
    try {
		var myKeyset = app.privateData.keyset;
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

mVid.checkForDeviceWorkArounds = function () {
	var userAgent = navigator.userAgent.toLowerCase();
	var info;
	
	this.Log.info("Check For Device WorkArounds");

	this.options = {};
	this.options.bSeekToResume 	= false;
	this.options.bNoDash		= false;
	this.options.bKeepPlayers 	= false;
	
	mVid.devTextNameForInfo = "";
	
	for (var i = 0; i < mVid.deviceWorkarounds.length; i++) {
		if (userAgent.indexOf(mVid.deviceWorkarounds[i].dev.toLowerCase()) >= 0) {
				info = mVid.deviceWorkarounds[i].info;
				mVid.devTextNameForInfo = info;
				mVid.deviceWorkarounds[i].devFunc.bind(this)(info);
				break;
		} 
	}

	var manuWorkaroundId = getUrlVars()["manu"];
	this.Log.info("Manufacturer Workaround Id: " + manuWorkaroundId);
	
	if (manuWorkaroundId && manuWorkaroundId.toLowerCase() == "seektoresume") {
		this.Log.warn("Use Seek-To-Resume workaround");		
		this.options.bSeekToResume = true;
	}
		
	var contentOverride = getUrlVars()["cont"];
	this.Log.info("Content override: " + contentOverride);
	
	if (contentOverride && contentOverride.toLowerCase() == "nodash") {
		this.options.bNoDash = true;
	}

	var keepObj = getUrlVars()["keepobj"];
	this.Log.info("Keep Obj: " + keepObj);
	
	if (keepObj && keepObj == "1") {
		this.options.bKeepPlayers = true;
	}
	
	
	//if (this.options.bNoDash) {
	//	var idx = content.list.length-1;
	//	// Browser can't play dash... (well it can is you use the relevant js lib)
	//	this.Log.warn("Don't use dash (use mp4 content instead)");	
	//	content.list[idx].src = "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4";
	//	content.list[idx].type = "video/mp4";
	//	content.list[idx].transitionTime = 25;
	//}
	
}

mVid.deviceHumax = function (txtDescr) {
	this.Log.info("Device Info: " + txtDescr);
	this.Log.warn("*** Use Seek-To-Resume workaround");		
	this.options.bSeekToResume = true;
}

mVid.deviceGeneral = function (txtDescr) {
	this.Log.info("Device Info: " + txtDescr);
}

mVid.devicePC = function (txtDescr) {
	this.Log.info("Device Info: " + txtDescr);
	this.Log.warn("*** Don't use DASH");		
	// this.options.bNoDash = true;
}

// Device workarounds - todo - why after func defns????
mVid.deviceWorkarounds = [
	{ dev : "Humax", 		devFunc : mVid.deviceHumax,		info : "Humax"			},
	{ dev : "MB100", 		devFunc : mVid.deviceGeneral,	info : "Vestel"			},
	{ dev : "Panasonic", 	devFunc : mVid.deviceGeneral,	info : "Panasonic"		},
	{ dev : "Hisense", 		devFunc : mVid.deviceGeneral,	info : "Hisense"		},
	{ dev : "MStar", 		devFunc : mVid.deviceGeneral,	info : "MStar"			},
	{ dev : "Windows", 		devFunc : mVid.devicePC,		info : "PC Windows"		},
];

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
	
	this.timeStampStartOfPlay(player);
	
	return player;
}

mVid.purgePlayer = function (playerId) {
	this.Log.info("purgePlayer: " + playerId);

	var player = e(playerId);
	
	if (!this.options.bKeepPlayers) {
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
	} else {
		this.Log.error("Player purposely not destroyed!");
		if (player) {
			var source = e(player.id + "-source");
			source.id = "source-" + Date.now();
			
			player.style.display = "none";
			player.id = "video-" + Date.now();
		}
	}
}

mVid.purgeAndRecreatePlayers = function () {
	this.Log.info("purgeAndRecreatePlayers");
	
	this.purgePlayer("mVid-video0");
	this.purgePlayer("mVid-video1");
	this.createPlayer("mVid-video0");
	this.createPlayer("mVid-video1");
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
	this.updateBufferBar("mVid-mainContent");
	this.updateBufferBar("mVid-video0");
	this.updateBufferBar("mVid-video1");
} 

mVid.updateBufferBar = function(playerId) {
	var playerBuffer 	= e(playerId + "-bufferBar");
	var headroomBuffer 	= e(playerId + "-headroomBar");
	var player 			= e(playerId);
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

mVid.updatePlaybackBar = function(playerId) {
	var playerBar 		= e("playbackBar");
	var player 			= e(playerId);
	var duration 		= player.duration;
	
	if (duration && (duration > 0)) {
		playerBar.max = duration;
		playerBar.value = player.currentTime;
	} else
	{
		playerBar.value = 0;	
		playerBar.max = 100;	
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
				playEl.style.display = "block";
			} else {
				playEl.style.display = "none";				
			}
		}
	}
}

mVid.postStatusUpdate = function (id, text) {
	var out = "id=" + id + "&" + "text=" + text;

	// send a xhr/ajax POST request with the serialized media events
	var xhttp = new XMLHttpRequest();
	xhttp.open("POST", "/status", true);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
	xhttp.send(out);
}

mVid.statusTableText = function (playerId, textEntry, text) {
	this.postStatusUpdate("e_" + playerId + "_" + textEntry, text);
}

mVid.getCurrentBufferingPlayer = function () {
	//this.Log.info("getCurrentBufferingPlayer: " + content.list[content.currentBufferingIdx].playerId);
	var idx = content.currentBufferingIdx;
	
	if (content.list[idx].bBuffering) {
		return e(content.list[idx].playerId);
	} else {
		return null;
	}
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

	content.list[content.currentBufferingIdx].bBuffering = true;
	player = this.getCurrentBufferingPlayer();
	this.Log.info(player.id + " setContentSourceAndLoad - currentBufferingIdx: " + content.currentBufferingIdx);
	
	this.setSourceAndLoad(player, content.list[content.currentBufferingIdx].src, content.list[content.currentBufferingIdx].type);
}

mVid.skipBufferingToNextPlayer = function () {
	content.list[content.currentBufferingIdx].bBuffering = false;
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
		dashjs.MediaPlayerFactory.create(player, source);
		player.load();
	} else {
		if (this.options.bSeekToResume) {
			this.Log.warn("*** Seek-to-resume workaround - set currentTime to: " + player.restartPoint);
			player.currentTime = player.restartPoint;
			this.Log.warn("*** Seek-to-resume workaround - re-call load");
			player.load();
		}
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
	
	// Seek-to-resume workaround
	if (freshPlayer && (this.options.bSeekToResume) && this.isMainFeaturePlayer(freshPlayer)) {
			this.Log.warn("*** Seek-to-resume workaround - set currentTime to: " + freshPlayer.restartPoint);
			freshPlayer.currentTime = freshPlayer.restartPoint;
	}

	// Set the display CSS property of the previous media element to none.
	if (previousPlayer) {
		previousPlayer.style.display = "none";
	}
	
	if (freshPlayer) {
		this.postStatusUpdate("PlayCount", ++this.playCount);
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
			mVid.updateBufferBar(this.id);
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
			mVid.updateBufferBar(this.id);
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
			mVid.updateBufferBar(this.id);
			
			
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

/*			
			this.bBuffEnoughToPlay = true;

			if (bBufferingWhilstAttemptingToPlay) {
				// Happens for first piece of content (or we're behind on buffering) - we can start playing now...
				mVid.switchPlayerToPlaying(this, null);
			} 
*/
			if (this === playingPlayer) {
				mVid.resetStallTimer();
			}
			break;
			
		case mVid.videoEvents.CAN_PLAY_THROUGH:
			mVid.Log.info(this.id + ": buffered sufficiently to play-through.");
			mVid.statusTableText(this.id, "Buffer", "Can play through");
			mVid.updateBufferBar(this.id);

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
			mVid.updateBufferBar(this.id);

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
					
				// If main content is playing, purge the advert video objects
				if (mVid.isMainFeaturePlayer(this)) {
					mVid.purgeAndRecreatePlayers();
				}
				
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
			// Sanity check
			if (this != playingPlayer) {
				mVid.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
			}
			break;
			
		case mVid.videoEvents.STALLED:
			mVid.Log.warn(this.id + ": has stalled");
			mVid.showBufferingIcon(true);
			break;
			
		case mVid.videoEvents.WAITING:
			mVid.Log.warn(this.id + ": is waiting");
			mVid.showBufferingIcon(true);
			break;
			
		case mVid.videoEvents.RESIZE:
			mVid.Log.info(this.id + ": resize called");
			break;
			
		case mVid.videoEvents.ENDED:
			mVid.statusTableText(this.id, "Buffer", "---");
			mVid.Log.info(this.id + ": video has ended");
			
			mVid.showBufferingIcon(true);
			mVid.setPlayingState(PLAYSTATE_STOP);

			if (this == playingPlayer) {
				mVid.Log.warn(this.id + ": end playback event for inactive (not playing) video object!");			
			}

			// Start playing buffered content
			if (mVid.isMainFeaturePlayer(this)) {
				location.reload(); 
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
				
				if (mVid.isMainFeaturePlayer(playingPlayer)) {
					if ((this.currentTime + PRELOAD_NEXT_AD_S) >= mVid.getTransitionTime(playingPlayer)) {
						bPreloadNextAd = true;
						mVid.setPreload(playingPlayer, "none");
					}
				} else {
					if ((this.currentTime + PRELOAD_NEXT_AD_S) >= duration) {
						bPreloadNextAd = true;
					}					
				}
				
				if (bPreloadNextAd) {
					mVid.statusTableText(this.id, "Buffer", "Buffering complete");
					mVid.Log.info(this.id + ": Content fully buffered");			
					mVid.skipBufferingToNextPlayer(); // Get ready to buffer next player
					mVid.setContentSourceAndLoad();

					if (this.bufferSeqCheck != mVid.videoEvents.CAN_PLAY_THROUGH) {
						mVid.Log.warn(this.id + ": " + event.type + ": event sequence error!");
					}
				}
			}
			
			// Now check playback
			var transTimeMS = Math.floor((this.currentTime * 1000) - this.startPlaybackPointMS);
			if ((this == playingPlayer) && this.bTimePlayTransition && (transTimeMS >= mVid.transitionThresholdMS)) {
				this.bTimePlayTransition = false;
				var playTransMS = Date.now() - this.timestampStartPlay - mVid.transitionThresholdMS;
				playTransMS = (playTransMS > 0) ? playTransMS : 0;
				mVid.statusTableText(this.id, "Play trans", playTransMS + "ms");
			}
			
			if ((this == playingPlayer) && mVid.isMainFeaturePlayer(playingPlayer)) {
				if ((this.currentTime - this.restartPoint) >= mVid.getTransitionTime(playingPlayer)) {
					mVid.Log.info(this.id + ": transition main content");
					this.restartPoint = this.currentTime;
					this.bPlayPauseTransition = false;
					this.pause();
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
			break;
			
		case mVid.videoEvents.ENCRYPTED:
			mVid.Log.warn(this.id + ": ENCRYPTED");
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
	
mVid.cmndInfo = function () {
	this.Log.info("called : cmndInfo"); 
		
	var logEl = e("log");
	
	if (logEl.style.display != "none") {
		logEl.style.display = "none";			
	} else {
		logEl.style.display = "block";	
	}
}	
	
mVid.cmndReload = function () {
	this.Log.info("called : cmndReload"); 
	location.reload();
}	

mVid.objToString = function (obj, bCheckHasOwnObject) {
    var str = '';
    for (var p in obj) {
        if (!bCheckHasOwnObject || obj.hasOwnProperty(p)) {
            str += " --- " + p + '::' + obj[p] + '\n';
        }
    }
    return str;
}

mVid.dumpVideoObject = function (obj) {
    var str = '';
	var propList = [
		"autoplay",
		"bBuffEnoughToPlay",
		"bPlayPauseTransition",
		"baseURI",
		"buffered",
		"TimeRanges",
		"className",
		"clientHeight",
		"clientLeft",
		"clientTop",
		"clientWidth",
		"currentSrc",
		"currentTime",
		"defaultPlaybackRate",
		"duration",
		"ended",
		"error",
		"height",
		"hidden",
		"id",
		"innerHTML",
		"networkState",
		"outerHTML",
		"playbackRate",
		"played",
		"TimeRanges",
		"poster",
		"readyState",
		"restartPoint",
		"seekable",
		"TimeRanges",
		"seeking",
		"src",
		// "style",
		"textContent",
		"textTracks",
		"TextTrackList",
		"title",
		"videoHeight",
		"videoWidth",
		"volume",
		"width",
	];
	
	var childObj;
	
	for (var i=0; i < propList.length; i++) {
		childObj = obj[propList[i]];
        str += propList[i] + '::' + childObj + '\n';
		if (typeof childObj === 'object') {
			str += mVid.objToString(childObj, false);
		}
	}
    return str;
};

mVid.cmndDebug = function () {
	var that = this;
	
	this.Log.info("called : cmndDebug"); 
	
	var playerContainer = e("player-container");
	var strToSend;
	var xhttp = new XMLHttpRequest();
	var strFileName = mVid.devTextNameForInfo + "_debug_" + Date.now() + ".log";
	
	strToSend = "<------------------------------ START OF LOG ------------------------------>\n\n"
	strToSend += "filename=" + strFileName + "\n\n";
	strToSend += "\n--- User Agent ---\n\n";
	strToSend += navigator.userAgent + "\n\n";

	strToSend += "\n--- Play Debug Log ---\n\n";
	strToSend += this.Log.getStr(); + "\n\n";
	
	for (var i = 0; i < playerContainer.childNodes.length; i++) {
		if (playerContainer.childNodes[i].nodeName === 'VIDEO') {	
			strToSend += "\nVideo Object dump\n";
			strToSend += "------------------------------------\n\n";
			strToSend += this.dumpVideoObject(playerContainer.childNodes[i]);
			strToSend += "\n\n";
		}
	}

	strToSend += "\n\n<------------------------------   END OF LOG ------------------------------>\n\n"

	xhttp.onreadystatechange = function() {
	  if (xhttp.readyState == 4 && xhttp.status == 200) {
		that.Log.warn("SERVER response: " + xhttp.responseText);
	  }
	};	
	
	console.log(strToSend);
	
	xhttp.open("POST", "php/savelog.php?filename=" + strFileName, true);
	xhttp.send(strToSend);
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

// TODO: need to forward ref funcs
keyTable.entries = [
	{ func : mVid.cmndFastForward, 	key : 'F', hbbKey : __VK_FAST_FWD 	}, 
	{ func : mVid.cmndRewind, 		key : 'R', hbbKey : __VK_REWIND 	}, 
	{ func : mVid.cmndPlay,			key : 'P', hbbKey : __VK_PLAY 		}, 
	{ func : mVid.cmndPause, 		key : 'S', hbbKey : __VK_PAUSE 		}, 
	{ func : mVid.cmndInfo,			key : 'I', hbbKey : __VK_INFO 		}, 
	{ func : mVid.cmndInfo,			key : 'I', hbbKey : __VK_GREEN 		}, 
	{ func : mVid.cmndReload, 		key : 'L', hbbKey : __VK_RED 		}, 
	{ func : mVid.cmndDebug, 		key : 'D', hbbKey : __VK_BLUE		}, 
	{ func : mVid.cmndSeekFWD,		key : 'J', hbbKey : __VK_RIGHT		}, 
	{ func : mVid.cmndSeekBACK,		key : 'B', hbbKey : __VK_LEFT		}, 
];
		
// Utility functions
function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}
