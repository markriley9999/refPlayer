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
content.list = [];

// Play states
const PLAYSTATE_STOP	= 0;
const PLAYSTATE_PLAY	= 1;
const PLAYSTATE_PAUSE	= 2;
const PLAYSTATE_REW		= 3;
const PLAYSTATE_FWD		= 4;

const STALL_TIMEOUT_MS = 10000;

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
	console.log("ERROR: " + message);
};

mVid.Log.warn = function (message) {
	this._write("WARN: " + message, "warn");
	console.log("WARN: " + message);
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
	mVid.Log.warn("Unload page");
	mVid.cmndLog();
	mVid.socket.disconnect();
}

mVid.start = function () {
    var appMan 		= null;
	var that 		= this;
	var confManager = null;
	
	this.socket = io();

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

	if (this.app) {
		try {
			this.app.show();
		} catch (err) {
			this.Log.warn("Exception when calling show() on the owner Application object. Error: " + err.message);
		}

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
	}
	
	this.showPlayrange();
	
	getCookie = function (cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i = 0; i <ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length,c.length);
			}
		}
		return "";
	}

	var currentChannel = getCookie("channel");

	getPlaylist(currentChannel || "1", function(ch, playlistObj) {		
		var mainVideo;

		that.procPlaylist(ch, playlistObj);

		mainVideo = e("mVid-mainContent");

		mainVideo.resumeFrom 			= 0;
		mainVideo.bPlayPauseTransition 	= false;
		mainVideo.bBuffEnoughToPlay 	= false;
		that.transitionThresholdMS 		= 1000;
		that.bShowBufferingIcon			= false;
		
		
		for(var i in that.videoEvents) {
			mainVideo.addEventListener(that.videoEvents[i], onVideoEvent(that));
		}

		// Cues
		mainVideo.textTracks.onaddtrack = function (event) {
			var textTrack = event.track;

			// TODO: Fix this!
			// cuechange event is registered and cues in activeCues list are checked when event occurs
			textTrack.oncuechange = function () {

				if (textTrack.activeCues.length > 0) {

					for (var i = 0; i < textTrack.activeCues.length; ++i) {

						var cue = textTrack.activeCues[i];

						if (cue !== null) {
							var f = e("flag");
							
							that.Log.error("textTrack - kind: " + textTrack.kind + " label: " +  textTrack.label + " id: " + textTrack.id);			
							that.Log.error("Cue - start: " + cue.startTime + " end: " +  cue.endTime + " id: " + cue.id);
							
							f.setAttribute("class", "playerIcon flag");
							that.updateBufferBar(mainVideo.id, "Event: Cue Start");
							f.innerHTML = "ID: " + cue.id;
							
							cue.onexit = function (ev) {
								f.setAttribute("class", "playerIcon");
								that.updateBufferBar(mainVideo.id, "Event: Cue End");
								f.innerHTML = "";
							}
							return;
						}
					}
				}
			}
		};		
		
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

		if ("MediaKeys" in window) {
			SetupEME(mainVideo, KEYSYSTEM_TYPE, "video", options);
		}
			
		that.showBufferingIcon(false);
		that.setPlayingState(PLAYSTATE_STOP);
		
		document.addEventListener("keydown", that.OnKeyDown.bind(that));
		
		that.setContentSourceAndLoad();
		that.resetStallTimer();
		
		window.setInterval( function() {
			var elTimer = e("videoTimer");

			// elTimer.innerHTML = ("00000000" + (Date.now() - that.startTime)).slice(-8);
			if (elTimer) {
				elTimer.innerHTML = that.msToTime(Date.now() - that.startTime);
			}
			
			that.updateBufferBars();	
		}, 1000);	
	});
};

mVid.procPlaylist = function (ch, playlistObj) {
	var c = content.list;
	
	this.Log.info("- New playlist: " + JSON.stringify(playlistObj));
	
	c.length = playlistObj.ads.length + 1;
	c[playlistObj.ads.length] = {};
	c[playlistObj.ads.length].src 				= playlistObj.src;
	c[playlistObj.ads.length].type 				= playlistObj.type;
	c[playlistObj.ads.length].transitionTime 	= playlistObj.transitionTime;
	c[playlistObj.ads.length].playerId 			= "mVid-mainContent";
	c[playlistObj.ads.length].channelName		= playlistObj.channelName;
	
	var pId = "mVid-video0";
	
	for (var i = 0; i < playlistObj.ads.length; i++) {
		//this.Log.info("- Ad: " + i + " " + playlistObj.ads[i].src);	
		//this.Log.info("- Ad: " + i + " " + playlistObj.ads[i].type);	
		c[i] = {};
		c[i].src 			= playlistObj.ads[i].src;
		c[i].type 			= playlistObj.ads[i].type;
		c[i].transitionTime = -1;
		c[i].playerId 		= pId;
		c[i].channelName	= playlistObj.channelName;
		pId = (pId === "mVid-video0") ? "mVid-video1" : "mVid-video0";
	}
	
	this.Log.info("---- Content List ----");	
	for (var i = 0; i < c.length; i++) {
		this.Log.info(" - " + c[i].channelName);	
		this.Log.info(" - " + c[i].src);	
		this.Log.info(" - " + c[i].type);	
		this.Log.info(" - " + c[i].playerId);	
		this.Log.info(" - " + c[i].transitionTime);	
		this.Log.info(" - ");			
	}
	
	e("currentChannel") && (e("currentChannel").innerHTML = "Ch " + ch + " - " + playlistObj.channelName);
}

mVid.reload = function () {
	this.cmndLog();
    this.socket.on("disconnect", function(){
        console.log("client disconnected from server");
		location.reload();
    });

	this.socket.disconnect();	
}

mVid.setChannel = function (idx) {
	
	setCookie = function (cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires;
	}

	setCookie("channel", idx, 28);
	
	this.reload();
}

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
		player.addEventListener(this.videoEvents[i], onVideoEvent(this));
	}

	this.statusTableText(playerId, "Play", "---");
	this.statusTableText(playerId, "Buffer", "---");
	this.statusTableText(playerId, "Type", "---");
	this.statusTableText(playerId, "Pos", "---");

	player.bPlayPauseTransition = false;
	player.resumeFrom = 0;
	
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
		pbObj += "\"resumeFrom\":" + JSON.stringify('' + player.resumeFrom) + ",";
		pbObj += "\"duration\":" + JSON.stringify('' + player.duration) + ",";
	} else {
		pbObj += "\"class\":\"bufferBar\",";
		pbObj += "\"value\":\"0\","; 
		pbObj += "\"max\":\"0\",";
		pbObj += "\"currentTime\":\"0\",";
		pbObj += "\"resumeFrom\":\"0\",";
		pbObj += "\"duration\":\"0\",";	
	}
	pbObj += "\"time\":" + JSON.stringify('' + (Date.now() - this.startTime) / 1000) + ",";
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
	
	if (content.list[idx]){
		return e(content.list[idx].playerId);
	} else {
		return null;
	}
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
	var i = parseInt(content.list[content.currentPlayingIdx].transitionTime);
	
	return (i != -1) ? i : Number.MAX_SAFE_INTEGER;
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
		source.setAttribute("type", type);	
		source.setAttribute("src", src);
		player.bBuffEnoughToPlay = false;
		// Running on a non hbbtv device?
		if (!this.app) {
			dashjs.MediaPlayerFactory.create(player, source);
		}
		//this.setPreload(player, "auto");
		player.load();
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
		this.Log.warn(player.id + ": Fragmented buffer, ie multiple buffer fragments. (" + buffer.length + ")");		
	}
		
	if (buffer.length > 0) {
		bufferEnd = buffer.end(buffer.length-1);
	} 
	
	return bufferEnd;
}

mVid.showPlayrange = function () {
	var p = this.getCurrentPlayingPlayer();
	
	var c = e("playbackBar").getBoundingClientRect();
	var offset = e("ad-start-point").getBoundingClientRect().width / 2;

	var x1, x2;
	
	if (!p || !this.isMainFeaturePlayer(p)) {
		x1 = c.left;
		x2 = c.right;			
	} else {
		var coef = (c.width / p.duration);
		var t = this.getTransitionTime();
		x1 =  (coef * p.resumeFrom) + c.left;
		var endP = (p.resumeFrom + t > p.duration) ? p.duration : p.resumeFrom + t;
		
		x2 =  (coef * endP) + c.left;
	}
	
	e("ad-start-point").style.left 	= (x1 - offset) + "px";
	e("ad-resume-point").style.left = (x2 - offset) + "px";			
}

function onVideoEvent (v) {
	return function (event) {
		var bufferingPlayer = v.getCurrentBufferingPlayer();
		var playingPlayer = v.getCurrentPlayingPlayer();

		var bufferingContentIdx = v.getBufferingContentIdx();
		var playingContentIdx = v.getPlayingContentIdx();
		
		var bBufferingWhilstAttemptingToPlay = (bufferingContentIdx === playingContentIdx);
		
		switch(event.type) {
			case v.videoEvents.LOAD_START:
				v.Log.info(this.id + ": video has started loading");
				v.updateBufferBar(this.id, "Event: " + event.type);
				// Sanity check
				/* TODO: why is this being generated for non buffering content???
				if (this != bufferingPlayer) {
					v.Log.warn(this.id + ": " + event.type + ": event for non buffering video object!");
				}
				*/
				if (this.readyState != HAVE_NOTHING) {
					v.Log.warn(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_NOTHING");
				}
				this.bufferSeqCheck = event.type;
				break;
				
			case v.videoEvents.LOADED_METADATA:
				v.Log.info(this.id + ": metadata has loaded");
				v.statusTableText(this.id, "Buffer", "Started buffering");
				v.updateBufferBar(this.id, "Event: " + event.type);
				// Sanity check
				if (this != bufferingPlayer) {
					v.Log.warn(this.id + ": " + event.type + ": event for non buffering video object!");
				}
				if (this.readyState != HAVE_METADATA) {
					v.Log.info(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_METADATA"); // TODO: Need to check this....
				}
				if (this.bufferSeqCheck != v.videoEvents.LOAD_START) {
					v.Log.warn(this.id + ": " + event.type + ": event sequence error!");
				}
				this.bufferSeqCheck = event.type;
				
				if (this === playingPlayer) {
					v.resetStallTimer();
				}
				break;
				
			case v.videoEvents.CAN_PLAY:
				v.Log.info(this.id + ": video can play");
				v.statusTableText(this.id, "Buffer", "Enough to start play");
				v.updateBufferBar(this.id, "Event: " + event.type);
					
				// Sanity check
				if (this != bufferingPlayer) {
					v.Log.error(this.id + ": " + event.type + ": event for non buffering video object!");
				}
				if (this.readyState != HAVE_FUTURE_DATA) {
					v.Log.info(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_FUTURE_DATA"); // TODO: Need to check this....
				}
				if (this.bufferSeqCheck != v.videoEvents.LOADED_METADATA) {
					v.Log.warn(this.id + ": " + event.type + ": event sequence error!");
				}
				this.bufferSeqCheck = event.type;
				
				
				if (v.getBufferedAmount(this) == 0) {
					v.Log.warn(this.id + ": Buffer should not still be empty!");				
				}

				this.bBuffEnoughToPlay = true;

				if (bBufferingWhilstAttemptingToPlay) {
					// Happens for first piece of content (or we're behind on buffering) - we can start playing now...
					v.switchPlayerToPlaying(this, null);
				} 

				if (this === playingPlayer) {
					v.resetStallTimer();
				}

				break;
				
			case v.videoEvents.CAN_PLAY_THROUGH:
				v.Log.info(this.id + ": buffered sufficiently to play-through.");
				v.statusTableText(this.id, "Buffer", "Can play through");
				v.updateBufferBar(this.id, "Event: " + event.type);

				// Sanity check
				if (this != bufferingPlayer) {
					v.Log.warn(this.id + ": " + event.type + ": event for non buffering video object!");
				}
				if (this.readyState != HAVE_ENOUGH_DATA) {
					v.Log.warn(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_ENOUGH_DATA");
				}
				if (this.bufferSeqCheck != v.videoEvents.CAN_PLAY) {
					v.Log.warn(this.id + ": " + event.type + ": event sequence error!");
				}
				this.bufferSeqCheck = event.type;

				if (v.getBufferedAmount(this) == 0) {
					v.Log.warn(this.id + ": Buffer should not still be empty!");				
				}
				
				this.bBuffEnoughToPlay = true;

				if (this === playingPlayer) {
					v.resetStallTimer();
				}

				if (bBufferingWhilstAttemptingToPlay && this.paused) {
					// Happens for first piece of content (or we're behind on buffering) - we can start playing now...
					v.switchPlayerToPlaying(this, null);
				} 

				break;
				
			case v.videoEvents.PLAY:
				v.Log.info(this.id + ": video is playing");
				v.statusTableText(this.id, "Play", "Playing");
				// v.statusTableText(this.id, "Buffer", "Being consumed");
				v.updateBufferBar(this.id, "");

				v.setPlayingState(PLAYSTATE_PLAY);
				v.showPlayrange();
				
				// Sanity check
				if (this != playingPlayer) {
					v.Log.error(this.id + ": " + event.type + ": event for non playing video object!");
				}

				if (v.getBufferedAmount(this) == 0) {
					v.Log.warn(this.id + ": Buffer should not still be empty!");				
				}

				if ((this == playingPlayer) && !this.bPlayPauseTransition) {
					this.startPlaybackPointMS = this.currentTime * 1000;
				} else {
					this.bPlayPauseTransition = false;
				}
				
				// Sanity check
				if (v.isMainFeaturePlayer(this) && (this == playingPlayer) && (playingPlayer.currentTime < playingPlayer.resumeFrom)) {
					v.Log.error(this.id + ": resume error (currentTime < resume point)");
					playingPlayer.currentTime = playingPlayer.resumeFrom;
				}
				break;
				
			case v.videoEvents.PAUSE:
				v.Log.info(this.id + ": video is paused");
				v.statusTableText(this.id, "Play", "Paused");
				v.updateBufferBar(this.id, "Event: " + event.type);

				// Sanity check
				if (this != playingPlayer) {
					v.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
				}

				if (this.bPlayPauseTransition) {
					v.setPlayingState(PLAYSTATE_PAUSE);
				} else
				{
					if (v.isMainFeaturePlayer(this)) {
						v.skipPlayingToNextPlayer();
						var newPlayingPlayer = v.getCurrentPlayingPlayer();

						v.timeStampStartOfPlay(newPlayingPlayer);
						if (newPlayingPlayer.bBuffEnoughToPlay) {
							v.switchPlayerToPlaying(newPlayingPlayer, this);
						} else {
							// oh dear - still buffering, not ready to play yet 
							v.switchPlayerToPlaying(null, this);				
						}
					}
				}
				break;
				
			case v.videoEvents.SEEKED:
				v.Log.info(this.id + ": video has seeked");
				v.updateBufferBar(this.id, "Event: " + event.type);
				// Sanity check
				if (this != playingPlayer) {
					v.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
				}
				break;
				
			case v.videoEvents.STALLED:
				v.Log.warn(this.id + ": has stalled");
				v.showBufferingIcon(true);
				v.updateBufferBar(this.id, "Event: " + event.type);
				break;
				
			case v.videoEvents.WAITING:
				v.Log.warn(this.id + ": is waiting");
				v.showBufferingIcon(true);
				v.updateBufferBar(this.id, "Event: " + event.type);
				break;
				
			case v.videoEvents.RESIZE:
				v.Log.info(this.id + ": resize called");
				v.updateBufferBar(this.id, "Event: " + event.type);
				break;
				
			case v.videoEvents.ENDED:
				v.statusTableText(this.id, "Buffer", "---");
				v.Log.info(this.id + ": video has ended");
				v.updateBufferBar(this.id, "Event: " + event.type);
				
				v.showBufferingIcon(true);
				v.setPlayingState(PLAYSTATE_STOP);

				if (this == playingPlayer) {
					v.Log.warn(this.id + ": end playback event for inactive (not playing) video object!");			
				}

				// Start playing buffered content
				if (v.isMainFeaturePlayer(this)) {
					v.Log.info(this.id + ": video has ended - reload");
					//this.resumeFrom = 0;
					//this.currentTime = 0;
					v.reload(); 
				} else {
					v.skipPlayingToNextPlayer();
					var newPlayingPlayer = v.getCurrentPlayingPlayer();
					
					v.timeStampStartOfPlay(newPlayingPlayer);
					if (newPlayingPlayer.bBuffEnoughToPlay) {
						v.switchPlayerToPlaying(newPlayingPlayer, this);
					} else {
						// oh dear - still buffering, not ready to play yet 
						v.switchPlayerToPlaying(null, this);				
					}
				}
				break;

			case v.videoEvents.TIME_UPDATE:
				v.statusTableText(this.id, "Pos", Math.floor(this.currentTime));
				v.updatePlaybackBar(this.id);
		
				// Start buffering next programme?
				if (bBufferingWhilstAttemptingToPlay) {
					var duration 	= this.duration;
					var bufferEnd 	= v.getBufferedAmount(this);
					var bPreloadNextAd = false;
					
					if (this === playingPlayer) {
						if (v.isMainFeaturePlayer(this)) {
							if ((this.currentTime + PRELOAD_NEXT_AD_S) >= (this.resumeFrom + v.getTransitionTime())) {
							bPreloadNextAd = true;
							// not needed???? v.setPreload(playingPlayer, "none");
							}
						} else {
							if ((this.currentTime + PRELOAD_NEXT_AD_S) >= duration) {
								bPreloadNextAd = true;
							}					
						}
					}
					
					if (bPreloadNextAd) {
						v.Log.info(this.id + ": Commence buffering for next item");			
						v.skipBufferingToNextPlayer(); // Get ready to buffer next player
						v.setContentSourceAndLoad();

						if (this.bufferSeqCheck != v.videoEvents.CAN_PLAY_THROUGH) {
							v.Log.warn(this.id + ": " + event.type + ": event sequence error!");
						}
						v.updateBufferBar(this.id, "Preload next ad");
					}
				}
				
				// Now check playback
				var transTimeMS = Math.floor((this.currentTime * 1000) - this.startPlaybackPointMS);
				if ((this == playingPlayer) && this.bTimePlayTransition && (transTimeMS >= v.transitionThresholdMS)) {
					this.bTimePlayTransition = false;
					var playTransMS = Date.now() - this.timestampStartPlay - v.transitionThresholdMS;
					playTransMS = (playTransMS > 0) ? playTransMS : 0;
					v.statusTableText(this.id, "Play trans", playTransMS + "ms");
					v.postAdTrans(this.id, playTransMS);
				}
				
				// Time for adverts?
				if ((this == playingPlayer) && v.isMainFeaturePlayer(playingPlayer)) {
					if ((this.currentTime - this.resumeFrom) >= v.getTransitionTime()) {
						v.Log.warn(this.id + ": transition main content");
						
						// Check to see if we're buffering the right video object
						if (bBufferingWhilstAttemptingToPlay) {
							v.Log.error(this.id + ": still buffering current player (should be prebuffering next!)");
							v.skipBufferingToNextPlayer(); // Get ready to buffer next player
							v.setContentSourceAndLoad();						
						}
						
						this.resumeFrom += v.getTransitionTime();
						this.bPlayPauseTransition = false;
						this.pause();
						v.updateBufferBar(this.id, "Play advert");
					}
				}

				if (this === playingPlayer) {
					v.resetStallTimer();
				}
				
				// Sanity check
				if (this != playingPlayer) {
					v.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
				}
				break;
				
			case v.videoEvents.ERROR:
				v.Log.error(this.id + ": video error: " + event.srcElement.error.code + " - " + v.eventErrorCodesMappingTable[event.srcElement.error.code]);
				v.updateBufferBar(this.id, "Event: " + event.type);
				break;
				
			case v.videoEvents.ENCRYPTED:
				e("encrypted").setAttribute("class", "playerIcon encrypted");
				v.Log.warn(this.id + ": ENCRYPTED");
				v.updateBufferBar(this.id, "Event: " + event.type);
				break;

			case v.videoEvents.SUSPEND:
			case v.videoEvents.ABORT:
			case v.videoEvents.EMPTIED:
			case v.videoEvents.LOADED_DATA:
			case v.videoEvents.PLAYING:
			case v.videoEvents.SEEKING:
			case v.videoEvents.DURATION_CHANGE:
			case v.videoEvents.RATE_CHANGE:
			case v.videoEvents.VOLUME_CHANGE:
				v.updateBufferBar(this.id, "Event: " + event.type);
				break;

			default:
				//do nothing
		}
	}
}

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
	this.reload();
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
	var fileName = utils.extractDevName(navigator.userAgent) + "_debug_" + Date.now() + ".log";

	this.Log.info("Save file : " + fileName); 
	
	// send a xhr/ajax POST request with the serialized media events
	xhttp.open("POST", "/savelog?filename=" + fileName, true);
	xhttp.setRequestHeader("Content-type", "text/plain"); 
	xhttp.send(this.Log.logStr);
}

mVid.cmndJumpToEnd = function () {
	var playingPlayer = this.getCurrentPlayingPlayer();

	this.Log.info(playingPlayer.id + ": Jump to end"); 

	if (playingPlayer) {
		var t = playingPlayer.duration * 0.9;
		playingPlayer.currentTime = t;
		if (this.isMainFeaturePlayer(playingPlayer)) {
			playingPlayer.resumeFrom = t;
			this.showPlayrange();
		}
	}
}

// Key mapping table
var keyTable = {};

lVKTable = {};

lVKTable['VK_LEFT']			= 37;
lVKTable['VK_RIGHT']		= 39;
lVKTable['VK_0'] 			= 48;
lVKTable['VK_1'] 			= 49;
lVKTable['VK_2'] 			= 50;
lVKTable['VK_3'] 			= 51;
lVKTable['VK_4'] 			= 52;
lVKTable['VK_5'] 			= 53;
lVKTable['VK_6'] 			= 54;
lVKTable['VK_7'] 			= 55;
lVKTable['VK_8'] 			= 56;
lVKTable['VK_9'] 			= 57;
lVKTable['VK_FAST_FWD'] 	= 417;
lVKTable['VK_REWIND'] 		= 412;
lVKTable['VK_PLAY'] 		= 415;
lVKTable['VK_PAUSE'] 		= 19;
lVKTable['VK_INFO'] 		= 457;
lVKTable['VK_RED'] 			= 403;
lVKTable['VK_GREEN']		= 404;
lVKTable['VK_YELLOW']		= 405;
lVKTable['VK_BLUE']			= 406;

getVK = function (vk) {
	if ((typeof window.KeyEvent !== 'undefined') && (typeof window.KeyEvent[vk] !== 'undefined')) {
		return window.KeyEvent[vk]; 
	} else {
		return lVKTable[vk];
	}
} 

keyTable.entries = [
	{ func : mVid.cmndFastForward, 	key : 'F', hbbKey : getVK('VK_FAST_FWD') 	}, 
	{ func : mVid.cmndRewind, 		key : 'R', hbbKey : getVK('VK_REWIND') 		}, 
	{ func : mVid.cmndPlay,			key : 'P', hbbKey : getVK('VK_PLAY') 		}, 
	{ func : mVid.cmndPause, 		key : 'S', hbbKey : getVK('VK_PAUSE') 		}, 
	{ func : mVid.cmndReload, 		key : 'L', hbbKey : getVK('VK_RED') 		}, 
	{ func : mVid.cmndSeekFWD,		key : 'J', hbbKey : getVK('VK_RIGHT')		}, 
	{ func : mVid.cmndSeekBACK,		key : 'B', hbbKey : getVK('VK_LEFT')		}, 
	{ func : mVid.cmndLog, 			key : 'D', hbbKey : getVK('VK_BLUE')		}, 
	{ func : mVid.cmndJumpToEnd,	key : 'E', hbbKey : getVK('VK_YELLOW')		}, 
	
	{ func : function() {this.setChannel(1)},	key : '1',	hbbKey : getVK('VK_1')	}, 
	{ func : function() {this.setChannel(2)},	key : '2',	hbbKey : getVK('VK_2')	}, 
	{ func : function() {this.setChannel(3)},	key : '3',	hbbKey : getVK('VK_3')	}, 
	{ func : function() {this.setChannel(4)},	key : '4',	hbbKey : getVK('VK_4')	}, 
	{ func : function() {this.setChannel(5)},	key : '5',	hbbKey : getVK('VK_5')	}, 
	{ func : function() {this.setChannel(6)},	key : '6',	hbbKey : getVK('VK_6')	}, 
	{ func : function() {this.setChannel(7)},	key : '7',	hbbKey : getVK('VK_7')	}, 
	{ func : function() {this.setChannel(8)},	key : '8',	hbbKey : getVK('VK_8')	}, 
	{ func : function() {this.setChannel(9)},	key : '9',	hbbKey : getVK('VK_9')	}, 
];
		