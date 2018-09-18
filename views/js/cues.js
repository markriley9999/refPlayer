// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// Cues                                                                                    //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

function InitCues(o) {

	const default_event_schemeIdUri = "urn:scte:scte35:2014:xml+bin"
	const default_event_value = "1"

	var trackDispatchType;

	if (o.eventSchemeIdUri) {
		trackDispatchType = o.eventSchemeIdUri;
	} else {
		trackDispatchType = default_event_schemeIdUri + " " + default_event_value;
	}
	
	if (o.params.overrideSubs)
	{
        o.log.warn("Force subtitles: " + o.params.overrideSubs);
	}
	
	cueImages = [];

	e = function (id) {
	  return document.getElementById(id);
	}

	var mainVideo = e("mVid-mainContent");
	var bSysSubsEnabled = false;
	
	if (o.cfg) {
		bSysSubsEnabled = o.cfg.configuration.subtitlesEnabled;
		o.log.info("System Subs: " + (bSysSubsEnabled ? "Enabled" : "Disabled"));
	}
	
	function arrayBufferToString(buffer) {
		var arr = new Uint8Array(buffer);
		var str = String.fromCharCode.apply(String, arr);
		return str;
	}

	function ShowCues () {
		
		var p = null;
		
		if (o.fGetCurrentPlayingVideo) {
			p = o.fGetCurrentPlayingVideo();
		}
		
		if (!p || !p.duration || isNaN(p.duration)) {
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

			if (o.params.bEventsDump && track)
			{
				o.log.info("Track #" + t); 
				o.log.info("Track inBandMetadataTrackDispatchType (" + trackDispatchType + "): " + "*" + track.inBandMetadataTrackDispatchType + "*");
				o.log.info("Track Info: track - kind: " + track.kind + " label: " +  track.label + " id: " + track.id);			
			}
			
			if (	track && track.cues &&
					(track.kind === 'metadata') && 
					(track.inBandMetadataTrackDispatchType.trim() === trackDispatchType) && 
					(track.cues.length > 0)) {
				for (var i = 0; i < track.cues.length; ++i) {
					var cue = track.cues[i];

					if ((cue !== null) && (cue.endTime > cue.startTime)) {
						if (cue.startTime > 0) {
							x =  (coef * cue.startTime) + c.left;
							imgIndex = Math.floor(x / 16);
							
							if (!cueImages[imgIndex]) {
								cueImages[imgIndex] = imgobj.cloneNode(false);
								e("playrange").appendChild(cueImages[imgIndex]);
							}
							
							cueImages[imgIndex].setAttribute("class", "ad-arrow");
							cueImages[imgIndex].style.left = (x - offset) + "px";
							if (o.params.bEventsDump) {
								o.log.info("(" + track.kind + ") Show Cue:  Cue - start: " + cue.startTime + " end: " +  cue.endTime + " id: " + cue.id + " data: " + arrayBufferToString(cue.data));
							}								
						}
					} else {
						o.log.warn("Show Cue: zero length cue - this is probably wrong.");			
					}
				}
			} else if (track && ((track.kind === 'subtitles') || (track.kind === 'captions'))) {
				// Force subs on?
				if (o.params.overrideSubs === 'on'){
					track.mode = 'showing';
				} else if (o.params.overrideSubs === 'off'){
					track.mode = 'disabled';
				}

				if (o.cfg && o.cfg.configuration) {
					bSysSubsEnabled = o.cfg.configuration.subtitlesEnabled;
					if (bSysSubsEnabled) {
						if (track.mode === 'showing') {
							o.tvui.ShowSubs("subson");
						} else {
							o.tvui.ShowSubs("subsoff");
						}
					}
				} else {
					o.tvui.ShowSubs("hidden");
				}
			}
		}
	}

	window.setInterval( function() {
		ShowCues();	
	}, 10000);	
		
	mainVideo.textTracks.onaddtrack = function (event) {
		var textTrack = event.track;
		
		function parseSCTE(d) {
			var s = arrayBufferToString(d);
			var r;
			
			/* --- Example scte data --- *
			s = "<scte35:Signal><scte35:Binary>/TWFpbiBDb250ZW50</scte35:Binary></scte35:Signal>"; 
			******************************/

			if (o.params.bEventsDump) {
//<![CDATA[
				o.log.info("Parse SCTE: data: " + s);
//]]>		
			}
			
			try {
				if (!o.params.bPartialSCTE) {
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
					o.log.info("Parsing partial scte data");
					r = window.atob(s.replace(/\s/g,'').substr(1));
				}
			} catch (err) {
				r = "Event Data Error";
			}
			
			if (o.params.bEventsDump) {
				o.log.info("Parsed SCTE: " + r);
			}
			
			return r;
		}
		
		if ((textTrack.kind === 'metadata') && (textTrack.inBandMetadataTrackDispatchType.trim() === trackDispatchType)) {
			
			ShowCues();

			textTrack.oncuechange = function () {
				var cue;

				ShowCues();
				
				if (o.params.bEventsDump) {
					o.log.info("oncuechange: textTrack - kind: " + textTrack.kind + " label: " +  textTrack.label + " id: " + textTrack.id);			
				}
				
				for (var i = 0; i < textTrack.activeCues.length; ++i) {

					cue = textTrack.activeCues[i];

					if (cue && (cue.endTime > cue.startTime)) {
						var f = e("flag");
						var cd = e("cuedata");
						var s = parseSCTE(cue.data);
						
						if (o.params.bEventsDump) {
							o.log.info("Active Cue:  Cue - start: " + cue.startTime + " end: " +  cue.endTime + " id: " + cue.id + " data: " + arrayBufferToString(cue.data));
						}							
						f.setAttribute("class", "playerIcon flag");
						if (o.fUpdateBufferStatus) {
							o.fUpdateBufferStatus(mainVideo.id, "Event: Cue Start");
						}
						cd.innerHTML = "Cue Event: " + s;
						
						cue.onexit = function (ev) {
							f.setAttribute("class", "playerIcon");
							if (o.fUpdateBufferStatus) {
								o.fUpdateBufferStatus(mainVideo.id, "Event: Cue End");
							}
							cd.innerHTML = "";
						}
						return;
					}
				}
			}
		}
	};		

	return {
		
		CheckSubs		: function() {
			if (bSysSubsEnabled) {
				o.tvui.ShowSubs("nosubs");
			} else {
				o.tvui.ShowSubs("hidden");
			}
		},
		
		OverrideSubs		: function (v) {
			o.params.overrideSubs = v;
		},
		
		ToggleOverrideSub	: function () {
			if (o.params.overrideSubs === 'on'){
				o.params.overrideSubs = 'off';
			} else if (o.params.overrideSubs === 'off'){
				o.params.overrideSubs = 'on';
			} else {
				o.params.overrideSubs = 'off';
			}
		}
		
	}
}

