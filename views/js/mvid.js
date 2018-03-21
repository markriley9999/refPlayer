// --- Some helpers first --- //
var commonUtils = new UTILS();

e = function (id) {
  return document.getElementById(id);
}

// --- MAIN OBJECT --- //
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

mVid.playCount 			= 0;

mVid.cnt = {};
mVid.cnt.curBuffIdx = 0;
mVid.cnt.curPlayIdx = 0;
mVid.cnt.list = [];

mVid.cueImages = [];


// Play states
const PLAYSTATE_STOP	= 0;
const PLAYSTATE_PLAY	= 1;
const PLAYSTATE_PAUSE	= 2;
const PLAYSTATE_REW		= 3;
const PLAYSTATE_FWD		= 4;

const STALL_TIMEOUT_MS = 10000;

const AD_TRANS_TIMEOUT_MS	= 20;
const AD_TRANS_THRESHOLD_MS = 3000;

const AD_START_THRESHOLD_S 	= 10;
const AD_START_TIMEOUT_MS	= 20;

const PRELOAD_NEXT_AD_S = 5;

const CONTENT_FPS = 25;


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

// Media ready state - used for sanity checking state
const HAVE_NOTHING 		= 0;	// no data
const HAVE_METADATA 	= 1;	// duration, width, height and other metadata of the video have been fetched.
const HAVE_CURRENT_DATA = 2;	// There has not been sufficiently data loaded in order to start or continue playback.
const HAVE_FUTURE_DATA	= 3; 	// enough data to start playback
const HAVE_ENOUGH_DATA	= 4; 	// it should be possible to play the media stream without interruption till the end.

// Windowed video objects
var windowVideoObjects = [];

mVid.windowVideoObjects = {
	"mVid-video0" : 		{ top : "96px", 	left	: "240px", 	width	: "480px", 	height : "320px", bcol	: "blue" },
	"mVid-video1" : 		{ top : "160px", 	left	: "305px", 	width	: "480px", 	height : "320px", bcol	: "darkcyan" },
	"mVid-mainContent" : 	{ top : "224px", 	left	: "496px", 	width	: "672px", 	height : "426px", bcol	: "grey" }
}

// Events
//const event_schemeIdUri = "tag:refplayer.digitaluk.co.uk,2017:events/dar" 
const event_schemeIdUri = "urn:scte:scte35:2014:xml+bin"

const event_value = "1"

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


mVid.start = function () {
    var appMan 		= null;
	var that 		= this;
	var confManager = null;
	
	this.EOPlayback = false;
	this.bAttemptStallRecovery = false;
	
	this.socket = io();

	this.app = null;
	
	this.Log.init(e("log"));
	this.Log.info("app loaded");

	this.displayBrowserInfo();

	// Parse query params
	this.bOverrideSubs 	= commonUtils.getUrlVars()["subs"] || false;
	this.bCheckResume 	= commonUtils.getUrlVars()["checkresume"] || false;
	this.bWindowedObjs	= commonUtils.getUrlVars()["win"] || false;
	
	// this.bFullSCTE		= commonUtils.getUrlVars()["fullscte"] || false;
	this.bFullSCTE		= true;
	
	if (this.bOverrideSubs)
	{
        this.Log.warn("Force subtitles on");
	}
	
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
	
	if (location.protocol === 'https:') {
		e("padlock").setAttribute("class", "playerIcon showsecure");
	}

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

	var currentChannel = commonUtils.getUrlVars()["test"] || getCookie("channel");
	
	getPlaylist(currentChannel || "0", function(ch, playObj) {		
		var mainVideo;

		that.procPlaylist(ch, playObj);

		mainVideo = that.createVideo("mVid-mainContent");
		
		that.transitionThresholdMS 	= AD_TRANS_THRESHOLD_MS;
		that.bShowBufferingIcon		= false;
				
		that.setUpCues();
				
		// Clear key
		const KEYSYSTEM_TYPE = "org.w3.clearkey";

		var options = [];
		const audioContentType = 'audio/mp4; codecs="mp4a.40.2"'; 
		const videoContentType = 'video/mp4; codecs="avc3.4D4015"'; 

		options = [
			{
			  initDataTypes: ["cenc"],
			  videoCapabilities: [{contentType: videoContentType}],
			  audioCapabilities: [{contentType: audioContentType}],
			}
		];

		that.showBufferingIcon(false);
		that.setPlayingState(PLAYSTATE_STOP);
		
		document.addEventListener("keydown", that.OnKeyDown.bind(that));

		if (typeof navigator.requestMediaKeySystemAccess !== 'undefined') {
			SetupEME(mainVideo, KEYSYSTEM_TYPE, "video", options, that.contentTag, that.Log).then(function(p) {
				that.setContentSourceAndLoad();				
			});
			that.bEMESupport = true;
		} else {
			that.setContentSourceAndLoad();
			e("encrypted").setAttribute("class", "playerIcon noeme");
			that.bEMESupport = false;
		}
			
		that.resetStallTimer();
		
		window.setInterval( function() {
			var elTimer = e("videoTimer");

			// elTimer.innerHTML = ("00000000" + (Date.now() - that.startTime)).slice(-8);
			if (elTimer) {
				elTimer.innerHTML = that.msToTime(Date.now() - that.startTime);
			}
			
			that.updateAllBuffersStatus();	

		}, 1000);	
	});
};

mVid.procPlaylist = function (ch, playObj) {
	var c = this.cnt.list;
	
	// this.Log.info("- New playlist: " + JSON.stringify(playObj));
	
	this.Log.info("-----------------------------------------------------------");
	this.Log.info("*** Playing Content Summary ***");
	for (var i = 0; i < playObj.info.length; i++) {
		this.Log.info(playObj.info[i]);
	}
	this.Log.info("-----------------------------------------------------------");
	
	var lt = playObj.ads.length;
	
	c.length = lt + 1;
	c[lt] = {};
	
	this.contentTag = commonUtils.basename(playObj.src);
	
	if (playObj.addContentId === "false") {
		c[lt].src = playObj.src;
	} else {
		c[lt].src = playObj.src + "?" + commonUtils.createContentIdQueryString();
	}
	
	c[lt].type 				= playObj.type;
	c[lt].transitionTime 	= playObj.transitionTime;
	c[lt].transitionOffsetMS = playObj.special_transition_c || 0;
	c[lt].videoId 			= "mVid-mainContent";
	c[lt].addContentId		= playObj.addContentId;
	c[lt].channelName		= playObj.channelName;

	if (c[lt].transitionOffsetMS != 0) {
		this.Log.info(" * SpecialMode: Additional ad transition offset of: " + c[lt].transitionOffsetMS + "ms *");	
	}
	
	var pId = "mVid-video0";
	
	for (var i = 0; i < lt; i++) {
		//this.Log.info("- Ad: " + i + " " + playObj.ads[i].src);	
		//this.Log.info("- Ad: " + i + " " + playObj.ads[i].type);	
		c[i] = {};
		c[i].src 				= playObj.ads[i].src;
		c[i].type 				= playObj.ads[i].type;
		c[i].transitionTime 	= -1;
		c[i].transitionOffsetMS = 0;
		c[i].videoId 			= pId;
		c[i].channelName		= playObj.channelName;
		pId = (pId === "mVid-video0") ? "mVid-video1" : "mVid-video0";
	}
	
	this.Log.info("---- Content List ----");	
	for (var i = 0; i < c.length; i++) {
		this.Log.info(" - " + c[i].channelName);	
		this.Log.info(" - " + c[i].src);	
		this.Log.info(" - " + c[i].type);	
		this.Log.info(" - " + c[i].videoId);	
		this.Log.info(" - " + c[i].transitionTime);	
		this.Log.info(" - ");			
	}
	
	if (playObj.special_jumptomain === "true") {
		this.Log.info(" * SpecialMode: Jump to main, skipping initial adverts. *");	
		
		this.cnt.curBuffIdx = lt;
		this.cnt.curPlayIdx = lt;
	}
	
	this.bPurgeMain = (playObj.special_purgemain === "true") || false;
	
	e("currentChannel") && (e("currentChannel").innerHTML = "Test " + ch + " - " + playObj.channelName);
}

mVid.setUpCues = function () {

	var mainVideo = e("mVid-mainContent");
	var that = this;
	var trackDispatchType = event_schemeIdUri + " " + event_value;
	
	function arrayBufferToString(buffer) {
		var arr = new Uint8Array(buffer);
		var str = String.fromCharCode.apply(String, arr);
		return str;
	}

	function showCues () {
		
		var p = that.getCurrentPlayingVideo();
		
		if (!p) {
			return;
		}
		
		var imgobj = e("ev-arrow");
		
		var c = e("playbackBar").getBoundingClientRect();
		var offset = imgobj.getBoundingClientRect().width / 2;

		var x;
		var coef = (c.width / p.duration);
		var imgIndex;
		
		var tracks = p.textTracks;
		var track;

		for (var t = 0; t < tracks.length; t++) {
			track = tracks[t];

			if (track)
			{
				// that.Log.info("Track #" + t); 
				// that.Log.info("Track inBandMetadataTrackDispatchType (" + trackDispatchType + "): " + track.inBandMetadataTrackDispatchType);
			}
			
			if (track && (track.kind === 'metadata') && (track.inBandMetadataTrackDispatchType === trackDispatchType) && (track.cues.length > 0)) {
				// that.Log.info("Track Info: track - kind: " + track.kind + " label: " +  track.label + " id: " + track.id);			
			
				for (var i = 0; i < track.cues.length; ++i) {
					var cue = track.cues[i];

					if ((cue !== null) && (cue.endTime > cue.startTime)) {
						if (cue.startTime > 0) {
							x =  (coef * cue.startTime) + c.left;
							imgIndex = Math.floor(x / 4);
							
							if (!that.cueImages[imgIndex]) {
								that.cueImages[imgIndex] = imgobj.cloneNode(true);
								e("playrange").appendChild(that.cueImages[imgIndex]);
							}
							
							that.cueImages[imgIndex].setAttribute("class", "ad-arrow");
							that.cueImages[imgIndex].style.left = (x - offset) + "px";
							// that.Log.info("(" + track.kind + ") Show Cue:  Cue - start: " + cue.startTime + " end: " +  cue.endTime + " id: " + cue.id + " data: " + arrayBufferToString(cue.data));				
						}
					} else {
						that.Log.warn("Show Cue: zero length cue - this is probably wrong.");			
					}
				}
			} else if (track && ((track.kind === 'subtitles') || (track.kind === 'captions'))) {
				var s = e("subs");
				
				// Force subs on?
				if (that.bOverrideSubs){
					track.mode = 'showing';
				}
				
				if (track.mode === 'showing') {
					s.setAttribute("class", "playerIcon subson");
				} else {
					s.setAttribute("class", "playerIcon subsoff");
				}
			}
		}
	}

	window.setInterval( function() {
		showCues();	
	}, 10000);	
		
	mainVideo.textTracks.onaddtrack = function (event) {
		var textTrack = event.track;
		
		function parseSCTE(d) {
			var s = arrayBufferToString(d);
			var r;
			
			/* --- Example scte data --- *
			s = "<scte35:Signal><scte35:Binary>/TWFpbiBDb250ZW50</scte35:Binary></scte35:Signal>"; 
			******************************/

			that.Log.info("Parse SCTE: data: " + s);

			try {
				if (that.bFullSCTE) {
					if (window.DOMParser) {
						// Add scte namespace, used by xml parser
						s = "<" + "wrapper  xmlns:scte35=\"urn:scte:scte35:2014:xml+bin\"" + ">" + s + "<" + "/wrapper" + ">";
					
						var parser = new DOMParser();
						var x = parser.parseFromString(s, "text/xml");
						var bn = x.getElementsByTagNameNS("urn:scte:scte35:2014:xml+bin", "Binary")[0].childNodes[0].nodeValue;
						r = window.atob(bn.replace(/\s/g,'').substr(1));
					} else {
						r = "No DOMParser object";
					}
				} else {
					r = window.atob(s.replace(/\s/g,'').substr(1));
				}
			} catch (err) {
				r = "Event Data Error";
			}
			
			that.Log.info("Parsed SCTE: " + r);

			return r;
		}
		
		if ((textTrack.kind === 'metadata') && (textTrack.inBandMetadataTrackDispatchType === trackDispatchType)) {
			
			showCues();

			textTrack.oncuechange = function () {
				var cue;

				showCues();
				
				that.Log.info("textTrack - kind: " + textTrack.kind + " label: " +  textTrack.label + " id: " + textTrack.id);			

				for (var i = 0; i < textTrack.activeCues.length; ++i) {

					cue = textTrack.activeCues[i];

					if (cue && (cue.endTime > cue.startTime)) {
						var f = e("flag");
						var cd = e("cuedata");
						var s = parseSCTE(cue.data);
						
						that.Log.info("Active Cue:  Cue - start: " + cue.startTime + " end: " +  cue.endTime + " id: " + cue.id + " data: " + arrayBufferToString(cue.data));							
						f.setAttribute("class", "playerIcon flag");
						that.updateBufferStatus(mainVideo.id, "Event: Cue Start");
						cd.innerHTML = "Cue Event: " + s;
						
						cue.onexit = function (ev) {
							f.setAttribute("class", "playerIcon");
							that.updateBufferStatus(mainVideo.id, "Event: Cue End");
							cd.innerHTML = "";
						}
						return;
					}
				}
			}
		}
	};		
	
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

mVid.createVideo = function (videoId) {
	this.Log.info("createVideo: " + videoId);

	if (e(videoId)) {
		this.Log.warn("createVideo: " + videoId + " Already exists - will not create new!");
		return e(videoId);
	}
	
	var video = document.createElement("video");	
	
	if (!video)
	{
		this.Log.warn("createVideo: " + videoId + " Creation failed!");
		return null;
	}
	
    video.setAttribute("id", videoId);

	// Allow CORS 
	video.setAttribute("crossOrigin", "anonymous");
	
	if (!this.bWindowedObjs) {
		video.style.display = "none";
		video.setAttribute("poster", "bitmaps/bground.jpg");
	}
	
	var source = document.createElement("source");
	
    source.setAttribute("id", videoId + "-source");
    source.setAttribute("preload", "auto");
    source.setAttribute("loop", "false");
	
	video.appendChild(source);

	e("player-container").appendChild(video);
	
	for(var i in this.videoEvents) {
		video.addEventListener(this.videoEvents[i], onVideoEvent(this));
	}

	this.statusTableText(videoId, "Play", "---");
	this.statusTableText(videoId, "Buffer", "---");
	this.statusTableText(videoId, "Type", "---");
	this.statusTableText(videoId, "Pos", "---");

	video.bPlayPauseTransition 		= false;
	video.resumeFrom 				= 0;
	video.bBuffEnoughToPlay 		= false;
	video.bPlayEventFired			= false;
	video.bAdTransStartedPolling	= false;
	
	if (this.bWindowedObjs) {
		video.style.display 	= "block";
		video.style.top  		= this.windowVideoObjects[videoId].top;
		video.style.left 		= this.windowVideoObjects[videoId].left;
		video.style.width		= this.windowVideoObjects[videoId].width;
		video.style.height 		= this.windowVideoObjects[videoId].height;
		video.style.backgroundColor	= this.windowVideoObjects[videoId].bcol;
		video.style.position	= "absolute";
		
		e("player-container").style.backgroundColor = "cyan";
	}
	
	return video;
}

mVid.purgeVideo = function (videoId) {
	this.Log.info("purgeVideo: " + videoId);

	var video = e(videoId);
	
	if (video) {
		video.pause();
		video.src="";
		
		video.removeAttribute("src");
		video.removeAttribute("source");
		video.innerHTML = ""; // Why is the <source> placed in here!?
		video.load();
		video.parentNode.removeChild(video);
		video=null;	// don't really need this...
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

mVid.updateAllBuffersStatus = function() {
	this.updateBufferStatus("mVid-mainContent", '');
	this.updateBufferStatus("mVid-video0", '');
	this.updateBufferStatus("mVid-video1", '');
} 

mVid.updateBufferStatus = function(videoId, annot) {
	if (this.EOPlayback) {
		return;
	}
	
	var videoBuffer 	= e(videoId + "-bufferBar");
	var headroomBuffer 	= e(videoId + "-headroomBar");
	var video 			= e(videoId);

	
	if (video)
	{
		var buffV 			= 0;
		var buffD			= 0;
		var buffer 			= video.buffered;
		var duration 		= video.duration;
		var offset;
		
		if (video.paused) {
			videoBuffer.setAttribute("class", "bufferBar");
			headroomBuffer.setAttribute("class", "bufferBar");		
		} else {
			videoBuffer.setAttribute("class", "bufferBarActive");	
			headroomBuffer.setAttribute("class", "bufferBarActive");	
		}
		
		if (duration && (duration > 0)) {
			videoBuffer.max = duration;
			headroomBuffer.max = 60; // (duration < 60) ? duration : 60;

			if ((buffer.length > 0) && (video.currentTime < video.duration) /* !video.ended */) {
				buffV = buffer.end(buffer.length-1);
				buffD = buffV - video.currentTime;
				if (buffD < 0) {
					buffD = 0;
				}
				videoBuffer.value 		= buffV;
				headroomBuffer.value 	= buffD;
			} else {
				videoBuffer.value 		= 0;			
				headroomBuffer.value 	= 0;			
			}
		} else
		{
			videoBuffer.value 		= 0;	
			videoBuffer.max 		= 60;	
			headroomBuffer.value 	= 0;	
			headroomBuffer.max 		= 60;	
		}
	}
	
	// Send state over io sockets
	var pbObj = "\"playerBufferObj\": {";
	pbObj += "\"id\":" + JSON.stringify(videoId) + ",";
	if (video)	{
		pbObj += "\"class\":" + JSON.stringify(videoBuffer.getAttribute("class")) + ",";
		pbObj += "\"value\":" + JSON.stringify('' + buffV) + ","; 
		pbObj += "\"max\":" + JSON.stringify('' + videoBuffer.max) + ",";
		pbObj += "\"currentTime\":" + JSON.stringify('' + video.currentTime) + ",";
		pbObj += "\"resumeFrom\":" + JSON.stringify('' + video.resumeFrom) + ",";
		pbObj += "\"duration\":" + JSON.stringify('' + video.duration) + ",";
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
	hbObj += "\"id\":" + JSON.stringify(videoId) + ",";
	if (video)	{
		hbObj += "\"class\":" + JSON.stringify(headroomBuffer.getAttribute("class")) + ",";
		hbObj += "\"value\":" + JSON.stringify('' + buffD) + ",";
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

mVid.updatePlaybackBar = function(videoId) {
	var videoBar 		= e("playbackBar");
	var video 			= e(videoId);
	
	if (video) {
		var duration 		= video.duration;
		
		if (duration && (duration > 0)) {
			videoBar.max = duration;
			videoBar.value = video.currentTime;
		} else
		{
			videoBar.value = 0;	
			videoBar.max = 100;	
		}

		var out = "{";
		out += "\"value\":" + JSON.stringify('' + videoBar.value) + ",";
		out += "\"max\":" + JSON.stringify('' + videoBar.max);
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

mVid.statusTableText = function (videoId, textEntry, text) {
	this.postStatusUpdate("e_" + videoId + "_" + textEntry, text);
}

mVid.getCurrentBufferingVideo = function () {
	//this.Log.info("getCurrentBufferingVideo: " + this.cnt.list[this.cnt.curBuffIdx].videoId);
	var idx = this.cnt.curBuffIdx;
	var videoId = this.cnt.list[idx].videoId;
	var video = e(videoId);
	
	if (!video) {
		this.createVideo(videoId);
		video = e(videoId);
	}
	
	return video;
}

mVid.getCurrentPlayingVideo = function () {
	//this.Log.info("getCurrentPlayingVideo: " + this.cnt.list[this.cnt.curPlayIdx].videoId);
	var idx = this.cnt.curPlayIdx;
	
	if (this.cnt.list[idx]){
		return e(this.cnt.list[idx].videoId);
	} else {
		return null;
	}
}

mVid.getBufferingContentIdx = function () {
	//this.Log.info("getBufferingContentIdx: " + this.cnt.curBuffIdx);
	return this.cnt.curBuffIdx;
}

mVid.getPlayingContentIdx = function () {
	//this.Log.info("getPlayingContentIdx: " + this.cnt.curPlayIdx);
	return this.cnt.curPlayIdx;
}

mVid.getTransitionPoint = function () {
	var c = this.cnt.list[this.cnt.curPlayIdx];
	
	var i = parseFloat(c.transitionTime);
	var o = parseFloat(c.transitionOffsetMS) / 1000;
	
	var obj = {};
	
	obj.bEnabled = (i != -1);
	
	if (obj.bEnabled) {
		obj.v 			= i;
		obj.offset 		= o;
		obj.total		= o+i;
	} else {
		obj.v 			= Number.MAX_SAFE_INTEGER;
		obj.offset 		= 0;
		obj.total		= Number.MAX_SAFE_INTEGER;
	}
	
	// this.Log.info("getTransitionPoint - value: " + obj.v + " offset: " + obj.offset + " total: " + obj.total);

	return obj;
}

mVid.setContentSourceAndLoad = function () {
	var video;

	video = this.getCurrentBufferingVideo();
	this.Log.info(video.id + " setContentSourceAndLoad - curBuffIdx: " + this.cnt.curBuffIdx);
	
	if (this.bEMESupport) {
		e("encrypted").setAttribute("class", "playerIcon");
	}
	
	e("subs").setAttribute("class", "playerIcon nosubs");
	
	this.setSourceAndLoad(video, this.cnt.list[this.cnt.curBuffIdx].src, this.cnt.list[this.cnt.curBuffIdx].type);
}

mVid.skipBufferingToNextVideo = function () {
	if (++this.cnt.curBuffIdx >= this.cnt.list.length) {
		this.cnt.curBuffIdx = 0;
	}
	this.Log.info("skipBufferingToNextVideo: " + this.cnt.curBuffIdx);
	this.postStatusUpdate("BufferIdx", this.cnt.curBuffIdx);
}

mVid.skipPlayingToNextVideo = function () {
	if (++this.cnt.curPlayIdx >= this.cnt.list.length) {
		this.cnt.curPlayIdx = 0;
	}
	this.Log.info("skipPlayingToNextVideo: " + this.cnt.curPlayIdx);
	this.postStatusUpdate("PlayingIdx", this.cnt.curPlayIdx);
}

mVid.isMainFeatureVideo = function (video) {
	return (video.id == "mVid-mainContent");
}

mVid.setPreload = function (video, mode) {
	var source = e(video.id + "-source");
	source.setAttribute("preload", mode);
}

mVid.setSourceAndLoad = function (video, src, type) {
	this.Log.info(video.id + " setSourceAndLoad - src: " + src + " type: " + type);
	
	this.statusTableText(video.id, "Type", type);
	
	var source = e(video.id + "-source");
	
	var bSetSource = true;
	
	if (this.isMainFeatureVideo(video)) 
	{
		if (source.type) {
			bSetSource = false;
			if (video.currentTime != video.resumeFrom) {
				if (this.bCheckResume) {
					this.Log.warn(video.id + " video.currentTime - realign from " + video.currentTime + " to " + video.resumeFrom);
					video.currentTime = video.resumeFrom;
				}
			}
		}
	}
	 
	if (bSetSource) {
		source.setAttribute("type", type);	
		source.setAttribute("src", src);
		video.bBuffEnoughToPlay = false;
		video.bEncrypted = false;
		video.bPlayEventFired = false;
		
		// Running on a non hbbtv device?
		if (!this.app) {
			this.Log.warn("*** USE DASHJS (non hbbtv device) ***");		
			dashjs.MediaPlayerFactory.create(video, source);
		}
		//this.setPreload(video, "auto");
		video.load();
	}
}

mVid.switchVideoToPlaying = function(freshVideo, previousVideo) {
	// freshVideo / previousVideo can be null
	
	if (freshVideo == previousVideo) {
		this.Log.error("Current and next video are the same (" + freshVideo.id + ")");
		previousVideo = null;
	}
	
	this.Log.info("---------------------------------------------------------------------------------------------------");
	this.Log.info("Start playing called: ");
	if (freshVideo) { 
		this.Log.info(" - freshVideo: " + freshVideo.id);
	} else {
		this.Log.warn(" - Not ready to play yet");		
	}
	if (previousVideo) this.Log.info(" - previousVideo: " + previousVideo.id)
	
	// Set the display CSS property of the pre-fetched video to block.
	if (freshVideo) {
		freshVideo.style.display = "block";
	}
	
	// Pause the currently playing media element, using the pause() function.
	if (previousVideo) {
		previousVideo.pause();
	}

	// Start playback of the pre-fetched media, using the play() function.
	if (freshVideo) {
		freshVideo.playbackRate = 1;
		freshVideo.play();
	}
	
	// Set the display CSS property of the previous media element to none.
	if (previousVideo && !this.bWindowedObjs) {
		previousVideo.style.display = "none";
	}
	
	if (freshVideo) {
		this.postStatusUpdate("PlayCount", ++this.playCount);
	}
	
	// Purge previous video
	if (previousVideo && (!this.isMainFeatureVideo(previousVideo) || this.bPurgeMain)) {
		this.purgeVideo(previousVideo.id);
	}
}

mVid.timeStampStartOfPlay = function (video) {
	if (video) {
		video.timestampStartPlay 	= Date.now();
		video.bTimePlayTransition 	= true;
		this.statusTableText(video.id, "Play trans", "");
		
		this.startAdTransitionTimer();
	}
}
	

mVid.getBufferedAmount = function (video) {
	var buffer 	= video.buffered;
	var bufferEnd = 0;
	
	if (buffer.length > 1) {
		this.Log.warn(video.id + ": Fragmented buffer, ie multiple buffer fragments. (" + buffer.length + ")");		
	}
		
	if (buffer.length > 0) {
		bufferEnd = buffer.end(buffer.length-1);
	} 
	
	return bufferEnd;
}

mVid.showPlayrange = function () {
	var p = this.getCurrentPlayingVideo();
	
	var c = e("playbackBar").getBoundingClientRect();
	var offset = e("ad-start-point").getBoundingClientRect().width / 2;

	var x1, x2;
	
	if (!p || !this.isMainFeatureVideo(p)) {
		x1 = c.left;
		x2 = c.right;			
	} else {
		var coef = (c.width / p.duration);
		var t = this.getTransitionPoint().v;
		x1 =  (coef * p.resumeFrom) + c.left;
		var endP = (p.resumeFrom + t > p.duration) ? p.duration : p.resumeFrom + t;
		
		x2 =  (coef * endP) + c.left;
	}
	
	e("ad-start-point").style.left 	= (x1 - offset) + "px";
	e("ad-resume-point").style.left = (x2 - offset) + "px";			
}

mVid.setEOPlayback = function () {
	this.Log.info("End of Playback - purging all players");
	this.EOPlayback = true;
	this.showBufferingIcon(false);
	this.purgeVideo("mVid-mainContent");
	this.purgeVideo("mVid-video0");
	this.purgeVideo("mVid-video1");
}

function onVideoEvent (v) {
	return function (event) {
		if (v.EOPlayback) {
			return;
		}
		
		var bufferingVideo = v.getCurrentBufferingVideo();
		var playingVideo = v.getCurrentPlayingVideo();

		var bufferingContentIdx = v.getBufferingContentIdx();
		var playingContentIdx = v.getPlayingContentIdx();
		
		var bBufferingWhilstAttemptingToPlay = (bufferingContentIdx === playingContentIdx);
		
		switch(event.type) {
			case v.videoEvents.LOAD_START:
				v.Log.info(this.id + ": video has started loading");
				v.updateBufferStatus(this.id, "Event: " + event.type);
				// Sanity check
				/* TODO: why is this being generated for non buffering content???
				if (this != bufferingVideo) {
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
				v.updateBufferStatus(this.id, "Event: " + event.type);
				// Sanity check
				if (this != bufferingVideo) {
					v.Log.warn(this.id + ": " + event.type + ": event for non buffering video object!");
				}
				if (this.readyState != HAVE_METADATA) {
					v.Log.info(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_METADATA"); // TODO: Need to check this....
				}
				if (this.bufferSeqCheck != v.videoEvents.LOAD_START) {
					v.Log.warn(this.id + ": " + event.type + ": event sequence error!");
				}
				this.bufferSeqCheck = event.type;
				
				if (this === playingVideo) {
					v.resetStallTimer();
				}
				break;
				
			case v.videoEvents.CAN_PLAY:
				v.Log.info(this.id + ": video can play");
				v.statusTableText(this.id, "Buffer", "Enough to start play");
				v.updateBufferStatus(this.id, "Event: " + event.type);
					
				// Sanity check
				if (this != bufferingVideo) {
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
					v.switchVideoToPlaying(this, null);
				} 

				if (this === playingVideo) {
					v.resetStallTimer();
				}

				break;
				
			case v.videoEvents.CAN_PLAY_THROUGH:
				v.Log.info(this.id + ": buffered sufficiently to play-through.");
				v.statusTableText(this.id, "Buffer", "Can play through");
				v.updateBufferStatus(this.id, "Event: " + event.type);

				// Sanity check
				if (this != bufferingVideo) {
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

				if (this === playingVideo) {
					v.resetStallTimer();
				}

				if (bBufferingWhilstAttemptingToPlay && this.paused) {
					// Happens for first piece of content (or we're behind on buffering) - we can start playing now...
					v.switchVideoToPlaying(this, null);
				} 

				break;
				
			case v.videoEvents.PLAY:
				v.Log.info(this.id + ": video is playing");
				v.statusTableText(this.id, "Play", "Playing");
				// v.statusTableText(this.id, "Buffer", "Being consumed");
				v.updateBufferStatus(this.id, "");

				v.setPlayingState(PLAYSTATE_PLAY);
				v.showPlayrange();
				
				if (this == playingVideo) {
					this.bPlayEventFired = true;
				} else {
					v.Log.error(this.id + ": " + event.type + ": event for non playing video object!");
				}

				if (v.getBufferedAmount(this) == 0) {
					v.Log.warn(this.id + ": Buffer should not still be empty!");				
				}

				if ((this == playingVideo) && !this.bPlayPauseTransition) {
					this.startPlaybackPointMS = this.currentTime * 1000;
				} else {
					this.bPlayPauseTransition = false;
				}
				
				if (v.bPurgeMain) {
					// Special case - recalculate resume points, this is used for dynamic content (when also using multiple video objects!!!)
					if (v.isMainFeatureVideo(this) && (this == playingVideo)) {
						var trans =  v.getTransitionPoint();
												
						if (trans.bEnabled) {
							var tt = trans.v;
						
							this.resumeFrom = Math.floor(this.currentTime / tt) * tt;
						} else {
							this.resumeFrom = 0;
						}
						v.showPlayrange();
						v.Log.info("* SpecialMode " + this.id + ": recalculate resumefrom point. " + this.resumeFrom + "S *");
					}
				}
				
				// Sanity check
				if (v.isMainFeatureVideo(this) && (this == playingVideo) && (playingVideo.currentTime < playingVideo.resumeFrom)) {
					v.Log.error(this.id + ": resume error (currentTime < resume point)");
					playingVideo.currentTime = playingVideo.resumeFrom;
				}
				break;
				
			case v.videoEvents.PAUSE:
				v.Log.info(this.id + ": video is paused");
				v.statusTableText(this.id, "Play", "Paused");
				v.updateBufferStatus(this.id, "Event: " + event.type);

				// Sanity check
				if (this != playingVideo) {
					v.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
				}

				if (this.bPlayPauseTransition) {
					v.setPlayingState(PLAYSTATE_PAUSE);
				} else
				{
					if (v.isMainFeatureVideo(this)) {
						v.skipPlayingToNextVideo();
						var newPlayingVideo = v.getCurrentPlayingVideo();
						
						if (newPlayingVideo) {
							v.timeStampStartOfPlay(newPlayingVideo);
							if (newPlayingVideo.bBuffEnoughToPlay) {
								v.switchVideoToPlaying(newPlayingVideo, this);
							} else {
								// oh dear - still buffering, not ready to play yet 
								v.switchVideoToPlaying(null, this);				
							}
						}
					}
				}
				break;
				
			case v.videoEvents.SEEKED:
				v.Log.info(this.id + ": video has seeked");
				v.updateBufferStatus(this.id, "Event: " + event.type);
				// Sanity check
				if (this != playingVideo) {
					v.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
				}
				break;
				
			case v.videoEvents.STALLED:
				v.Log.warn(this.id + ": has stalled");
				v.showBufferingIcon(true);
				v.updateBufferStatus(this.id, "Event: " + event.type);
				break;
				
			case v.videoEvents.WAITING:
				v.Log.warn(this.id + ": is waiting");
				v.showBufferingIcon(true);
				v.updateBufferStatus(this.id, "Event: " + event.type);
				break;
				
			case v.videoEvents.RESIZE:
				v.Log.info(this.id + ": resize called");
				v.updateBufferStatus(this.id, "Event: " + event.type);
				break;
				
			case v.videoEvents.ENDED:
				v.statusTableText(this.id, "Buffer", "---");
				v.Log.info(this.id + ": video has ended");
				v.updateBufferStatus(this.id, "Event: " + event.type);
				
				v.showBufferingIcon(true);
				v.setPlayingState(PLAYSTATE_STOP);

				// Start playing buffered content
				if (v.isMainFeatureVideo(this)) {
					v.Log.info(this.id + ": video has ended - stop everything.");
					v.setEOPlayback();
					v.cmndLog();
					return;
				} else {
					v.skipPlayingToNextVideo();
					var newPlayingVideo = v.getCurrentPlayingVideo();
					
					v.timeStampStartOfPlay(newPlayingVideo);
					if (newPlayingVideo.bBuffEnoughToPlay) {
						v.switchVideoToPlaying(newPlayingVideo, this);
					} else {
						// oh dear - still buffering, not ready to play yet 
						v.switchVideoToPlaying(null, this);				
					}
				}
				break;

			case v.videoEvents.TIME_UPDATE:
				var tNow = Math.floor(this.currentTime);

				// Only do this once a second
				if (tNow != this.tOld) 
				{
					if ((this === playingVideo) && this.bPlayEventFired) {
						this.tOld = tNow;				
						
						v.statusTableText(this.id, "Pos", Math.floor(this.currentTime));
						v.updatePlaybackBar(this.id);
				
						// Time for adverts?
						if (v.isMainFeatureVideo(playingVideo) && !this.bAdTransStartedPolling) {
							if (((this.currentTime - this.resumeFrom) + AD_START_THRESHOLD_S) >= v.getTransitionPoint().v) {
								this.bAdTransStartedPolling = true;
								v.startAdStartTimer();
							}
						}

						// Check if gone off end!
						if (this.currentTime > this.duration) {
								v.Log.error("Current Time > Duration - content should have ended!");
						}
						
						// Start buffering next programme?
						if (bBufferingWhilstAttemptingToPlay) {
							var duration 	= this.duration;
							var bufferEnd 	= v.getBufferedAmount(this);
							var bPreloadNextAd = false;
							
							if (v.isMainFeatureVideo(this)) {
								if ((this.currentTime + PRELOAD_NEXT_AD_S) >= (this.resumeFrom + v.getTransitionPoint().v)) {
									bPreloadNextAd = true;
									// not needed???? v.setPreload(playingVideo, "none");
								}
							} else {
								if ((this.currentTime + PRELOAD_NEXT_AD_S) >= duration) {
									bPreloadNextAd = true;
								}					
							}
							
							if (bPreloadNextAd) {
								v.Log.info(this.id + ": Commence buffering for next item");			
								v.skipBufferingToNextVideo(); // Get ready to buffer next video
								v.setContentSourceAndLoad();

								if (this.bufferSeqCheck != v.videoEvents.CAN_PLAY_THROUGH) {
									v.Log.warn(this.id + ": " + event.type + ": event sequence error!");
								}
								v.updateBufferStatus(this.id, "Preload next ad");
							}
						}
						
						v.resetStallTimer();
					}
					
				}
				break;
				
			case v.videoEvents.ERROR:
				v.Log.error(this.id + ": video error: " + event.srcElement.error.code + " - " + v.eventErrorCodesMappingTable[event.srcElement.error.code]);
				v.updateBufferStatus(this.id, "Event: " + event.type);
				break;
				
			case v.videoEvents.ENCRYPTED:
				if (v.bEMESupport) {
					e("encrypted").setAttribute("class", "playerIcon encrypted");
				}
				v.Log.warn(this.id + ": ENCRYPTED");
				v.updateBufferStatus(this.id, "Event: " + event.type);
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
				v.updateBufferStatus(this.id, "Event: " + event.type);
				break;

			default:
				//do nothing
		}
	}
}

mVid.getCurrentTime = function (v) {
	return v.currentTime;
}

mVid.startAdTransitionTimer = function () {
	if (this.adTimerId) clearTimeout(this.adTimerId);
	this.adTimerId = setTimeout(this.OnCheckAdTransition.bind(this), AD_TRANS_TIMEOUT_MS);
}

mVid.OnCheckAdTransition = function () {
	var vid = this.getCurrentPlayingVideo();
	
	if (!vid.bTimePlayTransition) {
		return;
	}
	
	var transTimeMS = Math.floor((this.getCurrentTime(vid) * 1000) - vid.startPlaybackPointMS);

	if (transTimeMS >= this.transitionThresholdMS) {
		vid.bTimePlayTransition = false;
		var playTransMS = Date.now() - vid.timestampStartPlay - this.transitionThresholdMS;
		playTransMS = (playTransMS > 0) ? playTransMS : 0;
		this.statusTableText(vid.id, "Play trans", playTransMS + "ms");
		this.postAdTrans(vid.id, playTransMS);
	} else {
		this.adTimerId = setTimeout(this.OnCheckAdTransition.bind(this), AD_TRANS_TIMEOUT_MS);
	}
}

mVid.startAdStartTimer = function () {
	if (this.adStartTimerId) clearTimeout(this.adStartTimerId);
	this.adStartTimerId = setTimeout(this.OnCheckAdStart.bind(this), AD_START_TIMEOUT_MS);
}

mVid.OnCheckAdStart = function () {
	var vid = this.getCurrentPlayingVideo();

	if (!this.isMainFeatureVideo(vid)) {
		return;
	}
	
	// Time for adverts?
	var transPt = this.getCurrentTime(vid) - (vid.resumeFrom + this.getTransitionPoint().total);
	
	if (transPt >= 0) {
		this.Log.info(vid.id + ": transition from main content to ads");
				
		vid.resumeFrom += this.getTransitionPoint().v;
		vid.bPlayPauseTransition = false;
		vid.pause(); // This will trigger adverts events, via 'pause' event
		
		if (transPt > 0) {
			this.Log.warn(vid.id + " Paused  " + transPt + "s past point, frames " + (transPt * CONTENT_FPS));
		}
		
		this.updateBufferStatus(vid.id, "Play advert");
		
		vid.bAdTransStartedPolling = false;
	} else {
		this.adStartTimerId = setTimeout(this.OnCheckAdStart.bind(this), AD_START_TIMEOUT_MS);
	}
}

mVid.resetStallTimer = function () {
	this.showBufferingIcon(false);
	if (this.stallTimerId) clearTimeout(this.stallTimerId);
	this.stallCount = 0;
	this.stallTimerId = setTimeout(this.OnCatchStall.bind(this), STALL_TIMEOUT_MS);
}

mVid.OnCatchStall = function () {
	var playingVideo = this.getCurrentPlayingVideo();

	if (!playingVideo) {
		return;
	}
		
	if (!playingVideo.bPlayPauseTransition) {
		this.Log.warn("Check Stall timer triggered!");
		this.Log.warn(" --- Network state: " + this.networkStateMappingTable[playingVideo.networkState]);
		
		switch (this.stallCount) {
			case 0:
				this.showBufferingIcon(true);
				break;
				
			case 1:
				if (this.bAttemptStallRecovery) {
					this.Log.warn("Stalled: re-call LOAD, in an attempt to recover");
					playingVideo.load();
				}
				break;

			case 2:
				if (this.bAttemptStallRecovery) {
					this.Log.warn("Stalled: re-call PLAY, in an attempt to recover");
					playingVideo.play();
				}
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
	var playingVideo = this.getCurrentPlayingVideo();
	
	if (!playingVideo) {
		return;
	}
	
	this.Log.info("called : cmndFastForward"); 

	if (playingVideo) playingVideo.playbackRate = 4;	
	this.setPlayingState(PLAYSTATE_FWD);
}	
	
mVid.cmndRewind = function () {
	var playingVideo = this.getCurrentPlayingVideo();

	if (!playingVideo) {
		return;
	}
	
	this.Log.info("called : cmndRewind"); 
	
	if (playingVideo) playingVideo.playbackRate = -4;	
	this.setPlayingState(PLAYSTATE_REW);
}	
	
mVid.cmndPlay = function () {
	var playingVideo = this.getCurrentPlayingVideo();

	if (!playingVideo) {
		return;
	}
	
	this.Log.info("called : cmndPlay"); 
	
	if (playingVideo) {
		playingVideo.playbackRate = 1;
		this.setPlayingState(PLAYSTATE_PLAY);
		if (playingVideo.paused) {
			playingVideo.bPlayPauseTransition = true;
			playingVideo.play();
		}
	}
}	
	
mVid.cmndPause = function () {
	var playingVideo = this.getCurrentPlayingVideo();

	if (!playingVideo) {
		return;
	}
	
	this.Log.info("called : cmndPause"); 
	
	if (playingVideo && !playingVideo.paused) {
		playingVideo.bPlayPauseTransition = true;
		this.setPlayingState(PLAYSTATE_PAUSE);
		playingVideo.pause();
	}
}	
	
mVid.cmndReload = function () {
	this.Log.info("called : cmndReload"); 
	this.reload();
}	

mVid.cmndSeekFWD = function () {
	var playingVideo = this.getCurrentPlayingVideo();

	if (!playingVideo) {
		return;
	}
	
	this.Log.info("called : cmndSeekFWD"); 

	playingVideo.currentTime += 30;
}

mVid.cmndSeekBACK = function () {
	var playingVideo = this.getCurrentPlayingVideo();

	if (!playingVideo) {
		return;
	}
	
	this.Log.info("called : cmndSeekBACK"); 
	
	playingVideo.currentTime -= 30;
}

mVid.cmndLog = function () {
	var xhttp = new XMLHttpRequest();
	var fileName = commonUtils.extractDevName(navigator.userAgent) + "_" + Date.now() + ".log";

	this.Log.info("Save file : " + fileName); 
	
	// send a xhr/ajax POST request with the serialized media events
	xhttp.open("POST", "/savelog?filename=" + fileName, true);
	xhttp.setRequestHeader("Content-type", "text/plain"); 
	xhttp.send(this.Log.logStr);
}

mVid.cmndJumpToEnd = function () {
	var playingVideo = this.getCurrentPlayingVideo();

	if (!playingVideo) {
		return;
	}
	
	this.Log.info(playingVideo.id + ": Jump to end"); 

	if (playingVideo) {
		var t = playingVideo.duration * 0.9;
		playingVideo.currentTime = t;
		if (this.isMainFeatureVideo(playingVideo)) {
			var trans =  this.getTransitionPoint();
			
			if (trans.bEnabled) {
				var tt = trans.v;
			
				playingVideo.resumeFrom = Math.floor(t / tt) * tt;
			} else {
				playingVideo.resumeFrom = t;
			}
			
			this.showPlayrange();
		}
	}
}

mVid.cmndJumpToStart = function () {
	var playingVideo = this.getCurrentPlayingVideo();

	if (!playingVideo) {
		return;
	}
	
	this.Log.info(playingVideo.id + ": Jump to start"); 

	if (playingVideo) {
		var t = 0;
		playingVideo.currentTime = t;
		if (this.isMainFeatureVideo(playingVideo)) {
			playingVideo.resumeFrom = t;
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
	{ func : mVid.cmndPause, 		key : 'U', hbbKey : getVK('VK_PAUSE') 		}, 
	{ func : mVid.cmndSeekFWD,		key : 'J', hbbKey : getVK('VK_RIGHT')		}, 
	{ func : mVid.cmndSeekBACK,		key : 'B', hbbKey : getVK('VK_LEFT')		}, 
	{ func : mVid.cmndReload, 		key : 'L', hbbKey : getVK('VK_RED') 		}, 
	{ func : mVid.cmndLog, 			key : 'D', hbbKey : getVK('VK_GREEN')		}, 
	{ func : mVid.cmndJumpToStart,	key : 'S', hbbKey : getVK('VK_YELLOW')		}, 
	{ func : mVid.cmndJumpToEnd,	key : 'E', hbbKey : getVK('VK_BLUE')		}, 
	
	{ func : function() {this.setChannel(0)},	key : '0',	hbbKey : getVK('VK_0')	}, 
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





// ---------------------------------------------------------------------- //
// ---------------------------------------------------------------------- //
// ---------------------------------------------------------------------- //
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
// ---------------------------------------------------------------------- //
// ---------------------------------------------------------------------- //
// ---------------------------------------------------------------------- //

		