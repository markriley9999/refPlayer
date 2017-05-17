function clearkeyGetLicence(session, msg) {

	//var keyServiceUrl = "http://itvpnp.test.ott.irdeto.com/ClearKey/getkeys?CrmId=itvpnp&AccountId=itvpnp&ContentId=1-9360-1784-001_20";
	var keyServiceUrl = "/getkeys?test";


	function log(msg) {
		mVid.Log.warn("Licence: " + msg);
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
			log(' Session updated');
		}).catch(
			function(error) {
				log('Failed to update the session', error);
			}
		);
	}

	function ajax(url, callback, data, x) {
		try {
			x = new (this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
			x.open('POST', url, 1);
			x.setRequestHeader('Content-type', 'application/json');
			x.onreadystatechange = function() {
				x.readyState > 3 && callback && callback(x.responseText, x);
			};
			x.send(new Uint8Array(data));
		} catch (e) {
			log(e);
		}
	};

	ajax(keyServiceUrl, callback, msg);
	log("msg->server: " + JSON.stringify(msg));
}
