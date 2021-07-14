// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// Broadcast MSync                                                                         //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

/*global oipfObjectFactory */

window.SetupBroadcastObject = function (id, container, log)
{
    var bo = null;
    var mSync = null;
    var timelineSelector = null;
    var offsetMS = 0;
    
    const STATE_STOPPED         = 0;
    const STATE_WAITINGFOR_BT   = 1;
    const STATE_WATCHING_BT     = 2;
    const STATE_BUFFERING_OD    = 3;
    const STATE_PLAYING_OD      = 4;
    
    var stateTxt = [
        "Stopped",
        "Waiting for broadcast content to start",
        "Watching broadcast content",
        "Buffering OnDemand content (and watching broadcast)",
        "Playing OnDemand content"
    ];
    
    const POLL_SLOW = 500;
    const POLL_FAST = 40;
    
    
    var curState        = STATE_STOPPED;
    var pollInterval    = POLL_SLOW;
    
    var curTime;
    
    var odTime;
    var preloadTime;
    var preloadFunc;
    var startOndemandFunc;
    
    var timeupdateFunc;
    var winObj = null;
    
    
    function e(id) {
        return document.getElementById(id);
    }


    function currentTime() {
        if (mSync) {
            return mSync.currentTime + (offsetMS / 1000);
        } else {
            return 0;
        }
    }
    
    
    function setState(st, p) {
        if ((curState !== st) || (pollInterval !== p)) {
            log.info("Broadcast - change state: " + stateTxt[st] + " --- Poll Interval (ms): " + p); 
            curState = st;
            pollInterval = p;
        }
    }
    
    function createMediaSync() {
        if (!mSync) {
            try {
                if (oipfObjectFactory.isObjectSupported("application/hbbtvMediaSynchroniser")) {
                    log.info("SetupBroadcastObject: createMediaSynchroniser");
                    mSync = oipfObjectFactory.createMediaSynchroniser();
                    
                    mSync.onError = function (err, src) {
                        log.error("MediaSynchroniser error: " + err + " (" + src + ")");
                        return;
                    };
                                        
                } else {
                    log.error("application/hbbtvMediaSynchroniser not supported.");
                    return false;
                }
            } catch (err) {
                log.error("Exception when creating creating hbbtvMediaSynchroniser Object. Error: " + err.message);
                return false;
            }
        } else {
            log.info("hbbtvMediaSynchroniser already created.");
        }

        setState(STATE_WAITINGFOR_BT, POLL_FAST);

        return true;        
    }
    
    
    function checkState() {
        var a;
        
        if ((curState === STATE_STOPPED) || (curState === STATE_PLAYING_OD)) {
            setTimeout(checkState, pollInterval);
            return;
        }
        
        curTime = currentTime(); 
        //log.info("msync: currentTime: " + curTime + "(s)");
        
        if (timeupdateFunc && curTime) {
            timeupdateFunc(curTime);
        }
        
        if (preloadTime && (curTime >= preloadTime)) {
            if (preloadFunc) {
                a = preloadFunc;
                preloadFunc = null; // one hit
                a(curTime, preloadTime, pollInterval);
            }
            setState(STATE_BUFFERING_OD, POLL_FAST);
        }

        if (odTime && (curTime >= odTime)) {
            if (startOndemandFunc) {
                a = startOndemandFunc;
                startOndemandFunc = null; // one hit
                a(curTime, odTime, pollInterval);
            }
            setState(STATE_PLAYING_OD, POLL_SLOW);
        }
    
        if ((curState === STATE_WAITINGFOR_BT) && curTime) {
            setState(STATE_WATCHING_BT, POLL_SLOW);
        }
        
        setTimeout(checkState, pollInterval);
    }
        
    checkState();
    
    log.info("SetupBroadcastObject: " + id);

    if (!e(id)) {
        bo = document.createElement("object");  

        if (!bo) {
            log.error("SetupBroadcastObject: " + id + " Creation failed!");
            return null;
        }
    
        try {
            bo.setAttribute("id", id);

            bo.type = "video/broadcast";
            //bo.setAttribute("type", bo.type);
            bo.style.outline = "transparent";
            bo.setAttribute("class", "broadcast");
            e(container).appendChild(bo);
        } catch (err) {
            log.error("SetupBroadcastObject error: " + err.messsage);
        }
        
        if (bo && this.bWindowedObjs) {
            bo.style.display    = "block";
            bo.style.top        = winObj.top;
            bo.style.left       = winObj.left;
            bo.style.width      = winObj.width;
            bo.style.height     = winObj.height;
            bo.style.backgroundColor    = winObj.bcol;
            bo.style.position   = "absolute";
            
            e("player-container").style.backgroundColor = "cyan";
        }
    }
    

    return {
        setWindow: function (o) {
            winObj = o;
        },
        
        init: function (s, o, fOk, fErr) {
            timelineSelector = s;
            offsetMS = parseInt(o) ? parseInt(o) : 0;
            
            if (createMediaSync()) {
                fOk();
            } else {
                fErr();
            }            
        },
        
        setTimeEvents: function (p, t, f1, f2) {
            odTime = t;
            preloadTime = t - p;
            preloadFunc = f1;
            startOndemandFunc = f2;
        },

        setTimeUpdateEvents: function (f) {
            timeupdateFunc = f;
        },
        
        reset: function () {
            setState(STATE_STOPPED, POLL_SLOW);
            bo.style.display = "none";
            bo.stop();
            mSync = null;
        },
        
        initMediaSync: function () {

            if (!createMediaSync()) {
                return false;
            }            
            
            function checkEv(ev) {
                
                log.info("MediaSynchroniser event: " + ev.state);
                
                // A video/broadcast object that is passed to the initMediaSynchroniser() or addMediaObject() methods shall always be in the connecting or presenting states.
                
                if ((ev.state === 1 /* connecting */) || (ev.state === 2 /* presenting */)) {    
                    
                    bo.removeEventListener("PlayStateChange", checkEv);
                    
                    try {
                        if (mSync) {
                            log.info("SetupBroadcastObject: initMediaSynchroniser");
                            mSync.initMediaSynchroniser(bo, timelineSelector);             
                            setState(STATE_WAITINGFOR_BT, POLL_FAST);
                        }
                    } catch(err) {
                        log.error("SetupBroadcastObject: initMediaSynchroniser init error: " + err.message);
                    }
                    
                }
            }
                        
            try {
                log.info("SetupBroadcastObject: bindToCurrentChannel");
                
                bo.addEventListener("PlayStateChange", checkEv);
                
                bo.bindToCurrentChannel();
                bo.style.display = "block";
            } catch (err) {
                log.error("Starting of broadcast video failed: bindToCurrentChannel: " + err.message);
                return false;
            }                   
        },
        
        getId: function () {
            return id;
        },
        
        getCurrentTime: function () {
            return currentTime();
        }
    };
};
