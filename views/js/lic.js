function clearkeyGetLicence(session, msg, contentTag, video, logObj) {

	var keyServiceUrl = "./getkeys?tag=" + contentTag;


	// TODO: mVid should be a param
	function log(m) {
		logObj.info("Licence: " + m);
	}

	function logerr(msg) {
		logObj.error("Licence: " + m);
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
	
	function ajax() {
		try {
			var x = new (this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
			x.open('POST', keyServiceUrl, 1);
			x.setRequestHeader('Content-type', 'application/json');
			x.onreadystatechange = function() {
				x.readyState > 3 && callback && callback(x.responseText, x);
			};
			log(' AJAX url: ' + keyServiceUrl);
			log(' AJAX send: ' + arrayBufferToString(msg));
			x.send(new Uint8Array(msg));
		} catch (e) {
			logerr(e);
		}
	};

	ajax();
}
