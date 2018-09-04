// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// TV UI                                                                                   //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

function InitTVUI() {

	var prevMSyncTm = "";
	
	
	// Icon table
	playIconTable = [
		{	state: PLAYSTATE_STOP, 	icon: "player-stop"	},
		{	state: PLAYSTATE_PLAY, 	icon: "player-play"	},
		{ 	state: PLAYSTATE_PAUSE, icon: "player-pause"},
		{	state: PLAYSTATE_REW, 	icon: "player-rew"	},
		{	state: PLAYSTATE_FWD, 	icon: "player-fwd"	}
	];

	e = function (id) {
	  return document.getElementById(id);
	}

	return {
		ShowPlayrange 	: function (r, d, pt) {
			var c = e("playbackBar").getBoundingClientRect();
			var offset = e("ad-start-point").getBoundingClientRect().width / 2;

			var x1, x2;
			
			if (r >= d) {
				x1 = c.left;
				x2 = c.right;			
			} else {
				var coef = (c.width / d);
				var t = pt;
				x1 =  (coef * r) + c.left;
				var endP = (r + t > d) ? d : r + t;
				
				x2 =  (coef * endP) + c.left;
			}
			
			e("ad-start-point").style.left 	= (x1 - offset) + "px";
			e("ad-resume-point").style.left = (x2 - offset) + "px";			
		},
		
		ShowBuffering	: function (b) {
			var bufferingIcon = e("player-buffering");
		
			if (b) {
				bufferingIcon.setAttribute("class", "playerBufferingIcon rotate");
			} else {
				bufferingIcon.setAttribute("class", "playerBufferingIcon");			
			}			
		},
		
		ShowPlayingState : function (state) {
			for (var s in playIconTable) {
				var playEl = e(playIconTable[s].icon);
				if (playEl) {
					if (playIconTable[s].state === state) {
						playEl.setAttribute("class", "playerIcon hilite");
					} else {
						playEl.setAttribute("class", "playerIcon");
					}
				}
			}
		},
		
		ShowEncrypted	: function (m) {
			e("encrypted").setAttribute("class", "playerIcon " + m);
		},
		
		ShowCurrentChannel	: function (c, s) {
			e("currentChannel") && (e("currentChannel").innerHTML = "Test " + c + " - " + s);
		},
		
		ShowSubs	: function (m) {
			e("subs").setAttribute("class", "playerIcon " + m);
		},
		
		ShowSecure	: function (b) {
			if (b) {
				e("padlock").setAttribute("class", "playerIcon showsecure");
			} else {
				e("padlock").setAttribute("class", "playerIcon");
			}
		},
		
		ShowMsyncTime : function (b) {
			var t = e("msync-time"); 
			if (t) {
				if (b) {
					t.setAttribute("class", "msync-text msync-show");
				} else {
					t.setAttribute("class", "msync-text msync-hide");
				}
			}
		},
		
		UpdateMSyncTime : function (tm, fps) {
			
			var timeMS = tm * 1000;
			
			var milliseconds = parseInt((timeMS%1000))
				, seconds = parseInt((timeMS/1000)%60)
				, minutes = parseInt((timeMS/(1000*60))%60);

			var frame = ("00" + parseInt(((timeMS * fps) / 1000) % fps)).slice(-2);
			
			minutes = ("00" + minutes).slice(-2);
			seconds = ("00" + seconds).slice(-2);
			milliseconds = ("000" + milliseconds).slice(-3);
			
			var txt = minutes + ":" + seconds + "-" + frame;
						
			var t = e("msync-time"); 
			if (t) {
				t.innerHTML = txt;
	
				if (txt != prevMSyncTm) {
					t.setAttribute("class", "msync-text msync-show");
				} else 
				{
					t.setAttribute("class", "msync-text msync-warn");
				}
			}
			
			prevMSyncTm = txt;
		}
	}
}
