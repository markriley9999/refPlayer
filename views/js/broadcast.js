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
	const STATE_WATCHING_BT 	= 1;
	const STATE_BUFFERING_OD	= 2;
	const STATE_PLAYING_OD		= 3;
	
	const POLL_SLOW	= 1000;
	const POLL_FAST	= 100;
	
	
	var curState 	= STATE_STOPPED;
	var pollRate	= POLL_SLOW;
	
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
			log.warn("mSync not defined, using emulated time.");
			return (Date.now() - startTime) / 1000;
		}
	}
	
	
	function checkState() {
		
		if ((curState == STATE_STOPPED) || (curState == STATE_PLAYING_OD)) {
			setTimeout(checkState, pollRate);
			return;
		}
		
		curTime = currentTime(); 
		//log.info("msync: currentTime: " + curTime + "(s)");
		
		if (timeupdateFunc) {
			timeupdateFunc(curTime);
		}
		
		if (preloadTime && (curTime >= preloadTime)) {
			curState = STATE_BUFFERING_OD;
			pollRate = POLL_FAST;
			if (preloadFunc) {
				var a = preloadFunc;
				preloadFunc = null; // one hit
				a(curTime);
			}
		}

		if (odTime && (curTime >= odTime)) {
			curState = STATE_PLAYING_OD;
			pollRate = POLL_SLOW;
			if (startOndemandFunc) {
				var a = startOndemandFunc;
				startOndemandFunc = null; // one hit
				a(curTime);
			}
		}
	
		setTimeout(checkState, pollRate);
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
		
		initMediaSync: function (s) {
			try {
				if (oipfObjectFactory.isObjectSupported('application/hbbtvMediaSynchroniser')) {
					log.info("SetupBroadcastObject: createMediaSynchroniser");
					mSync = oipfObjectFactory.createMediaSynchroniser();
					log.info("SetupBroadcastObject: initMediaSynchroniser");
					mSync.initMediaSynchroniser(bo,	s);				
				} else {
					log.error("application/hbbtvMediaSynchroniser not supported.");
				}
			} catch (err) {
				log.error("Exception when creating creating hbbtvMediaSynchroniser Object. Error: " + err.message);
			}
			curState = STATE_WATCHING_BT;
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
			curState = STATE_WATCHING_BT;
		},
		
		getId: function () {
			return id;
		},
		
		getCurrentTime: function () {
			return currentTime();
		}
	};
}
