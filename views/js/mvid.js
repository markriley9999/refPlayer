/*global UTILS GLOBAL_SERVERGUI dashjs */

var commonUtils = new UTILS();

function e(id) {
    return document.getElementById(id);
}


// --- MAIN OBJECT --- //
var mVid = {};

mVid.videoEvents = Object.freeze({
    LOAD_START       : "loadstart",
    PROGRESS         : "progress",
    SUSPEND          : "suspend",
    ABORT            : "abort",
    ERROR            : "error",
    EMPTIED          : "emptied",
    STALLED          : "stalled",
    LOADED_METADATA  : "loadedmetadata",
    LOADED_DATA      : "loadeddata",
    CAN_PLAY         : "canplay",
    CAN_PLAY_THROUGH : "canplaythrough",
    PLAYING          : "playing",
    WAITING          : "waiting",
    SEEKING          : "seeking",
    SEEKED           : "seeked",
    ENDED            : "ended",
    DURATION_CHANGE  : "durationchange",
    TIME_UPDATE      : "timeupdate",
    PLAY             : "play",
    PAUSE            : "pause",
    RATE_CHANGE      : "ratechange",
    RESIZE           : "resize",
    VOLUME_CHANGE    : "volumechange",
    ENCRYPTED        : "encrypted"
});

mVid.playCount = 0;

mVid.cnt = {
    "curBuffIdx" : 0,
    "curPlayIdx" : 0,
    "list"       : []
};

const STALL_TIMEOUT_MS = 10000;

const AD_TRANS_TIMEOUT_MS   = 20;
const AD_TRANS_THRESHOLD_MS = 3000;

const AD_START_THRESHOLD_S  = 10;
const AD_START_TIMEOUT_MS   = 20;

const PRELOAD_NEXT_AD_S = 10;

const CONTENT_FPS = 25;


// Error codes name table
mVid.eventErrorCodesMappingTable = [
    "0 = UNUSED_ERROR_CODE",
    "1 = MEDIA_ERROR_ABORTED",  // the user has aborted fetching the video
    "2 = MEDIA_ERROR_NETWORK",  // network error
    "3 = MEDIA_ERR_DECODE",     // error at decodation time
    "4 = MEDIA_ERR_SRC_NOT_SUPPORTED"   // media format not supported
];

// Network state table
mVid.networkStateMappingTable = [
    "0 = NETWORK_EMPTY",    // not yet initialized
    "1 = NETWORK_IDLE",     // source chosen; not in fetching state
    "2 = NETWORK_LOADING",  // actively fetches the source
    "3 = NETWORK_NO_SOURCE" //no source in a supported format can be spotted
];

// Media ready state - used for sanity checking state
const HAVE_NOTHING      = 0;    // no data
const HAVE_METADATA     = 1;    // duration, width, height and other metadata of the video have been fetched.
//const HAVE_CURRENT_DATA = 2;  // There has not been sufficiently data loaded in order to start or continue playback.
const HAVE_FUTURE_DATA  = 3;    // enough data to start playback
const HAVE_ENOUGH_DATA  = 4;    // it should be possible to play the media stream without interruption till the end.

// Windowed video objects
mVid.windowVideoObjects = {
    "mVid-video0"       :   { top : "96px",     left    : "240px",  width   : "480px",  height : "320px", bcol  : "blue" },
    "mVid-video1"       :   { top : "160px",    left    : "305px",  width   : "480px",  height : "320px", bcol  : "darkcyan" },
    "mVid-mainContent"  :   { top : "224px",    left    : "496px",  width   : "672px",  height : "426px", bcol  : "grey" },
    "mVid-broadcast"    :   { top : "224px",    left    : "496px",  width   : "672px",  height : "426px", bcol  : "grey" }
};

mVid.startTime = Date.now();



mVid.start = function () {
    var that        = this;
    
    this.EOPlayback = false;
    this.bAttemptStallRecovery = false;
    
    this.tvui       = window.InitTVUI();
    
    this.srvComms   = window.InitServerComms(GLOBAL_SERVERGUI);
    this.Log        = window.InitLog(this.srvComms);
    
    this.Log.info("app loaded");

    this.Log.info("GLOBAL_SERVERGUI: " + GLOBAL_SERVERGUI);
    
    this.displayBrowserInfo();

    // Parse query params
    this.params = [];
    
    this.params.overrideSubs    = commonUtils.getUrlVars()["subs"] || "";
    this.params.bCheckResume    = commonUtils.getUrlVars()["checkresume"] || false;
    this.params.bWindowedObjs   = commonUtils.getUrlVars()["win"] || false; 
    this.params.bEventsDump     = commonUtils.getUrlVars()["eventdump"] || false;
    this.params.bPartialSCTE    = commonUtils.getUrlVars()["partialscte"] || false;

    this.hbbtv = window.InitHBBTVApp(this.Log);
    
    this.showPlayrange();
    
    if (location.protocol === "https:") {
        this.tvui.ShowSecure(true);
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(";");
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)===" ") {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length,c.length);
            }
        }
        return "";
    }

    var currentChannel = commonUtils.getUrlVars()["test"] || getCookie("channel");
    
    window.getPlaylist(currentChannel || "0", this.Log, function(ch, playObj) {     

        that.procPlaylist(ch, playObj);

        
        that.transitionThresholdMS  = AD_TRANS_THRESHOLD_MS;
        that.bShowBufferingIcon     = false;
                
        that.showBufferingIcon(false);

        document.addEventListener("keydown", that.OnKeyDown.bind(that));

        
        window.setInterval( function() {
            that.updateAllBuffersStatus();  
        }, 1000);

        if (playObj.type === "video/broadcast") {

            that.Log.info("*** Use Video Broadcast Object ***");

            that.broadcast = window.SetupBroadcastObject("mVid-broadcast", "player-container", that.Log);
            
            if (that.broadcast) {
                that.tvui.ShowTransportIcons(false);
                
                that.broadcast.bind();
                
                if (playObj.timeline && playObj.timeline.selector) {
                    that.broadcast.initMediaSync(playObj.timeline.selector, 
                        function() {
                            that.tvui.ShowMSyncIcon("msyncicon");
                        }, 
                        function(err) {
                            that.tvui.ShowMSyncIcon("nomsyncicon");
                        }
                    );
                    if (that.params.bWindowedObjs) {
                        that.broadcast.setWindow(that.windowVideoObjects["mVid-broadcast"]);
                    }
                    
                    that.broadcast.contentDuration = playObj.contentDuration;
                    that.broadcast.adsDuration = playObj.adsDuration;
                    that.broadcast.cumulativeAdTransMS = 0;
                    that.broadcast.previousTimeMS = 0;
                    
                    that.broadcast.fps = playObj.timeline.fps ? playObj.timeline.fps : CONTENT_FPS;
                    
                    that.broadcast.bSetupAdTransEvents = true;
                    that.broadcast.bTimePlayTransition = false;
                    that.broadcast.setTimeUpdateEvents(onMsyncTimeUpdate(that));
                } else {
                    that.Log.warn("MediaSync timeline not defined.");           
                }
            } else {
                that.Log.error("Broadcast object init failed.");            
            }
            
        } else {
            that.resetStallTimer();
        
            var mainVideo = that.createVideo("mVid-mainContent");

            that.cues = window.InitCues(
                {
                    log     : that.Log, 
                    tvui    : that.tvui, 
                    params  : that.params, 
                    cfg     : that.hbbtv.cfg, 
                    fGetCurrentPlayingVideo : that.getCurrentPlayingVideo.bind(that),
                    fUpdateBufferStatus     : that.updateBufferStatus.bind(that),
                    eventSchemeIdUri        : playObj.eventSchemeIdUri
                }
            );

            if (!that.broadcast) {
                that.tvui.ShowPlayingState("stop");
            }
            
            // Clear key
            const KEYSYSTEM_TYPE = "org.w3.clearkey";

            var options = [];
            const audioContentType = "audio/mp4; codecs=\"mp4a.40.2\""; 
            const videoContentType = "video/mp4; codecs=\"avc3.4D4015\""; 

            options = [
                {
                    initDataTypes: ["cenc"],
                    videoCapabilities: [{contentType: videoContentType}],
                    audioCapabilities: [{contentType: audioContentType}],
                }
            ];

            if (typeof navigator.requestMediaKeySystemAccess !== "undefined") {
                window.SetupEME(mainVideo, KEYSYSTEM_TYPE, "video", options, that.contentTag, that.Log).then(function(p) {
                    that.Log.info(p);
                    that.setContentSourceAndLoad();             
                }, function(p) {
                    that.Log.error(p);
                });
                that.bEMESupport = true;
            } else {
                that.setContentSourceAndLoad();
                that.tvui.ShowEncrypted("noeme");
                that.bEMESupport = false;
            }
        }
        
    });
};

mVid.procPlaylist = function (ch, playObj) {
    var c = this.cnt.list;
    var i;
    
    // this.Log.info("- New playlist: " + JSON.stringify(playObj));
    
    this.Log.info("-----------------------------------------------------------");
    this.Log.info("*** Playing Content Summary ***");
    for (i = 0; i < playObj.info.length; i++) {
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
    
    c[lt].type                  = playObj.type;
    c[lt].transitionTime        = playObj.transitionTime;
    c[lt].transitionOffsetMS    = playObj.special_transition_c || 0;
    
    if (playObj.type === "video/broadcast") {
        c[lt].videoId               = "mVid-broadcast";
        playObj.special_jumptomain  = "true";
    } else {
        c[lt].videoId               = "mVid-mainContent";
    }
    
    c[lt].addContentId  = playObj.addContentId;
    c[lt].channelName   = playObj.channelName;

    if (c[lt].transitionOffsetMS !== 0) {
        this.Log.info(" * SpecialMode: Additional ad transition offset of: " + c[lt].transitionOffsetMS + "ms *");  
    }
    
    var pId = "mVid-video0";
    
    for (i = 0; i < lt; i++) {
        //this.Log.info("- Ad: " + i + " " + playObj.ads[i].src);   
        //this.Log.info("- Ad: " + i + " " + playObj.ads[i].type);  
        c[i] = {};
        c[i].src                = playObj.ads[i].src;
        c[i].type               = playObj.ads[i].type;
        c[i].transitionTime     = -1;
        c[i].transitionOffsetMS = 0;
        c[i].videoId            = pId;
        c[i].channelName        = playObj.channelName;
        pId = (pId === "mVid-video0") ? "mVid-video1" : "mVid-video0";
    }
    
    this.Log.info("---- Content List ----");    
    for (i = 0; i < c.length; i++) {
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
    
    this.tvui.ShowCurrentChannel(ch, playObj.channelName);
};

mVid.reload = function () {
    this.cmndLog();
    
    this.srvComms.Disconnect(function (){
        location.reload();
    });
};

mVid.setChannel = function (idx) {
    
    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }

    setCookie("channel", idx, 28);
    
    this.reload();
};

mVid.displayBrowserInfo = function () {
    this.Log.info("--------------------------------------------------------------------");
    this.Log.info("*** Browser CodeName:    " + navigator.appCodeName);
    this.Log.info("*** Browser Name:        " + navigator.appName);
    this.Log.info("*** Browser Version:     " + navigator.appVersion);
    this.Log.info("*** Cookies Enabled:     " + navigator.cookieEnabled);
    this.Log.info("*** Platform:            " + navigator.platform);
    this.Log.info("*** User-agent header:   " + navigator.userAgent);
    this.Log.info("--------------------------------------------------------------------");  
};

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
    
    if (!this.params.bWindowedObjs) {
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

    video.bPlayPauseTransition      = false;
    video.resumeFrom                = 0;
    video.bBuffEnoughToPlay         = false;
    video.bPlayEventFired           = false;
    video.bAdTransStartedPolling    = false;
    
    if (this.params.bWindowedObjs) {
        video.style.display     = "block";
        video.style.top         = this.windowVideoObjects[videoId].top;
        video.style.left        = this.windowVideoObjects[videoId].left;
        video.style.width       = this.windowVideoObjects[videoId].width;
        video.style.height      = this.windowVideoObjects[videoId].height;
        video.style.backgroundColor = this.windowVideoObjects[videoId].bcol;
        video.style.position    = "absolute";
    }
    
    return video;
};

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
        video=null; // don't really need this...
    }
};

mVid.getKeyByValue = function (obj, value) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            if(obj[prop] === value)
                return prop;
        }
    }
}; 
 
mVid.updateAllBuffersStatus = function() {
    if (this.broadcast) {
        this.srvComms.EmitJustCurrentTime(
            this.broadcast.getId(), 
            this.broadcast.getCurrentTime(), 
            this.broadcast.contentDuration, 
            (Date.now() - this.startTime) / 1000, 
            "");
    } else {
        this.updateBufferStatus("mVid-mainContent", "");
    }
    
    this.updateBufferStatus("mVid-video0", "");
    this.updateBufferStatus("mVid-video1", "");
}; 

mVid.updateBufferStatus = function(videoId, annot) {
    if (this.EOPlayback) {
        return;
    }
    
    var videoBuffer     = e(videoId + "-bufferBar");
    var headroomBuffer  = e(videoId + "-headroomBar");
    var video           = e(videoId);
    
    
    if (video)
    {
        var buffV           = 0;
        var buffD           = 0;
        var buffer          = video.buffered;
        var duration        = video.duration;
        
        if (video.paused) {
            videoBuffer.setAttribute("class", "bufferBar");
            headroomBuffer.setAttribute("class", "bufferBar");      
        } else {
            videoBuffer.setAttribute("class", "bufferBarActive");   
            headroomBuffer.setAttribute("class", "bufferBarActive");    
        }
        
        if (duration && (duration > 0)  && (duration !== Infinity)) {
            videoBuffer.max = duration;
            headroomBuffer.max = 60; // (duration < 60) ? duration : 60;

            if ((buffer.length > 0) && (video.currentTime < video.duration) /* !video.ended */) {
                buffV = buffer.end(buffer.length-1);
                buffD = buffV - video.currentTime;
                if (buffD < 0) {
                    buffD = 0;
                }
            }
            videoBuffer.value       = buffV;
            headroomBuffer.value    = buffD;
        } else
        {
            videoBuffer.value       = 0;    
            videoBuffer.max         = 60;   
            headroomBuffer.value    = 0;    
            headroomBuffer.max      = 60;   
        }
    }
    
    this.srvComms.EmitBufferEvent(videoId, video, videoBuffer, headroomBuffer, (Date.now() - this.startTime) / 1000, annot);
};

mVid.updatePlaybackBar = function(videoId) {
    var video = e(videoId);
    
    if (video) {
        this.__updatePlaybackBar(video.currentTime, video.duration); 
    }
};

mVid.__updatePlaybackBar = function(t, d) {
    var videoBar = e("playbackBar");

    if (d && (d > 0)) {
        videoBar.max = d;
        videoBar.value = t;
    } else
    {
        videoBar.value = 0; 
        videoBar.max = 100; 
    }

    this.srvComms.EmitPlaybackOffset(videoBar.value, videoBar.max);
};

mVid.showBufferingIcon = function (bBuffering) {
    if (this.bShowBufferingIcon !== bBuffering) {
        this.bShowBufferingIcon = bBuffering;       
        this.tvui.ShowBuffering(bBuffering);
    }
};

mVid.statusTableText = function (videoId, textEntry, text) {
    this.srvComms.StatusUpdate("e_" + videoId + "_" + textEntry, text);
};

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
};

mVid.getCurrentPlayingVideo = function () {
    //this.Log.info("getCurrentPlayingVideo: " + this.cnt.list[this.cnt.curPlayIdx].videoId);
    var idx = this.cnt.curPlayIdx;
    
    if (this.cnt.list[idx]){
        return e(this.cnt.list[idx].videoId);
    } else {
        return null;
    }
};

mVid.getBufferingContentIdx = function () {
    //this.Log.info("getBufferingContentIdx: " + this.cnt.curBuffIdx);
    return this.cnt.curBuffIdx;
};

mVid.getPlayingContentIdx = function () {
    //this.Log.info("getPlayingContentIdx: " + this.cnt.curPlayIdx);
    return this.cnt.curPlayIdx;
};

mVid.getTransitionPoint = function () {
    var c = this.cnt.list[this.cnt.curPlayIdx];
    
    var i = parseFloat(c.transitionTime);
    var o = parseFloat(c.transitionOffsetMS) / 1000;
    
    var obj = {};
    
    obj.bEnabled = (i !== -1);
    
    if (obj.bEnabled) {
        obj.v           = i;
        obj.offset      = o;
        obj.total       = o+i;
    } else {
        obj.v           = Number.MAX_SAFE_INTEGER;
        obj.offset      = 0;
        obj.total       = Number.MAX_SAFE_INTEGER;
    }
    
    // this.Log.info("getTransitionPoint - value: " + obj.v + " offset: " + obj.offset + " total: " + obj.total);

    return obj;
};

mVid.setContentSourceAndLoad = function () {
    var video;

    video = this.getCurrentBufferingVideo();
    this.Log.info(video.id + " setContentSourceAndLoad - curBuffIdx: " + this.cnt.curBuffIdx);
    
    if (this.bEMESupport) {
        this.tvui.ShowEncrypted("");
    }
    
    if (this.cues) { 
        this.cues.CheckSubs();
    }
    
    this.setSourceAndLoad(video, this.cnt.list[this.cnt.curBuffIdx].src, this.cnt.list[this.cnt.curBuffIdx].type);
};

mVid.skipBufferingToNextVideo = function () {
    if (++this.cnt.curBuffIdx >= this.cnt.list.length) {
        this.cnt.curBuffIdx = 0;
    }
    this.Log.info("skipBufferingToNextVideo: " + this.cnt.curBuffIdx);
    this.srvComms.StatusUpdate("BufferIdx", this.cnt.curBuffIdx);
};

mVid.skipPlayingToNextVideo = function () {
    if (++this.cnt.curPlayIdx >= this.cnt.list.length) {
        this.cnt.curPlayIdx = 0;
    }
    this.Log.info("skipPlayingToNextVideo: " + this.cnt.curPlayIdx);
    this.srvComms.StatusUpdate("PlayingIdx", this.cnt.curPlayIdx);
};

mVid.isMainFeatureVideo = function (video) {
    return (video.id === "mVid-mainContent");
};

mVid.isBroadcast = function (video) {
    return (video.id === "mVid-broadcast");
};

mVid.setPreload = function (video, mode) {
    var source = e(video.id + "-source");
    source.setAttribute("preload", mode);
};

mVid.setSourceAndLoad = function (video, src, type) {
    this.Log.info(video.id + " setSourceAndLoad - src: " + src + " type: " + type);
    
    this.statusTableText(video.id, "Type", type);
    
    var source = e(video.id + "-source");
    
    var bSetSource = true;
    
    if (this.isMainFeatureVideo(video)) 
    {
        if (source.type) {
            bSetSource = false;
            if (video.currentTime !== video.resumeFrom) {
                if (this.params.bCheckResume) {
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
        if (!this.hbbtv.app) {
            this.Log.warn("*** USE DASHJS (non hbbtv device) ***");     
            dashjs.MediaPlayerFactory.create(video, source);
        }
        //this.setPreload(video, "auto");
        video.load();
    }
};

mVid.switchVideoToPlaying = function(freshVideo, previousVideo) {
    // freshVideo / previousVideo can be null
    
    if (freshVideo === previousVideo) {
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
    if (previousVideo) this.Log.info(" - previousVideo: " + previousVideo.id);
    
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
    if (previousVideo && !this.params.bWindowedObjs) {
        previousVideo.style.display = "none";
    }
    
    if (freshVideo) {
        this.srvComms.StatusUpdate("PlayCount", ++this.playCount);
    }
    
    // Purge previous video
    if (previousVideo && (!this.isMainFeatureVideo(previousVideo) || this.bPurgeMain)) {
        this.purgeVideo(previousVideo.id);
    }
};

mVid.timeStampStartOfPlay = function (video) {
    if (video) {
        video.timestampStartPlay    = Date.now();
        video.bTimePlayTransition   = true;
        this.statusTableText(video.id, "Play trans", "");
        
        this.startAdTransitionTimer();
    }
};
    

mVid.getBufferedAmount = function (video) {
    var buffer  = video.buffered;
    var bufferEnd = 0;
    
    if (buffer.length > 1) {
        this.Log.warn(video.id + ": Fragmented buffer, ie multiple buffer fragments. (" + buffer.length + ")");     
    }
        
    if (buffer.length > 0) {
        bufferEnd = buffer.end(buffer.length-1);
    } 
    
    return bufferEnd;
};

mVid.showPlayrange = function () {
    var p = this.getCurrentPlayingVideo();
    
    if (!p || !this.isMainFeatureVideo(p)) {
        this.tvui.ShowPlayrange(0,0,0);
    } else {
        this.tvui.ShowPlayrange(p.resumeFrom, p.duration, this.getTransitionPoint().v);
    }
};

mVid.setEOPlayback = function () {
    this.Log.info("End of Playback - purging all players");
    this.EOPlayback = true;
    this.showBufferingIcon(false);
    this.purgeVideo("mVid-mainContent");
    this.purgeVideo("mVid-video0");
    this.purgeVideo("mVid-video1");
};

function onMsyncTimeUpdate (that) {
    return function (t) {
        var v = that.getCurrentPlayingVideo();
        var ms = t * 1000;
        
        if (t === 0) {
            that.Log.warn("msync: time = 0");
        }
        
        if (t && v && that.isBroadcast(v)) {
            // that.Log.info("msync: time " + t + "(s)" + " fps: " + that.broadcast.fps);
            that.tvui.UpdateMSyncTime(t, that.broadcast.fps);
            
            if (that.broadcast.previousTimeMS > ms) {
                that.Log.error("msync: previous time exceeds current time!");
                that.broadcast.previousTimeMS = ms;
            }
            
            if ((ms - that.broadcast.previousTimeMS) > 250) {
                that.broadcast.previousTimeMS = ms;
                that.resetStallTimer();
                that.__updatePlaybackBar(t, that.broadcast.contentDuration);
            }
            
            if (that.broadcast.bSetupAdTransEvents || that.broadcast.bTimePlayTransition) {
                
                var trans =  that.getTransitionPoint();

                if (trans.bEnabled) {
                    var tv = trans.v;
                    var nextTrans = (Math.floor((t + PRELOAD_NEXT_AD_S) / tv) + 1) * tv;
                    
                    if (that.broadcast.bSetupAdTransEvents) {
                        that.broadcast.bSetupAdTransEvents = false;
                        
                        that.Log.info("msync: Next Ad trans " + nextTrans + "(s)");
                        that.broadcast.setTimeEvents(PRELOAD_NEXT_AD_S, nextTrans, onMsyncPreloadAd(that), onMsyncPlayAd(that));
                        that.tvui.ShowPlayrange((nextTrans-tv), that.broadcast.contentDuration, that.getTransitionPoint().v);
                    }
                
                    if (that.broadcast.bTimePlayTransition) {
                        that.broadcast.bTimePlayTransition = false;
                        
                        var playTransMS = ((t - (nextTrans-tv)) - that.broadcast.adsDuration) * 1000;

                        that.statusTableText(that.broadcast.getId(), "Play trans", playTransMS + "ms");
                        that.srvComms.AdTrans(that.broadcast.getId() + " (cumulative)", playTransMS);
                        that.Log.info("msync: trans back to live (absolute)" + playTransMS + "(ms)  Frames: " + parseInt(playTransMS * that.broadcast.fps / 1000));

                        var relPlayTransMS = playTransMS - that.broadcast.cumulativeAdTransMS;

                        that.srvComms.AdTrans(that.broadcast.getId() + " (relative)", relPlayTransMS);
                        that.Log.info("msync: trans back to live (relative)" + relPlayTransMS + "(ms)  Frames: " + parseInt(relPlayTransMS * that.broadcast.fps / 1000));
                        
                        that.broadcast.cumulativeAdTransMS = 0;
                    }
                }
            }
        }
    };
}

function onMsyncPreloadAd (that) {
    return function (t, target, pollInterval) {
        var f;
        var delta = t - target;
        
        that.Log.info("msync: preload ad now: " + t + "(s)");

        if ((delta * 1000) < (pollInterval*2)) { 
            f = that.Log.info;
        } else {
            f = that.Log.warn;
        }

        f("msync: preload delta: " + delta + "(s) - frames: " + parseInt(that.broadcast.fps * delta));
        that.skipBufferingToNextVideo(); // Get ready to buffer next video
        that.setContentSourceAndLoad();

        var v = that.getCurrentBufferingVideo();
        that.updateBufferStatus(v.id, "Preload next ad");
        that.resetStallTimer();
    };
}

function onMsyncPlayAd (that) {
    return function (t, target, pollInterval) {
        var f;
        var delta = t - target;
        
        that.Log.info("msync: play ad now: " + t + "(s)");

        if ((delta * 1000) < (pollInterval*2)) { 
            f = that.Log.info;
        } else {
            f = that.Log.warn;
        }
        
        f("msync: play ad delta: " + delta + "(s) - frames: " + parseInt(that.broadcast.fps * delta));
        
        that.skipPlayingToNextVideo();
        var v = that.getCurrentPlayingVideo();
        
        if (v) {
            that.updateBufferStatus(v, "Play advert");
        
            that.timeStampStartOfPlay(v);

            if (v.bBuffEnoughToPlay) {
                that.switchVideoToPlaying(v, null);
            }
            
            that.broadcast.hide(); 
            that.tvui.ShowMsyncTime(false);
        }
    };
}

function onVideoEvent (m) {
    return function (event) {
        if (m.EOPlayback) {
            return;
        }
        
        var bufferingVideo = m.getCurrentBufferingVideo();
        var playingVideo = m.getCurrentPlayingVideo();

        var bufferingContentIdx = m.getBufferingContentIdx();
        var playingContentIdx = m.getPlayingContentIdx();
        
        var bBufferingWhilstAttemptingToPlay = (bufferingContentIdx === playingContentIdx);
        var newPlayingVideo;
        
        switch(event.type) {
        case m.videoEvents.LOAD_START:
            m.Log.info(this.id + ": video has started loading");
            m.updateBufferStatus(this.id, "Event: " + event.type);
            // Sanity check
            /* TODO: why is this being generated for non buffering content???
                if (this != bufferingVideo) {
                    m.Log.warn(this.id + ": " + event.type + ": event for non buffering video object!");
                }
                */
            if (this.readyState !== HAVE_NOTHING) {
                m.Log.warn(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_NOTHING");
            }
            this.bufferSeqCheck = event.type;
            break;
                
        case m.videoEvents.LOADED_METADATA:
            m.Log.info(this.id + ": metadata has loaded");
            m.statusTableText(this.id, "Buffer", "Started buffering");
            m.updateBufferStatus(this.id, "Event: " + event.type);
            // Sanity check
            if (this !== bufferingVideo) {
                m.Log.warn(this.id + ": " + event.type + ": event for non buffering video object!");
            }
            if (this.readyState !== HAVE_METADATA) {
                m.Log.info(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_METADATA"); // TODO: Need to check this....
            }
            if (this.bufferSeqCheck !== m.videoEvents.LOAD_START) {
                m.Log.warn(this.id + ": " + event.type + ": event sequence error!");
            }
            this.bufferSeqCheck = event.type;
                
            if (this === playingVideo) {
                m.resetStallTimer();
            }
            break;
                
        case m.videoEvents.CAN_PLAY:
            m.Log.info(this.id + ": video can play");
            m.statusTableText(this.id, "Buffer", "Enough to start play");
            m.updateBufferStatus(this.id, "Event: " + event.type);
                    
            // Sanity check
            if (this !== bufferingVideo) {
                m.Log.error(this.id + ": " + event.type + ": event for non buffering video object!");
            }
            if (this.readyState !== HAVE_FUTURE_DATA) {
                m.Log.info(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_FUTURE_DATA"); // TODO: Need to check this....
            }
            if (this.bufferSeqCheck !== m.videoEvents.LOADED_METADATA) {
                m.Log.warn(this.id + ": " + event.type + ": event sequence error!");
            }
            this.bufferSeqCheck = event.type;
                
                
            if (m.getBufferedAmount(this) === 0) {
                m.Log.warn(this.id + ": Buffer should not still be empty!");                
            }

            this.bBuffEnoughToPlay = true;

            if (bBufferingWhilstAttemptingToPlay) {
                // Happens for first piece of content (or we're behind on buffering) - we can start playing now...
                m.switchVideoToPlaying(this, null);
            } 

            if (this === playingVideo) {
                m.resetStallTimer();
            }

            break;
                
        case m.videoEvents.CAN_PLAY_THROUGH:
            m.Log.info(this.id + ": buffered sufficiently to play-through.");
            m.statusTableText(this.id, "Buffer", "Can play through");
            m.updateBufferStatus(this.id, "Event: " + event.type);

            // Sanity check
            if (this !== bufferingVideo) {
                m.Log.warn(this.id + ": " + event.type + ": event for non buffering video object!");
            }
            if (this.readyState !== HAVE_ENOUGH_DATA) {
                m.Log.warn(this.id + ": " + event.type + ": readyState mismatch - expected HAVE_ENOUGH_DATA");
            }
            if (this.bufferSeqCheck !== m.videoEvents.CAN_PLAY) {
                m.Log.warn(this.id + ": " + event.type + ": event sequence error!");
            }
            this.bufferSeqCheck = event.type;

            if (m.getBufferedAmount(this) === 0) {
                m.Log.warn(this.id + ": Buffer should not still be empty!");                
            }
                
            this.bBuffEnoughToPlay = true;

            if (this === playingVideo) {
                m.resetStallTimer();
            }

            if (bBufferingWhilstAttemptingToPlay && this.paused) {
                // Happens for first piece of content (or we're behind on buffering) - we can start playing now...
                m.switchVideoToPlaying(this, null);
            } 

            break;
                
        case m.videoEvents.PLAY:
            m.Log.info(this.id + ": video is playing");
            m.statusTableText(this.id, "Play", "Playing");
            // m.statusTableText(this.id, "Buffer", "Being consumed");
            m.updateBufferStatus(this.id, "");

            if (!m.broadcast) {
                m.tvui.ShowPlayingState("play");
            }
            m.showPlayrange();
                
            if (this === playingVideo) {
                this.bPlayEventFired = true;
            } else {
                m.Log.error(this.id + ": " + event.type + ": event for non playing video object!");
            }

            if (m.getBufferedAmount(this) === 0) {
                m.Log.warn(this.id + ": Buffer should not still be empty!");                
            }

            if ((this === playingVideo) && !this.bPlayPauseTransition) {
                this.startPlaybackPointMS = this.currentTime * 1000;
            } else {
                this.bPlayPauseTransition = false;
            }
                
            if (m.bPurgeMain) {
                // Special case - recalculate resume points, this is used for dynamic content (when also using multiple video objects!!!)
                if (m.isMainFeatureVideo(this) && (this === playingVideo)) {
                    var trans =  m.getTransitionPoint();
                                                
                    if (trans.bEnabled) {
                        var tt = trans.v;
                        
                        this.resumeFrom = Math.floor(this.currentTime / tt) * tt;
                    } else {
                        this.resumeFrom = 0;
                    }
                    m.showPlayrange();
                    m.Log.info("* SpecialMode " + this.id + ": recalculate resumefrom point. " + this.resumeFrom + "S *");
                }
            }
                
            // Sanity check
            if (m.isMainFeatureVideo(this) && (this === playingVideo) && (playingVideo.currentTime < playingVideo.resumeFrom)) {
                m.Log.error(this.id + ": resume error (currentTime < resume point)");
                playingVideo.currentTime = playingVideo.resumeFrom;
            }
            break;
                
        case m.videoEvents.PAUSE:
            m.Log.info(this.id + ": video is paused");
            m.statusTableText(this.id, "Play", "Paused");
            m.updateBufferStatus(this.id, "Event: " + event.type);

            // Sanity check
            if (this !== playingVideo) {
                m.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
            }

            if (this.bPlayPauseTransition) {
                if (!m.broadcast) {
                    m.tvui.ShowPlayingState("pause");
                }
            } else
            {
                if (m.isMainFeatureVideo(this)) {
                    m.skipPlayingToNextVideo();
                    newPlayingVideo = m.getCurrentPlayingVideo();
                        
                    if (newPlayingVideo) {
                        m.timeStampStartOfPlay(newPlayingVideo);
                        if (newPlayingVideo.bBuffEnoughToPlay) {
                            m.switchVideoToPlaying(newPlayingVideo, this);
                        } else {
                            // oh dear - still buffering, not ready to play yet 
                            m.switchVideoToPlaying(null, this);             
                        }
                    }
                }
            }
            break;
                
        case m.videoEvents.SEEKED:
            m.Log.info(this.id + ": video has seeked");
            m.updateBufferStatus(this.id, "Event: " + event.type);
            // Sanity check
            if (this !== playingVideo) {
                m.Log.warn(this.id + ": " + event.type + ": event for non playing video object!");
            }
            break;
                
        case m.videoEvents.STALLED:
            m.Log.warn(this.id + ": has stalled");
            m.showBufferingIcon(true);
            m.updateBufferStatus(this.id, "Event: " + event.type);
            break;
                
        case m.videoEvents.WAITING:
            m.Log.warn(this.id + ": is waiting");
            m.showBufferingIcon(true);
            m.updateBufferStatus(this.id, "Event: " + event.type);
            break;
                
        case m.videoEvents.RESIZE:
            m.Log.info(this.id + ": resize called");
            m.updateBufferStatus(this.id, "Event: " + event.type);
            break;
                
        case m.videoEvents.ENDED:
            m.statusTableText(this.id, "Buffer", "---");
            m.Log.info(this.id + ": video has ended");
            m.updateBufferStatus(this.id, "Event: " + event.type);
                
            m.showBufferingIcon(true);
            if (!m.broadcast) {
                m.tvui.ShowPlayingState("stop");
            }

            // Start playing buffered content
            if (m.isMainFeatureVideo(this)) {
                m.Log.info(this.id + ": video has ended - stop everything.");
                m.setEOPlayback();
                m.cmndLog();
                return;
            } else {
                m.skipPlayingToNextVideo();
                newPlayingVideo = m.getCurrentPlayingVideo();
                    
                if (m.isBroadcast(newPlayingVideo)) {
                    m.Log.info(newPlayingVideo.id + ": show broadcast.");
                        
                    if (m.broadcast) {
                        m.broadcast.bSetupAdTransEvents = true;
                        m.broadcast.bTimePlayTransition = true;
                        m.broadcast.resume();
                        m.switchVideoToPlaying(null, this);
                    }

                } else {
                    m.timeStampStartOfPlay(newPlayingVideo);
                    if (newPlayingVideo.bBuffEnoughToPlay) {
                        m.switchVideoToPlaying(newPlayingVideo, this);
                    } else {
                        // oh dear - still buffering, not ready to play yet 
                        m.switchVideoToPlaying(null, this);             
                    }
                }
            }
            break;

        case m.videoEvents.TIME_UPDATE:
            var tNow = Math.floor(this.currentTime);

            // Only do this once a second
            if (tNow !== this.tOld) 
            {
                if ((this === playingVideo) && this.bPlayEventFired) {
                    this.tOld = tNow;               
                        
                    m.statusTableText(this.id, "Pos", Math.floor(this.currentTime));
                    m.updatePlaybackBar(this.id);
                
                    // Time for adverts?
                    if (m.isMainFeatureVideo(playingVideo) && !this.bAdTransStartedPolling) {
                        if (((this.currentTime - this.resumeFrom) + AD_START_THRESHOLD_S) >= m.getTransitionPoint().v) {
                            this.bAdTransStartedPolling = true;
                            m.startAdStartTimer();
                        }
                    }

                    // Check if gone off end!
                    if (this.currentTime > this.duration) {
                        m.Log.error("Current Time > Duration - content should have ended!");
                    }
                        
                    // Start buffering next programme?
                    if (bBufferingWhilstAttemptingToPlay) {
                        var duration    = this.duration;
                        var bPreloadNextAd = false;
                            
                        if (m.isMainFeatureVideo(this)) {
                            if ((this.currentTime + PRELOAD_NEXT_AD_S) >= (this.resumeFrom + m.getTransitionPoint().v)) {
                                bPreloadNextAd = true;
                                // not needed???? m.setPreload(playingVideo, "none");
                            }
                        } else {
                            if ((this.currentTime + PRELOAD_NEXT_AD_S) >= duration) {
                                bPreloadNextAd = true;
                            }                   
                        }
                            
                        if (bPreloadNextAd) {
                            m.Log.info(this.id + ": Commence buffering for next item");         
                            m.skipBufferingToNextVideo(); // Get ready to buffer next video

                            bufferingVideo = m.getCurrentBufferingVideo();

                            if (!m.isBroadcast(bufferingVideo)) {
                                m.setContentSourceAndLoad();
                                m.updateBufferStatus(this.id, "Preload next ad");
                            }
                                
                            if (this.bufferSeqCheck !== m.videoEvents.CAN_PLAY_THROUGH) {
                                m.Log.warn(this.id + ": " + event.type + ": event sequence error!");
                            }
                        }
                    }                       
                }               
            }
            m.resetStallTimer();
            break;
                
        case m.videoEvents.ERROR:
            m.Log.error(this.id + ": video error: " + event.srcElement.error.code + " - " + m.eventErrorCodesMappingTable[event.srcElement.error.code]);
            m.updateBufferStatus(this.id, "Event: " + event.type);
            break;
                
        case m.videoEvents.ENCRYPTED:
            if (m.bEMESupport) {
                m.tvui.ShowEncrypted("encrypted");
            }
            m.Log.warn(this.id + ": ENCRYPTED");
            m.updateBufferStatus(this.id, "Event: " + event.type);
            break;

        case m.videoEvents.SUSPEND:
        case m.videoEvents.ABORT:
        case m.videoEvents.EMPTIED:
        case m.videoEvents.LOADED_DATA:
        case m.videoEvents.PLAYING:
        case m.videoEvents.SEEKING:
        case m.videoEvents.DURATION_CHANGE:
        case m.videoEvents.RATE_CHANGE:
        case m.videoEvents.VOLUME_CHANGE:
            m.updateBufferStatus(this.id, "Event: " + event.type);
            break;

        default:
                //do nothing
        }
    };
}

mVid.getCurrentTime = function (v) {
    return v.currentTime;
};

mVid.startAdTransitionTimer = function () {
    if (this.adTimerId) clearTimeout(this.adTimerId);
    this.adTimerId = setTimeout(this.OnCheckAdTransition.bind(this), AD_TRANS_TIMEOUT_MS);
};

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
        this.srvComms.AdTrans(vid.id, playTransMS);
        
        if (this.broadcast) {
            this.broadcast.cumulativeAdTransMS += playTransMS;
        }
    } else {
        this.adTimerId = setTimeout(this.OnCheckAdTransition.bind(this), AD_TRANS_TIMEOUT_MS);
    }
};

mVid.startAdStartTimer = function () {
    if (this.adStartTimerId) clearTimeout(this.adStartTimerId);
    this.adStartTimerId = setTimeout(this.OnCheckAdStart.bind(this), AD_START_TIMEOUT_MS);
};

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
};

mVid.killStallTimer = function () {
    this.showBufferingIcon(false);
    if (this.stallTimerId) clearTimeout(this.stallTimerId);
};

mVid.resetStallTimer = function () {
    this.killStallTimer();
    this.stallCount = 0;
    this.stallTimerId = setTimeout(this.OnCatchStall.bind(this), STALL_TIMEOUT_MS);
};

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
};


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
};

mVid.cmndFastForward = function () {
    var playingVideo = this.getCurrentPlayingVideo();
    
    if (this.broadcast) {
        return;
    }
    
    if (!playingVideo) {
        return;
    }
    
    this.Log.info("called : cmndFastForward"); 

    if (playingVideo) playingVideo.playbackRate = 4;    
    this.tvui.ShowPlayingState("ffwd");
};  
    
mVid.cmndRewind = function () {
    var playingVideo = this.getCurrentPlayingVideo();

    if (this.broadcast) {
        return;
    }
    
    if (!playingVideo) {
        return;
    }
    
    this.Log.info("called : cmndRewind"); 
    
    if (playingVideo) playingVideo.playbackRate = -4;   
    this.tvui.ShowPlayingState("rewind");
};  
    
mVid.cmndPlay = function () {
    var playingVideo = this.getCurrentPlayingVideo();

    if (this.broadcast) {
        return;
    }
    
    if (!playingVideo) {
        return;
    }
    
    this.Log.info("called : cmndPlay"); 
    
    playingVideo.playbackRate = 1;
    this.tvui.ShowPlayingState("play");
    if (playingVideo.paused) {
        playingVideo.bPlayPauseTransition = true;
        playingVideo.play();
    }
};  
    
mVid.cmndPause = function () {
    var playingVideo = this.getCurrentPlayingVideo();

    if (this.broadcast) {
        return;
    }
    
    if (!playingVideo) {
        return;
    }
    
    this.Log.info("called : cmndPause"); 
    
    if (playingVideo && !playingVideo.paused) {
        playingVideo.bPlayPauseTransition = true;
        this.tvui.ShowPlayingState("pause");
        playingVideo.pause();
    }
};  
    
mVid.cmndPlayPause = function () {
    var playingVideo = this.getCurrentPlayingVideo();

    if (this.broadcast) {
        return;
    }
    
    if (!playingVideo) {
        return;
    }
    
    this.Log.info("called : cmndPlayPause"); 
    
    playingVideo.bPlayPauseTransition = true;
    
    if (!playingVideo.paused) {
        this.tvui.ShowPlayingState("pause");
        playingVideo.pause();
    } else {
        this.tvui.ShowPlayingState("play");
        playingVideo.play();
    }
};  
    
mVid.cmndReload = function () {
    this.Log.info("called : cmndReload"); 
    this.reload();
};  

mVid.seek = function (v, t) {
    v.currentTime = t;
};

mVid.cmndSeekFWD = function () {
    var playingVideo = this.getCurrentPlayingVideo();

    if (this.broadcast) {
        return;
    }
    
    if (!playingVideo) {
        return;
    }
    
    this.Log.info("called : cmndSeekFWD"); 

    this.seek(playingVideo, playingVideo.currentTime + 30);
};

mVid.cmndSeekBACK = function () {
    var playingVideo = this.getCurrentPlayingVideo();

    if (this.broadcast) {
        return;
    }
    
    if (!playingVideo) {
        return;
    }
    
    this.Log.info("called : cmndSeekBACK"); 
    
    this.seek(playingVideo, playingVideo.currentTime - 30);
};

mVid.cmndLog = function () {
    var fileName = commonUtils.extractDevName(navigator.userAgent) + "_" + Date.now() + ".log";

    this.Log.info("Save file : " + fileName); 
    this.Log.SaveLog(fileName);
};

mVid.cmndTogSubs = function () {
    if (this.cues) { 
        this.cues.ToggleOverrideSub();
    }
};

mVid.cmndSubsOn = function () {
    if (this.cues) { 
        this.cues.OverrideSubs("on");
    }
};

mVid.cmndSubsOff = function () {
    if (this.cues) { 
        this.cues.OverrideSubs("off");
    }
};

mVid.cmndJumpToEnd = function () {
    var playingVideo = this.getCurrentPlayingVideo();

    if (this.broadcast) {
        return;
    }
    
    if (!playingVideo) {
        return;
    }
    
    this.Log.info(playingVideo.id + ": Jump to end"); 

    if (playingVideo) {
        var t = playingVideo.duration * 0.9;
        this.seek(playingVideo, t);

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
};

mVid.cmndJumpToStart = function () {
    var playingVideo = this.getCurrentPlayingVideo();

    if (this.broadcast) {
        return;
    }
    
    if (!playingVideo) {
        return;
    }
    
    this.Log.info(playingVideo.id + ": Jump to start"); 

    if (playingVideo) {
        var t = 0;
        this.seek(playingVideo, t);
        if (this.isMainFeatureVideo(playingVideo)) {
            playingVideo.resumeFrom = t;
            this.showPlayrange();
        }
    }
};

// Key mapping table
var keyTable = {};

var getKey = window.InitVKKeys();

keyTable.entries = [
    { func : mVid.cmndSubsOn,       key : "",  hbbKey : getKey("VK_UP")              }, 
    { func : mVid.cmndSubsOff,      key : "",  hbbKey : getKey("VK_DOWN")            }, 
    { func : mVid.cmndRewind,       key : "R", hbbKey : getKey("VK_REWIND")          }, 
    { func : mVid.cmndPlay,         key : "P", hbbKey : getKey("VK_PLAY")            }, 
    { func : mVid.cmndPause,        key : "U", hbbKey : getKey("VK_PAUSE")           }, 
    { func : mVid.cmndPlayPause,    key : "T", hbbKey : getKey("VK_PLAY_PAUSE")      }, 
    { func : mVid.cmndSeekFWD,      key : "",  hbbKey : getKey("VK_RIGHT")           }, 
    { func : mVid.cmndSeekBACK,     key : "",  hbbKey : getKey("VK_LEFT")            }, 
    { func : mVid.cmndReload,       key : "L", hbbKey : getKey("VK_RED")             }, 
    { func : mVid.cmndLog,          key : "D", hbbKey : getKey("VK_GREEN")           }, 
    { func : mVid.cmndJumpToStart,  key : "S", hbbKey : getKey("VK_YELLOW")          }, 
    { func : mVid.cmndJumpToEnd,    key : "E", hbbKey : getKey("VK_BLUE")            }, 
    
    { func : function() {this.setChannel(0);},  key : "0",  hbbKey : getKey("VK_0")  }, 
    { func : function() {this.setChannel(1);},  key : "1",  hbbKey : getKey("VK_1")  }, 
    { func : function() {this.setChannel(2);},  key : "2",  hbbKey : getKey("VK_2")  }, 
    { func : function() {this.setChannel(3);},  key : "3",  hbbKey : getKey("VK_3")  }, 
    { func : function() {this.setChannel(4);},  key : "4",  hbbKey : getKey("VK_4")  }, 
    { func : function() {this.setChannel(5);},  key : "5",  hbbKey : getKey("VK_5")  }, 
    { func : function() {this.setChannel(6);},  key : "6",  hbbKey : getKey("VK_6")  }, 
    { func : function() {this.setChannel(7);},  key : "7",  hbbKey : getKey("VK_7")  }, 
    { func : function() {this.setChannel(8);},  key : "8",  hbbKey : getKey("VK_8")  }, 
    { func : function() {this.setChannel(9);},  key : "9",  hbbKey : getKey("VK_9")  } 
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
};

window.onbeforeunload = function () {
    mVid.Log.warn("Unload page");
    mVid.cmndLog();
    mVid.srvComms.Disconnect();
};
// ---------------------------------------------------------------------- //
// ---------------------------------------------------------------------- //
// ---------------------------------------------------------------------- //

        