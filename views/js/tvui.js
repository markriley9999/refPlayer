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
		}
		
	}
}
