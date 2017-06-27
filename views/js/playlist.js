function getPlaylist(idx, playlistReadyCallback) {

	var url = "./playlists/playlist" + idx + ".json";

	function log(msg) {
		mVid.Log.info("Playlist: " + msg);
	}

	function logErr(msg) {
		mVid.Log.error("Playlist: " + msg);
	}


	log("Get playlist - url: " + url);
	
	function callback(json, xhr) {
		try {
			var playlistObj = JSON.parse(json);
			//log(JSON.stringify(playlistObj));
			playlistReadyCallback && playlistReadyCallback(idx, playlistObj);
		} catch(e) {
			logErr(e);			
		}
	}

	function ajax(url, callback, x) {
		try {
			x = new (this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
			x.open('GET', url, 1);
			x.setRequestHeader('Content-type', 'application/json');
			x.onreadystatechange = function() {
				x.readyState > 3 && callback && callback(x.responseText, x);
			};
			x.send();
		} catch (e) {
			logErr(e);
		}
	};

	ajax(url, callback);
}