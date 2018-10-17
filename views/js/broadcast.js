// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// Broadcast MSync                                                                         //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

function SetupBroadcastObject(id, container, log)
{
    var startTime = Date.now();
	
    var bo;
    var mSync;
	
    const STATE_STOPPED 		= 0;
    const STATE_WAITINGFOR_BT 	= 1;
    const STATE_WATCHING_BT 	= 2;
    const STATE_BUFFERING_OD	= 3;
    const STATE_PLAYING_OD		= 4;
	
    var stateTxt = [
        "Stopped",
        "Waiting for broadcast content to start",
        "Watching broadcast content",
        "Buffering OnDemand content (and watching broadcast)",
        "Playing OnDemand content"
    ];
	
    const POLL_SLOW	= 500;
    const POLL_FAST	= 40;
	
	
    var curState 		= STATE_STOPPED;
    var pollInterval	= POLL_SLOW;
	
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
            return mSync.currentTime;
        } else {
            return 0;
        }
    }
	
	
    function setState(st, p) {
        if ((curState != st) || (pollInterval != p)) {
            log.info("Broadcast - change state: " + stateTxt[st] + " --- Poll Interval (ms): " + p); 
            curState = st;
            pollInterval = p;
        }
    }
	
    function checkState() {
		
        if ((curState == STATE_STOPPED) || (curState == STATE_PLAYING_OD)) {
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
                var a = preloadFunc;
                preloadFunc = null; // one hit
                a(curTime, preloadTime, pollInterval);
            }
            setState(STATE_BUFFERING_OD, POLL_FAST);
        }

        if (odTime && (curTime >= odTime)) {
            if (startOndemandFunc) {
                var a = startOndemandFunc;
                startOndemandFunc = null; // one hit
                a(curTime, odTime, pollInterval);
            }
            setState(STATE_PLAYING_OD, POLL_SLOW);
        }
	
        if ((curState == STATE_WAITINGFOR_BT) && curTime) {
            setState(STATE_WATCHING_BT, POLL_SLOW);
        }
		
        setTimeout(checkState, pollInterval);
    }
		
    checkState();
	
    log.info("SetupBroadcastObject: " + id);

    if (!e(id)) {
        var bo = document.createElement("object");	

        if (!bo) {
            log.error("SetupBroadcastObject: " + id + " Creation failed!");
            return null;
        }
	
        bo.setAttribute("id", id);

        bo.type = "video/broadcast";
        //bo.setAttribute("type", bo.type);
        bo.style.outline = "transparent";
        bo.setAttribute("class", "broadcast");
        e(container).appendChild(bo);
		
        if (this.bWindowedObjs) {
            bo.style.display 	= "block";
            bo.style.top  		= winObj.top;
            bo.style.left 		= winObj.left;
            bo.style.width		= winObj.width;
            bo.style.height 	= winObj.height;
            bo.style.backgroundColor	= winObj.bcol;
            bo.style.position	= "absolute";
			
            e("player-container").style.backgroundColor = "cyan";
        }
    }
	

    return {
        setWindow: function (o) {
            winObj = o;
        },
		
        bind: function () {
            try {
                log.info("SetupBroadcastObject: bindToCurrentChannel");
                bo.bindToCurrentChannel();
            } catch (e) {
                log.error("Starting of broadcast video failed: bindToCurrentChannel");
            }		
        },
		
        initMediaSync: function (s, fOk, fErr) {
            try {
                if (true) {
                    log.info("SetupBroadcastObject: createMediaSynchroniser");
                    mSync = oipfObjectFactory.createMediaSynchroniser();
                    log.info("SetupBroadcastObject: initMediaSynchroniser");
                    mSync.initMediaSynchroniser(bo,	s);				
                } else {
                    log.error("application/hbbtvMediaSynchroniser not supported.");
                    if (fErr) {
                        fErr(err);
                    }
                    return;
                }
            } catch (err) {
                log.error("Exception when creating creating hbbtvMediaSynchroniser Object. Error: " + err.message);
                if (fErr) {
                    fErr(err);
                }
                return;
            }
			
            setState(STATE_WAITINGFOR_BT, POLL_FAST);
            if (fOk) {
                fOk();
            }
        },
		
        setTimeEvents: function (p, t, f1, f2) {
            odTime = t;
            preloadTime	= t - p;
            preloadFunc = f1;
            startOndemandFunc = f2;
        },

        setTimeUpdateEvents: function (f) {
            timeupdateFunc = f;
        },
		
        hide: function () {
            bo.style.display = "none";
        },
		
        resume: function () {
            bo.style.display = "block";
            setState(STATE_WAITINGFOR_BT, POLL_FAST);
        },
		
        getId: function () {
            return id;
        },
		
        getCurrentTime: function () {
            return currentTime();
        }
    };
}
