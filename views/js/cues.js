// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// Cues                                                                                    //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

function InitCues(log, tvui, bEventsDump, overrideSubs, cfg, bPartialSCTE, fGetCurrentPlayingVideo, fUpdateBufferStatus) {

	//const event_schemeIdUri = "tag:refplayer.digitaluk.co.uk,2017:events/dar" 
	const event_schemeIdUri = "urn:scte:scte35:2014:xml+bin"
	const event_value = "1"

	cueImages = [];

	e = function (id) {
	  return document.getElementById(id);
	}

	var mainVideo = e("mVid-mainContent");
	var trackDispatchType = event_schemeIdUri + " " + event_value;
	var bSysSubsEnabled = false;
	
	function arrayBufferToString(buffer) {
		var arr = new Uint8Array(buffer);
		var str = String.fromCharCode.apply(String, arr);
		return str;
	}

	function ShowCues () {
		
		var p = null;
		
		if (fGetCurrentPlayingVideo) {
			p = fGetCurrentPlayingVideo();
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

			if (bEventsDump && track)
			{
				log.info("Track #" + t); 
				log.info("Track inBandMetadataTrackDispatchType (" + trackDispatchType + "): " + track.inBandMetadataTrackDispatchType);
				log.info("Track Info: track - kind: " + track.kind + " label: " +  track.label + " id: " + track.id);			
			}
			
			if (	track && track.cues &&
					(track.kind === 'metadata') && 
					(track.inBandMetadataTrackDispatchType === trackDispatchType) && 
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
							if (bEventsDump) {
								log.info("(" + track.kind + ") Show Cue:  Cue - start: " + cue.startTime + " end: " +  cue.endTime + " id: " + cue.id + " data: " + arrayBufferToString(cue.data));
							}								
						}
					} else {
						log.warn("Show Cue: zero length cue - this is probably wrong.");			
					}
				}
			} else if (track && ((track.kind === 'subtitles') || (track.kind === 'captions'))) {
				// Force subs on?
				if (overrideSubs === 'on'){
					track.mode = 'showing';
				} else if (overrideSubs === 'off'){
					track.mode = 'disabled';
				}

				if (cfg && cfg.configuration) {
					bSysSubsEnabled = cfg.configuration.subtitlesEnabled;
					if (bSysSubsEnabled) {
						if (track.mode === 'showing') {
							tvui.ShowSubs("subson");
						} else {
							tvui.ShowSubs("subsoff");
						}
					}
				} else {
					tvui.ShowSubs("hidden");
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

			if (bEventsDump) {
//<![CDATA[
				log.info("Parse SCTE: data: " + s);
//]]>		
			}
			
			try {
				if (!bPartialSCTE) {
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
					log.info("Parsing partial scte data");
					r = window.atob(s.replace(/\s/g,'').substr(1));
				}
			} catch (err) {
				r = "Event Data Error";
			}
			
			if (bEventsDump) {
				log.info("Parsed SCTE: " + r);
			}
			
			return r;
		}
		
		if ((textTrack.kind === 'metadata') && (textTrack.inBandMetadataTrackDispatchType === trackDispatchType)) {
			
			ShowCues();

			textTrack.oncuechange = function () {
				var cue;

				ShowCues();
				
				if (bEventsDump) {
					log.info("textTrack - kind: " + textTrack.kind + " label: " +  textTrack.label + " id: " + textTrack.id);			
				}
				
				for (var i = 0; i < textTrack.activeCues.length; ++i) {

					cue = textTrack.activeCues[i];

					if (cue && (cue.endTime > cue.startTime)) {
						var f = e("flag");
						var cd = e("cuedata");
						var s = parseSCTE(cue.data);
						
						if (bEventsDump) {
							log.info("Active Cue:  Cue - start: " + cue.startTime + " end: " +  cue.endTime + " id: " + cue.id + " data: " + arrayBufferToString(cue.data));
						}							
						f.setAttribute("class", "playerIcon flag");
						if (fUpdateBufferStatus) {
							fUpdateBufferStatus(mainVideo.id, "Event: Cue Start");
						}
						cd.innerHTML = "Cue Event: " + s;
						
						cue.onexit = function (ev) {
							f.setAttribute("class", "playerIcon");
							if (fUpdateBufferStatus) {
								fUpdateBufferStatus(mainVideo.id, "Event: Cue End");
							}
							cd.innerHTML = "";
						}
						return;
					}
				}
			}
		}
	};		
	
}

