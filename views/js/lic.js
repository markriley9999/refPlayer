function clearkeyGetLicence(session, msg, contentTag, video) {

	var keyServiceUrl = "./getkeys?tag=" + contentTag;


	// TODO: mVid should be a param
	function log(msg) {
		mVid.Log.info("Licence: " + msg);
	}

	function logerr(msg) {
		mVid.Log.error("Licence: " + msg);
	}

	function callback(licenseString, xhr) {
		log(licenseString);

		var len = licenseString.length;
		// Convert JSON string to ArrayBuffer
		var buf = new ArrayBuffer(len);
		var bView = new Uint8Array(buf);
		for (var i = 0; i < len; i++) {
			bView[i] = licenseString.charCodeAt(i);
		}

		session.update(bView).then(function() {
			video.bProcessingKey = false;
			log(' Session updated');
		}).catch(
			function(error) {
				logerr('Failed to update the session', error);
			}
		);
	}

	function arrayBufferToString(buffer){
		var arr = new Uint8Array(buffer);
		var str = String.fromCharCode.apply(String, arr);
		return str;
	}
	
	function ajax(url, callback, data, x) {
		try {
			x = new (this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
			x.open('POST', url, 1);
			x.setRequestHeader('Content-type', 'application/json');
			x.onreadystatechange = function() {
				x.readyState > 3 && callback && callback(x.responseText, x);
			};
			log(' AJAX url: ' + url);
			log(' AJAX send: ' + arrayBufferToString(data));
			x.send(new Uint8Array(data));
		} catch (e) {
			logerr(e);
		}
	};

	ajax(keyServiceUrl, callback, msg);
}
